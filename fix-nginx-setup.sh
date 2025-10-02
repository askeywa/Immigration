#!/bin/bash

echo "🚀 Automated Nginx Setup for Immigration Portal"
echo "==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}This script will automatically set up Nginx to make your app accessible via domain.${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Use: sudo ./fix-nginx-setup.sh"
    exit 1
fi

print_status "Starting Nginx setup..."

# Step 1: Update system
print_status "Updating system packages..."
sudo apt update

# Step 2: Install Nginx
print_status "Installing Nginx..."
sudo apt install nginx -y

# Step 3: Start and enable Nginx
print_status "Starting and enabling Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Step 4: Check Nginx status
print_status "Checking Nginx status..."
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx failed to start"
    exit 1
fi

# Step 5: Create Nginx configuration
print_status "Creating Nginx configuration for immigration-portal..."
sudo tee /etc/nginx/sites-available/immigration-portal > /dev/null << 'EOF'
server {
    listen 80;
    server_name ibuyscrap.ca www.ibuyscrap.ca;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:5000/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Step 6: Enable the site
print_status "Enabling immigration-portal site..."
sudo ln -sf /etc/nginx/sites-available/immigration-portal /etc/nginx/sites-enabled/

# Step 7: Remove default site
print_status "Removing default Nginx site..."
sudo rm -f /etc/nginx/sites-enabled/default

# Step 8: Test Nginx configuration
print_status "Testing Nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 9: Reload Nginx
print_status "Reloading Nginx..."
sudo systemctl reload nginx

# Step 10: Configure firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 'Nginx Full'
sudo ufw allow 22  # SSH
sudo ufw allow 80  # HTTP
sudo ufw allow 443 # HTTPS

# Step 11: Test local access
print_status "Testing local access..."
sleep 2
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    print_success "Local access test passed"
else
    print_warning "Local access test failed - checking if app is running..."
    
    # Check PM2 status
    print_status "Checking PM2 status..."
    pm2 status
    
    # Check if app is listening on port 5000
    print_status "Checking if app is listening on port 5000..."
    if sudo netstat -tlnp | grep :5000; then
        print_success "App is listening on port 5000"
    else
        print_error "App is not listening on port 5000"
        print_status "Checking PM2 logs..."
        pm2 logs immigration-portal --lines 10
    fi
fi

# Step 12: Final status check
print_status "Final status check..."
echo ""
echo "📊 Current Status:"
echo "=================="
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""
echo "Listening Ports:"
sudo netstat -tlnp | grep -E ':(80|443|5000)'
echo ""
echo "Firewall Status:"
sudo ufw status
echo ""

print_success "Nginx setup completed!"
echo ""
echo -e "${GREEN}🎉 Next Steps:${NC}"
echo "1. Test your domain: http://ibuyscrap.ca"
echo "2. Check AWS Security Group allows ports 80 and 443"
echo "3. If still getting 522 error, check Cloudflare settings"
echo ""
echo -e "${YELLOW}Test Commands:${NC}"
echo "curl http://18.220.224.109"
echo "curl http://localhost"
echo "curl http://localhost/api/health"
echo ""
echo -e "${BLUE}If issues persist, check:${NC}"
echo "• AWS Security Group rules"
echo "• Cloudflare DNS settings"
echo "• Application logs: pm2 logs immigration-portal"
