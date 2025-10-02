#!/bin/bash

echo "🔧 Fixing Domain Access Issues"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will help fix the domain access issue.${NC}"
echo "Run this script on your EC2 instance via SSH."
echo ""
echo "SSH Command: ssh ubuntu@18.220.224.109"
echo ""

echo "📋 Step-by-Step Fix:"
echo "===================="
echo ""

echo "1. 🔍 Check current status:"
echo "   sudo systemctl status nginx"
echo "   sudo netstat -tlnp | grep :80"
echo "   sudo netstat -tlnp | grep :5000"
echo ""

echo "2. 🌐 Install Nginx (if not installed):"
echo "   sudo apt update"
echo "   sudo apt install nginx -y"
echo "   sudo systemctl start nginx"
echo "   sudo systemctl enable nginx"
echo ""

echo "3. 🔧 Create Nginx configuration:"
echo "   sudo tee /etc/nginx/sites-available/immigration-portal > /dev/null << 'EOF'"
echo "   server {"
echo "       listen 80;"
echo "       server_name ibuyscrap.ca www.ibuyscrap.ca;"
echo "       "
echo "       location / {"
echo "           proxy_pass http://localhost:5000;"
echo "           proxy_http_version 1.1;"
echo "           proxy_set_header Upgrade \$http_upgrade;"
echo "           proxy_set_header Connection 'upgrade';"
echo "           proxy_set_header Host \$host;"
echo "           proxy_set_header X-Real-IP \$remote_addr;"
echo "           proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "           proxy_set_header X-Forwarded-Proto \$scheme;"
echo "           proxy_cache_bypass \$http_upgrade;"
echo "       }"
echo "   }"
echo "   EOF"
echo ""

echo "4. ✅ Enable the site:"
echo "   sudo ln -sf /etc/nginx/sites-available/immigration-portal /etc/nginx/sites-enabled/"
echo "   sudo rm -f /etc/nginx/sites-enabled/default"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""

echo "5. 🔒 Check firewall:"
echo "   sudo ufw status"
echo "   sudo ufw allow 'Nginx Full'"
echo "   sudo ufw allow 80"
echo "   sudo ufw allow 443"
echo ""

echo "6. 🧪 Test the setup:"
echo "   curl http://localhost/api/health"
echo "   curl -I http://18.220.224.109"
echo ""

echo "7. 🌐 Check AWS Security Group:"
echo "   • Go to AWS EC2 Console"
echo "   • Select your instance (18.220.224.109)"
echo "   • Go to Security tab"
echo "   • Edit Security Group rules"
echo "   • Add rules:"
echo "     - Type: HTTP, Port: 80, Source: 0.0.0.0/0"
echo "     - Type: HTTPS, Port: 443, Source: 0.0.0.0/0"
echo ""

echo -e "${GREEN}After completing these steps:${NC}"
echo "✅ Your domain should be accessible"
echo "✅ No more Cloudflare 522 errors"
echo "✅ Application will load in browser"
echo ""

echo -e "${YELLOW}Quick Test Commands:${NC}"
echo "curl http://18.220.224.109"
echo "curl http://ibuyscrap.ca"
echo ""

echo "🔗 Expected Result:"
echo "Your application should load instead of Cloudflare 522 error"
