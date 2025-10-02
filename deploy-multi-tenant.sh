#!/bin/bash

# deploy-multi-tenant.sh
# Enhanced deployment script for multi-tenant Immigration Portal with Cloudflare and Nginx

set -e  # Exit on any error

# --- Configuration ---
EC2_PUBLIC_IP="18.220.224.109"
BACKEND_PORT="5000"
FRONTEND_PORT="5174"
NGINX_CONFIG_FILE="/etc/nginx/sites-available/multi-tenant"
NGINX_SYMLINK="/etc/nginx/sites-enabled/multi-tenant"
APP_DIR="/var/www/immigration-appV1"
LOG_FILE="/var/log/multi-tenant-deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOG_FILE
}

# --- 1. System Update and Prerequisites ---
log "🚀 Starting Multi-Tenant Immigration Portal Deployment..."

log "📦 Updating system packages..."
sudo apt update -y
sudo apt upgrade -y

log "🔧 Installing prerequisites..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# --- 2. Node.js and PM2 Setup ---
log "📦 Setting up Node.js and PM2..."

# Install Node.js 18.x if not present
if ! command -v node &> /dev/null; then
    log "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2..."
    sudo npm install -g pm2
fi

# --- 3. Application Setup ---
log "📁 Setting up application directory..."

# Create app directory if it doesn't exist
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Navigate to app directory
cd $APP_DIR || { error "Failed to change directory to $APP_DIR"; exit 1; }

# Clone or update repository (if deploying from Git)
# git clone https://github.com/your-repo/immigration-appV1.git . || true
# git pull origin main || true

# Install dependencies
log "📦 Installing backend dependencies..."
cd backend
npm install --production

log "📦 Installing frontend dependencies..."
cd ../frontend
npm install --production

# Build frontend
log "🏗️ Building frontend for production..."
npm run build

cd ..

# --- 4. Environment Configuration ---
log "⚙️ Configuring environment variables..."

# Create production .env file if it doesn't exist
if [ ! -f "backend/.env.production" ]; then
    log "Creating production environment file..."
    cat > backend/.env.production << EOF
NODE_ENV=production
PORT=$BACKEND_PORT
MONGODB_URI=\${MONGODB_URI}
JWT_SECRET=\${JWT_SECRET}
JWT_REFRESH_SECRET=\${JWT_REFRESH_SECRET}
FRONTEND_URL=https://ibuyscrap.ca
SUPER_ADMIN_FRONTEND_URL=https://ibuyscrap.ca
TENANT_FRONTEND_URL_TEMPLATE=https://{domain}/immigration-portal
ALLOWED_SUPER_ADMIN_DOMAINS=ibuyscrap.ca,www.ibuyscrap.ca
ALLOW_START_WITHOUT_DB=false
REDIS_ENABLED=false
NEW_RELIC_LICENSE_KEY=\${NEW_RELIC_LICENSE_KEY}
NEW_RELIC_APP_NAME=Immigration portal
NEW_RELIC_AI_MONITORING_ENABLED=true
SUPER_ADMIN_DOMAIN=ibuyscrap.ca
TENANT_DOMAIN_PREFIX=immigration-portal
API_BASE_URL=ibuyscrap.ca
EC2_PUBLIC_IP=$EC2_PUBLIC_IP
EC2_PRIVATE_IP=\${EC2_PRIVATE_IP}
EC2_PUBLIC_DNS=\${EC2_PUBLIC_DNS}
TENANT_API_BASE_URL=https://{domain}/immigration-portal
TENANT_API_VERSION=v1
CLOUDFLARE_API_TOKEN=\${CLOUDFLARE_API_TOKEN}
CLOUDFLARE_ZONE_ID=\${CLOUDFLARE_ZONE_ID}
CLOUDFLARE_ACCOUNT_ID=\${CLOUDFLARE_ACCOUNT_ID}
MAIN_DOMAIN=ibuyscrap.ca
EOF
    warning "Please update backend/.env.production with your actual values"
fi

# --- 5. Nginx Configuration ---
log "🌐 Configuring Nginx for multi-tenant setup..."

# Backup existing Nginx config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S) || true

# Create multi-tenant Nginx configuration
sudo tee $NGINX_CONFIG_FILE > /dev/null << 'EOF'
# Multi-tenant Nginx configuration for Immigration Portal

# Upstream definitions
upstream backend_api {
    server localhost:5000;
    keepalive 32;
}

