#!/bin/bash

echo "🔧 FIXING NGINX CONFIGURATION ISSUES"
echo "====================================="

# Create the corrected Nginx configuration
echo "📝 Creating corrected Nginx configuration..."

sudo tee /etc/nginx/sites-available/immigration-portal > /dev/null << 'EOF'
server {
    listen 80;
    server_name ibuyscrap.ca www.ibuyscrap.ca;

    # Serve static files from your frontend build
    location / {
        root /var/www/immigration-portal/frontend/dist;
        try_files $uri $uri/ @fallback;
    }

    # Fallback for SPA routing
    location @fallback {
        root /var/www/immigration-portal/frontend/dist;
        try_files /index.html =404;
    }

    # Proxy API requests to your Node.js backend (FIXED: use localhost instead of 127.0.0.1)
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
        
        # CRITICAL: Increase timeouts to prevent 504 errors
        proxy_read_timeout 180s;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
    }

    # Handle tenant-specific routes (FIXED: use localhost instead of 127.0.0.1)
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
        
        # CRITICAL: Increase timeouts
        proxy_read_timeout 180s;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
    }
}
EOF

echo "✅ Corrected Nginx configuration created"

# Enable the new site
echo "🔗 Enabling the corrected site configuration..."
sudo ln -sf /etc/nginx/sites-available/immigration-portal /etc/nginx/sites-enabled/

# Remove the default site if it exists
echo "🗑️  Removing default site configuration..."
sudo rm -f /etc/nginx/sites-enabled/default

# Test the configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration test passed"
    
    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    sudo nginx -s reload
    
    echo ""
    echo "🎉 SUCCESS! Nginx configuration issues fixed!"
    echo ""
    echo "📋 What was fixed:"
    echo "  ✅ Changed proxy_pass from 127.0.0.1:5000 to localhost:5000"
    echo "  ✅ Fixed rewrite loop with proper @fallback directive"
    echo "  ✅ Maintained 180-second timeouts for API requests"
    echo "  ✅ Proper SPA routing for frontend"
    echo ""
    echo "🚀 Login and user creation should now work properly!"
    
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the configuration manually"
    exit 1
fi
