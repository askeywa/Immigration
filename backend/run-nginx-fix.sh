#!/bin/bash

echo "🚀 ONE-CLICK NGINX FIX"
echo "======================"
echo ""
echo "This will automatically fix your Nginx configuration to resolve the 504 error."
echo ""
echo "📋 What this script will do:"
echo "  1. Create proper Nginx configuration"
echo "  2. Configure API requests to proxy to your Node.js app"
echo "  3. Increase timeouts to prevent 504 errors"
echo "  4. Enable the new configuration"
echo "  5. Reload Nginx"
echo ""
echo "⚡ Running the fix now..."

# Create and run the fix
sudo tee /etc/nginx/sites-available/immigration-portal > /dev/null << 'EOF'
server {
    listen 80;
    server_name ibuyscrap.ca www.ibuyscrap.ca;

    location / {
        root /var/www/immigration-portal/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 180s;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
    }

    location /tenant/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 180s;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/immigration-portal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

if sudo nginx -t; then
    sudo nginx -s reload
    echo ""
    echo "🎉 SUCCESS! Nginx configuration fixed!"
    echo "🚀 Your 504 Gateway Timeout error should now be resolved!"
    echo "💡 Try creating a user again - it should work now."
else
    echo "❌ Configuration test failed. Please check manually."
fi