upstream frontend_app {
    server localhost:5174;
    keepalive 32;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/s;

# Main server block for Super Admin (ibuyscrap.ca)
server {
    listen 80;
    listen [::]:80;
    server_name ibuyscrap.ca www.ibuyscrap.ca;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Super Admin Frontend
    location / {
        proxy_pass http://frontend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend_app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Super Admin API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend_api/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # API specific headers
        proxy_set_header Content-Type application/json;
        proxy_set_header Accept application/json;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend_api/health;
        access_log off;
    }
}

# Tenant server block (catch-all for tenant domains)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Tenant API endpoints
    location /api/v1/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend_api/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Tenant-Domain $host;
        
        # API specific headers
        proxy_set_header Content-Type application/json;
        proxy_set_header Accept application/json;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Tenant login page
    location /immigration-portal/login {
        proxy_pass http://frontend_app/tenant-login.html;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Tenant-Domain $host;
    }

    # Tenant dashboard page
    location /immigration-portal/dashboard {
        proxy_pass http://frontend_app/tenant-dashboard.html;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Tenant-Domain $host;
    }

    # Tenant static assets
    location /immigration-portal-assets/ {
        proxy_pass http://frontend_app/assets/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache static assets
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend_api/health;
        access_log off;
    }

    # Default fallback
    location / {
        return 200 '<!DOCTYPE html>
<html>
<head>
    <title>Immigration Portal - Tenant Setup Required</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #333; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Immigration Portal</h1>
        <p>This domain is not yet configured as a tenant.</p>
        <p>Please contact your administrator to set up your immigration portal access.</p>
        <p>Domain: $host</p>
    </div>
</body>
</html>';
        add_header Content-Type text/html;
    }
}
EOF

# Enable the configuration
sudo ln -sf $NGINX_CONFIG_FILE $NGINX_SYMLINK

# Remove default Nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
log "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    log "✅ Nginx configuration is valid"
else
    error "❌ Nginx configuration has errors"
    exit 1
fi

# --- 6. Start Services ---
log "🚀 Starting services..."

# Stop existing PM2 processes
pm2 stop all || true
pm2 delete all || true

# Start backend
log "🔧 Starting backend with PM2..."
cd backend
pm2 start dist/server.js --name "immigration-backend" --time --env production

# Start frontend (serve static files)
log "🌐 Starting frontend static server..."
cd ../frontend
pm2 start "npx serve -s dist -l $FRONTEND_PORT" --name "immigration-frontend" --time

# Save PM2 configuration
pm2 save
pm2 startup

# --- 7. Firewall Configuration ---
log "🔥 Configuring firewall..."

# Configure UFW
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow $BACKEND_PORT/tcp
sudo ufw allow $FRONTEND_PORT/tcp
sudo ufw --force enable

# --- 8. Start Nginx ---
log "🌐 Starting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# --- 9. Health Check ---
log "🏥 Performing health checks..."

# Wait for services to start
sleep 10

# Check backend health
if curl -f http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    log "✅ Backend health check passed"
else
    warning "⚠️ Backend health check failed"
fi

# Check frontend
if curl -f http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    log "✅ Frontend health check passed"
else
    warning "⚠️ Frontend health check failed"
fi

# Check Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    log "✅ Nginx health check passed"
else
    warning "⚠️ Nginx health check failed"
fi

# --- 10. SSL Setup Instructions ---
log "🔒 SSL Setup Instructions:"
info "To enable SSL certificates, run the following commands:"
info "sudo certbot --nginx -d ibuyscrap.ca -d www.ibuyscrap.ca"
info "sudo certbot --nginx -d your-tenant-domain.com"

# --- 11. Cloudflare Setup Instructions ---
log "☁️ Cloudflare Setup Instructions:"
info "1. Add your Cloudflare API credentials to backend/.env.production:"
info "   - CLOUDFLARE_API_TOKEN=your_api_token"
info "   - CLOUDFLARE_ZONE_ID=your_zone_id"
info "   - CLOUDFLARE_ACCOUNT_ID=your_account_id"
info "2. Restart the backend: pm2 restart immigration-backend"

# --- 12. Final Status ---
log "🎉 Multi-tenant deployment completed!"
log "📊 Service Status:"
pm2 list

log "🌐 Access URLs:"
info "Super Admin: http://$EC2_PUBLIC_IP (will redirect to ibuyscrap.ca after DNS setup)"
info "API Health: http://$EC2_PUBLIC_IP/health"
info "Tenant Login: http://$EC2_PUBLIC_IP/immigration-portal/login"

log "📝 Next Steps:"
info "1. Configure DNS for ibuyscrap.ca to point to $EC2_PUBLIC_IP"
info "2. Set up SSL certificates with Certbot"
info "3. Configure Cloudflare API credentials"
info "4. Test tenant creation through the Super Admin panel"

log "✅ Deployment completed successfully!"
