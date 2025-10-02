#!/bin/bash

echo "🔧 Fixing Frontend Serving Issue"
echo "==============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}The issue: Backend API is working, but frontend files are not being served.${NC}"
echo ""

echo "📋 Steps to fix:"
echo "================"
echo ""

echo "1. 🔍 Check if frontend build exists:"
echo "   ls -la /var/www/immigration-portal/frontend/dist/"
echo ""

echo "2. 🌐 Update Nginx configuration to serve frontend:"
echo "   sudo tee /etc/nginx/sites-available/immigration-portal > /dev/null << 'EOF'"
echo "   server {"
echo "       listen 80;"
echo "       server_name ibuyscrap.ca www.ibuyscrap.ca;"
echo "       "
echo "       # Serve frontend static files"
echo "       root /var/www/immigration-portal/frontend/dist;"
echo "       index index.html;"
echo "       "
echo "       # Handle frontend routing (SPA)"
echo "       location / {"
echo "           try_files \$uri \$uri/ /index.html;"
echo "       }"
echo "       "
echo "       # Proxy API requests to backend"
echo "       location /api/ {"
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

echo "3. ✅ Test and reload Nginx:"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""

echo "4. 🧪 Test the setup:"
echo "   curl http://localhost"
echo "   curl http://localhost/api/health"
echo ""

echo "5. 📊 Check file permissions:"
echo "   sudo chown -R ubuntu:ubuntu /var/www/immigration-portal/frontend/dist/"
echo "   sudo chmod -R 755 /var/www/immigration-portal/frontend/dist/"
echo ""

echo "🎯 Expected Result:"
echo "==================="
echo "• curl http://localhost should return HTML (not JSON error)"
echo "• curl http://localhost/api/health should return API response"
echo "• Browser should show your frontend application"
echo ""

echo -e "${YELLOW}Alternative: If frontend dist doesn't exist, rebuild it:${NC}"
echo "cd /var/www/immigration-portal/frontend"
echo "npm install"
echo "npm run build"
