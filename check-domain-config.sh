#!/bin/bash

# Domain Configuration Check Script
# Run this on your EC2 instance to check domain configuration

echo "🌐 DOMAIN CONFIGURATION CHECK"
echo "============================="

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

# Check current IP
print_status "Checking current server IP..."
SERVER_IP=$(curl -s ifconfig.me)
echo "Server IP: $SERVER_IP"

# Check if your app is running on port 5000
print_status "Checking if application is running on port 5000..."
if netstat -tlnp | grep :5000 > /dev/null; then
    print_success "Application is running on port 5000"
    echo "You can access it at: http://$SERVER_IP:5000"
else
    print_error "Application is not running on port 5000"
fi

# Check Nginx configuration
print_status "Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/default" ]; then
    echo "Nginx default config exists"
    echo "Content:"
    cat /etc/nginx/sites-available/default | head -20
else
    print_warning "No Nginx default config found"
fi

# Check if there are any Nginx configs for ibuyscrap.ca
print_status "Checking for ibuyscrap.ca Nginx configuration..."
if [ -f "/etc/nginx/sites-available/ibuyscrap.ca" ]; then
    print_success "ibuyscrap.ca config found"
    echo "Content:"
    cat /etc/nginx/sites-available/ibuyscrap.ca
else
    print_warning "No ibuyscrap.ca config found"
fi

# Check Nginx status
print_status "Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
fi

# Check what's running on port 80 and 443
print_status "Checking ports 80 and 443..."
echo "Port 80:"
netstat -tlnp | grep :80 || echo "Nothing on port 80"
echo "Port 443:"
netstat -tlnp | grep :443 || echo "Nothing on port 443"

# Check DNS resolution
print_status "Checking DNS resolution for ibuyscrap.ca..."
DNS_IP=$(nslookup ibuyscrap.ca | grep "Address:" | tail -1 | awk '{print $2}')
echo "ibuyscrap.ca resolves to: $DNS_IP"
if [ "$DNS_IP" = "$SERVER_IP" ]; then
    print_success "DNS is pointing to this server"
else
    print_warning "DNS is not pointing to this server"
    echo "Expected: $SERVER_IP"
    echo "Actual: $DNS_IP"
fi

# Check if there are any other web servers running
print_status "Checking for other web servers..."
if pgrep -f "apache2\|httpd\|nginx" > /dev/null; then
    echo "Web server processes:"
    ps aux | grep -E "apache2|httpd|nginx" | grep -v grep
else
    print_warning "No web server processes found"
fi

print_status "Domain configuration check completed!"
