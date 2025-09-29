#!/bin/bash

# Deploy Multi-Tenant Immigration Portal Setup
# This script sets up the tenant domain configuration on EC2

set -e

echo "🚀 Starting Multi-Tenant Immigration Portal Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EC2_IP="52.15.148.97"
TENANT_DOMAIN="honeynwild.com"
SUPER_ADMIN_DOMAIN="ibuyscrap.ca"
BACKEND_PORT="5000"
FRONTEND_PORT="5174"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  - EC2 IP: $EC2_IP"
echo "  - Tenant Domain: $TENANT_DOMAIN"
echo "  - Super Admin Domain: $SUPER_ADMIN_DOMAIN"
echo "  - Backend Port: $BACKEND_PORT"
echo "  - Frontend Port: $FRONTEND_PORT"
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Function to run commands on EC2
run_on_ec2() {
    echo -e "${YELLOW}🔧 Running on EC2: $1${NC}"
    ssh -o StrictHostKeyChecking=no ubuntu@$EC2_IP "$1"
}

echo -e "${BLUE}📦 Step 1: Installing Dependencies${NC}"

# Update system packages
run_on_ec2 "sudo apt update && sudo apt upgrade -y"
print_status $? "System packages updated"

# Install Nginx
run_on_ec2 "sudo apt install nginx -y"
print_status $? "Nginx installed"

# Install Node.js (if not already installed)
run_on_ec2 "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
print_status $? "Node.js installed"

# Install PM2 globally
run_on_ec2 "sudo npm install -g pm2"
print_status $? "PM2 installed"

echo -e "${BLUE}📁 Step 2: Setting up Directory Structure${NC}"

# Create tenant directories
run_on_ec2 "sudo mkdir -p /var/www/$TENANT_DOMAIN"
run_on_ec2 "sudo mkdir -p /var/www/$SUPER_ADMIN_DOMAIN"
run_on_ec2 "sudo mkdir -p /var/log/nginx"
print_status $? "Directory structure created"

# Set proper permissions
run_on_ec2 "sudo chown -R ubuntu:ubuntu /var/www"
run_on_ec2 "sudo chmod -R 755 /var/www"
print_status $? "Directory permissions set"

echo -e "${BLUE}🌐 Step 3: Configuring Nginx${NC}"

# Create Nginx configuration
cat > nginx.conf << EOF
# Nginx Configuration for Multi-Tenant Immigration Portal

# Main server block for super admin (ibuyscrap.ca)
server {
    listen 80;
    server_name ibuyscrap.ca www.ibuyscrap.ca;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Super Admin Frontend
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Super Admin API
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Tenant server block for honeynwild.com
server {
    listen 80;
    server_name honeynwild.com www.honeynwild.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Tenant-specific API endpoints
    location /immigration-portal/api/ {
        proxy_pass http://localhost:$BACKEND_PORT/api/v1/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Add tenant context headers
        proxy_set_header X-Tenant-Domain honeynwild.com;
        proxy_set_header X-Tenant-Name "Honey & Wild Night Club";
    }
    
    # Tenant login page
    location /login {
        alias /var/www/honeynwild.com/tenant-login.html;
        try_files \$uri \$uri/ =404;
    }
    
    # Tenant dashboard
    location /dashboard {
        alias /var/www/honeynwild.com/tenant-dashboard.html;
        try_files \$uri \$uri/ =404;
    }
    
    # Default tenant frontend
    location / {
        return 301 /login;
    }
}

# Default server block (catch-all for unknown domains)
server {
    listen 80 default_server;
    server_name _;
    return 404;
}
EOF

# Copy Nginx configuration to EC2
scp -o StrictHostKeyChecking=no nginx.conf ubuntu@$EC2_IP:/tmp/nginx.conf
run_on_ec2 "sudo cp /tmp/nginx.conf /etc/nginx/sites-available/immigration-portal"
run_on_ec2 "sudo ln -sf /etc/nginx/sites-available/immigration-portal /etc/nginx/sites-enabled/"
run_on_ec2 "sudo rm -f /etc/nginx/sites-enabled/default"
print_status $? "Nginx configuration deployed"

# Test Nginx configuration
run_on_ec2 "sudo nginx -t"
print_status $? "Nginx configuration test passed"

# Restart Nginx
run_on_ec2 "sudo systemctl restart nginx"
run_on_ec2 "sudo systemctl enable nginx"
print_status $? "Nginx restarted and enabled"

echo -e "${BLUE}📄 Step 4: Deploying Tenant Pages${NC}"

# Copy tenant pages to EC2
scp -o StrictHostKeyChecking=no frontend/public/tenant-login.html ubuntu@$EC2_IP:/tmp/
scp -o StrictHostKeyChecking=no frontend/public/tenant-dashboard.html ubuntu@$EC2_IP:/tmp/

run_on_ec2 "sudo cp /tmp/tenant-login.html /var/www/$TENANT_DOMAIN/"
run_on_ec2 "sudo cp /tmp/tenant-dashboard.html /var/www/$TENANT_DOMAIN/"
print_status $? "Tenant pages deployed"

echo -e "${BLUE}🔧 Step 5: Setting up SSL (Let's Encrypt)${NC}"

# Install Certbot
run_on_ec2 "sudo apt install certbot python3-certbot-nginx -y"
print_status $? "Certbot installed"

# Get SSL certificates
echo -e "${YELLOW}🔒 Getting SSL certificates...${NC}"
echo "You'll need to run these commands manually on the EC2 instance:"
echo ""
echo "sudo certbot --nginx -d $SUPER_ADMIN_DOMAIN -d www.$SUPER_ADMIN_DOMAIN"
echo "sudo certbot --nginx -d $TENANT_DOMAIN -d www.$TENANT_DOMAIN"
echo ""

echo -e "${BLUE}📊 Step 6: Final Configuration${NC}"

# Create systemd service for the application
cat > immigration-portal.service << EOF
[Unit]
Description=Immigration Portal Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/immigration-appV1
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Copy service file to EC2
scp -o StrictHostKeyChecking=no immigration-portal.service ubuntu@$EC2_IP:/tmp/
run_on_ec2 "sudo cp /tmp/immigration-portal.service /etc/systemd/system/"
run_on_ec2 "sudo systemctl daemon-reload"
print_status $? "Systemd service configured"

echo -e "${GREEN}🎉 Multi-Tenant Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Configure DNS records in cPanel:"
echo "   - $TENANT_DOMAIN → $EC2_IP"
echo "   - www.$TENANT_DOMAIN → $EC2_IP"
echo "   - $SUPER_ADMIN_DOMAIN → $EC2_IP"
echo "   - www.$SUPER_ADMIN_DOMAIN → $EC2_IP"
echo ""
echo "2. Get SSL certificates:"
echo "   ssh ubuntu@$EC2_IP"
echo "   sudo certbot --nginx -d $TENANT_DOMAIN -d www.$TENANT_DOMAIN"
echo "   sudo certbot --nginx -d $SUPER_ADMIN_DOMAIN -d www.$SUPER_ADMIN_DOMAIN"
echo ""
echo "3. Test the setup:"
echo "   - Super Admin: https://$SUPER_ADMIN_DOMAIN"
echo "   - Tenant Login: https://$TENANT_DOMAIN/login"
echo "   - Tenant Dashboard: https://$TENANT_DOMAIN/dashboard"
echo ""
echo -e "${GREEN}✅ Deployment script completed!${NC}"
