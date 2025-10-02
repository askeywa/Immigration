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

# Configure Redis
print_status "Configuring Redis..."
if ! command -v redis-server &> /dev/null; then
    print_status "Installing Redis..."
    sudo apt update
    sudo apt install redis-server redis-tools -y
fi

# Configure Redis with password
print_status "Setting up Redis configuration..."
REDIS_PASSWORD="Qwsaqwsa!@34"

# Ensure Redis environment variables are set in backend .env
print_status "Updating backend .env with Redis configuration..."
cd backend
if [ -f ".env" ]; then
    # Update or add Redis configuration
    if grep -q "REDIS_ENABLED=" .env; then
        sed -i 's/REDIS_ENABLED=.*/REDIS_ENABLED=true/' .env
    else
        echo "REDIS_ENABLED=true" >> .env
    fi
    
    if grep -q "REDIS_URL=" .env; then
        sed -i 's/REDIS_URL=.*/REDIS_URL=redis:\/\/localhost:6379/' .env
    else
        echo "REDIS_URL=redis://localhost:6379" >> .env
    fi
    
    if grep -q "REDIS_PASSWORD=" .env; then
        sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
    else
        echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> .env
    fi
    
    # Update or add Sentry configuration
    if grep -q "SENTRY_DSN=" .env; then
        sed -i 's|SENTRY_DSN=.*|SENTRY_DSN=https://1fed6693d06ca399d6d51b27adb20797@o4510120878145536.ingest.us.sentry.io/4510120957050880|' .env
    else
        echo "SENTRY_DSN=https://1fed6693d06ca399d6d51b27adb20797@o4510120878145536.ingest.us.sentry.io/4510120957050880" >> .env
    fi
    
    if grep -q "SENTRY_RELEASE=" .env; then
        sed -i 's/SENTRY_RELEASE=.*/SENTRY_RELEASE=1.0.0/' .env
    else
        echo "SENTRY_RELEASE=1.0.0" >> .env
    fi
    
    if grep -q "SENTRY_TRACES_SAMPLE_RATE=" .env; then
        sed -i 's/SENTRY_TRACES_SAMPLE_RATE=.*/SENTRY_TRACES_SAMPLE_RATE=0.1/' .env
    else
        echo "SENTRY_TRACES_SAMPLE_RATE=0.1" >> .env
    fi
    
    if grep -q "SENTRY_PROFILES_SAMPLE_RATE=" .env; then
        sed -i 's/SENTRY_PROFILES_SAMPLE_RATE=.*/SENTRY_PROFILES_SAMPLE_RATE=0.1/' .env
    else
        echo "SENTRY_PROFILES_SAMPLE_RATE=0.1" >> .env
    fi
    
    print_success "Backend .env updated with Redis and Sentry configuration!"
else
    print_warning "Backend .env file not found - creating with Redis configuration..."
    cat > .env <<EOF
# Redis Configuration
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Sentry Configuration
SENTRY_DSN=https://1fed6693d06ca399d6d51b27adb20797@o4510120878145536.ingest.us.sentry.io/4510120957050880
SENTRY_RELEASE=1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
EOF
    print_success "Backend .env created with Redis and Sentry configuration!"
fi
cd ..

# Backup original Redis config
sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup.$(date +%Y%m%d_%H%M%S)

# Update Redis configuration
sudo tee /etc/redis/redis.conf > /dev/null <<EOF
# Redis configuration for Immigration Portal
# Generated on $(date)

# Network
bind 127.0.0.1
port 6379
timeout 0
tcp-keepalive 300

# Security
requirepass $REDIS_PASSWORD

# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG ""

# Client management
maxclients 10000

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128
EOF

# Set proper permissions
sudo chown redis:redis /etc/redis/redis.conf
sudo chmod 640 /etc/redis/redis.conf

# Start and enable Redis
print_status "Starting Redis service..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis connection
if redis-cli -a "$REDIS_PASSWORD" ping | grep -q "PONG"; then
    print_success "Redis is working correctly!"
else
    print_error "Redis connection test failed!"
    exit 1
fi

# Configure firewall for Redis
print_status "Configuring Redis firewall..."
sudo ufw allow from 127.0.0.1 to any port 6379
sudo ufw deny 6379

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

# Check Redis status
print_status "Verifying Redis connection..."
if redis-cli -a "$REDIS_PASSWORD" ping | grep -q "PONG"; then
    print_success "Redis is running and accessible!"
else
    print_error "Redis connection failed!"
    print_status "Redis status:"
    sudo systemctl status redis-server || true
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