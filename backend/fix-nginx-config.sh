#!/bin/bash

echo "🔧 AUTOMATICALLY FIXING NGINX CONFIGURATION"
echo "==========================================="

# Create the Nginx configuration file
echo "📝 Creating Nginx configuration..."

sudo tee /etc/nginx/sites-available/immigration-portal > /dev/null << 'EOF'
server {
    listen 80;
    server_name ibuyscrap.ca www.ibuyscrap.ca;

    # Serve static files from your frontend build
    location / {
        root /var/www/immigration-portal/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to your Node.js backend
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

    # Handle tenant-specific routes
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

echo "✅ Nginx configuration file created"

# Enable the new site
echo "🔗 Enabling the new site configuration..."
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
    echo "🎉 SUCCESS! Nginx has been configured successfully!"
    echo ""
    echo "📋 What was fixed:"
    echo "  ✅ API requests now proxy to your Node.js app on port 5000"
    echo "  ✅ Increased timeouts to 180 seconds (prevents 504 errors)"
    echo "  ✅ Proper headers for your application"
    echo "  ✅ Static files served from your frontend build"
    echo ""
    echo "🚀 Your 504 Gateway Timeout error should now be fixed!"
    echo "   Try creating a user again - it should work now."
    
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the configuration manually"
    exit 1
fi
