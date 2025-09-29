#!/bin/bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🚀 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Error handling
handle_error() {
    print_error "Deployment failed at line $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

print_status "Starting deployment..."

# Define variables
APP_DIR="/var/www/immigration-portal"
BRANCH="main"
BACKUP_DIR="/var/backups/immigration-portal-$(date +%Y%m%d_%H%M%S)"

# Create backup of current version
if [ -d "$APP_DIR" ]; then
    print_status "Creating backup of current version..."
    sudo mkdir -p "$(dirname "$BACKUP_DIR")"
    sudo cp -r "$APP_DIR" "$BACKUP_DIR"
    print_success "Backup created at $BACKUP_DIR"
fi

# Navigate to application directory
cd "$APP_DIR"

# Stop applications first to prevent conflicts
print_status "Stopping applications..."
pm2 stop immigration-api || true

# Ensure we're on the correct branch and clean state
print_status "Preparing git repository..."
git checkout "$BRANCH" || git checkout -b "$BRANCH"

# Clear any local changes that might interfere
git reset --hard HEAD
git clean -fd

# Update remote references and get latest commit info
print_status "Fetching latest changes..."
git fetch origin --prune --tags

# Get the latest commit hash from remote
REMOTE_HASH=$(git rev-parse "origin/$BRANCH")
LOCAL_HASH=$(git rev-parse HEAD)

print_status "Remote commit: $REMOTE_HASH"
print_status "Local commit: $LOCAL_HASH"

# Force update to latest remote version
print_status "Updating to latest version..."
git reset --hard "origin/$BRANCH"
git clean -fd

# Verify we now have the latest code
UPDATED_HASH=$(git rev-parse HEAD)
if [ "$UPDATED_HASH" = "$REMOTE_HASH" ]; then
    print_success "Successfully updated to latest version!"
    print_status "Latest commit: $(git log --oneline -1)"
else
    print_error "Failed to update to latest version!"
    exit 1
fi

# Build backend
print_status "Building backend..."
cd backend

# Clean previous builds
print_status "Cleaning backend build artifacts..."
rm -rf dist node_modules/.cache

# Install dependencies with clean cache
print_status "Installing backend dependencies..."
npm ci --cache /tmp/empty-cache

# Build TypeScript
print_status "Compiling TypeScript..."
npx tsc

# Verify backend build
if [ ! -d "dist" ]; then
    print_error "Backend build failed - dist directory not created"
    exit 1
fi

print_success "Backend built successfully!"

# Build frontend
print_status "Building frontend..."
cd ../frontend

# Clean previous builds
print_status "Cleaning frontend build artifacts..."
rm -rf dist node_modules/.cache .vite

# Install dependencies with clean cache
print_status "Installing frontend dependencies..."
npm ci --cache /tmp/empty-cache

# Build frontend with production environment
print_status "Building frontend application..."
NODE_ENV=production npm run build

# Verify frontend build
if [ ! -d "dist" ]; then
    print_error "Frontend build failed - dist directory not created"
    exit 1
fi

print_success "Frontend built successfully!"

# Deploy frontend
print_status "Deploying frontend..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/

print_success "Frontend deployed!"

# Start backend with PM2
print_status "Starting backend..."
cd ../backend

# Remove old PM2 process
pm2 delete immigration-api || true

# Start new process
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Verify backend is running
sleep 3
if pm2 list | grep -q "immigration-api.*online"; then
    print_success "Backend started successfully!"
else
    print_error "Backend failed to start!"
    
    # Show PM2 logs for debugging
    print_status "PM2 logs:"
    pm2 logs immigration-api --lines 20 || true
    
    # Restore from backup if available
    if [ -d "$BACKUP_DIR" ]; then
        print_warning "Attempting to restore from backup..."
        sudo rm -rf "$APP_DIR"
        sudo mv "$BACKUP_DIR" "$APP_DIR"
        cd "$APP_DIR/backend"
        pm2 start ecosystem.config.js --env production || true
    fi
    
    exit 1
fi

# Test nginx configuration and restart
print_status "Restarting nginx..."
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl restart nginx
    print_success "Nginx restarted successfully!"
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# Verify deployment
print_status "Verifying deployment..."

# Check if backend is responding
sleep 2
BACKEND_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="immigration-api") | .pm2_env.status' 2>/dev/null || echo "unknown")

if [ "$BACKEND_STATUS" = "online" ]; then
    print_success "Backend is running!"
else
    print_warning "Backend status: $BACKEND_STATUS"
fi

# Check nginx status
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running!"
else
    print_error "Nginx is not running!"
fi

# Clean up old backups (keep only last 5)
print_status "Cleaning up old backups..."
sudo find "$(dirname "$BACKUP_DIR")" -name "immigration-portal-*" -type d | sort -r | tail -n +6 | sudo xargs rm -rf

print_success "Deployment completed successfully!"
print_status "Deployed commit: $(git log --oneline -1)"
print_status "Deployment time: $(date)"

# Optional: Send notification (uncomment and configure as needed)
# curl -X POST -H 'Content-type: application/json' \
#   --data '{"text":"✅ Immigration portal deployed successfully!"}' \
#   YOUR_SLACK_WEBHOOK_URL