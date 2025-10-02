#!/bin/bash

# Fix Deployment Script
# Run this on your EC2 instance to fix the deployment

echo "🔧 FIXING DEPLOYMENT"
echo "===================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Step 1: Check if we're in the right directory
print_status "Checking current directory..."
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

# Step 2: Navigate to application directory
if [ -d "/home/ubuntu/app" ]; then
    print_status "Found application in /home/ubuntu/app"
    cd /home/ubuntu/app
elif [ -d "/var/www/immigration-portal" ]; then
    print_status "Found application in /var/www/immigration-portal"
    cd /var/www/immigration-portal
else
    print_error "Application directory not found!"
    exit 1
fi

# Step 3: Check if backend directory exists
if [ ! -d "backend" ]; then
    print_error "Backend directory not found!"
    exit 1
fi

# Step 4: Check if .env file exists
if [ ! -f "backend/.env" ]; then
    print_warning ".env file not found, creating basic one..."
    cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://ibuyscrap.ca
MONGODB_URI=mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/?retryWrites=true&w=majority&appName=RCICDB
JWT_SECRET=your_very_secure_production_secret
JWT_EXPIRES_IN=7d
MAIN_DOMAIN=ibuyscrap.ca
TENANT_DOMAIN_PREFIX=immigration-portal
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=Qwsaqwsa!@34
SENTRY_DSN=https://1fed6693d06ca399d6d51b27adb20797@o4510120878145536.ingest.us.sentry.io/4510120957050880
SENTRY_RELEASE=1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
NEW_RELIC_APP_NAME=Immigration Portal
NEW_RELIC_ENABLED=true
APP_NAME=Immigration Portal
ALLOW_START_WITHOUT_DB=false
EOF
    print_success "Basic .env file created"
fi

# Step 5: Install dependencies if needed
print_status "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Step 6: Build backend if needed
print_status "Building backend..."
if [ ! -d "dist" ]; then
    npm run build
    print_success "Backend built"
else
    print_success "Backend already built"
fi

# Step 7: Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
fi

# Step 8: Stop any existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Step 9: Start the application with PM2
print_status "Starting application with PM2..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
    print_success "Application started with ecosystem config"
else
    pm2 start dist/server.js --name "immigration-portal" --env production
    print_success "Application started directly"
fi

# Step 10: Save PM2 configuration
pm2 save
pm2 startup

# Step 11: Check PM2 status
print_status "Checking PM2 status..."
pm2 status

# Step 12: Check if application is running on port 5000
print_status "Checking if application is running on port 5000..."
sleep 5
if netstat -tlnp | grep :5000 > /dev/null; then
    print_success "Application is running on port 5000"
else
    print_error "Application is not running on port 5000"
    print_status "Checking PM2 logs..."
    pm2 logs --lines 20
fi

# Step 13: Check Redis
print_status "Checking Redis..."
if systemctl is-active --quiet redis-server; then
    print_success "Redis is running"
else
    print_warning "Redis is not running, starting it..."
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
fi

# Step 14: Check Nginx
print_status "Checking Nginx..."
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_warning "Nginx is not running, starting it..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

print_success "Deployment fix completed!"
print_status "Check PM2 status with: pm2 status"
print_status "Check logs with: pm2 logs"
print_status "Your app should be accessible at: http://$(curl -s ifconfig.me):5000"
