#!/bin/bash

echo "🔍 CHECKING NGINX TIMEOUT CONFIGURATION"
echo "========================================"

# Find Nginx config files
echo "📁 Finding Nginx configuration files..."
sudo find /etc/nginx -name "*.conf" -type f 2>/dev/null

echo ""
echo "🔍 Checking for timeout settings..."

# Check main nginx.conf
echo "📄 Main nginx.conf timeout settings:"
sudo grep -n "timeout" /etc/nginx/nginx.conf 2>/dev/null || echo "No timeout settings found in main config"

echo ""
echo "📄 Site-specific timeout settings:"
sudo grep -r "timeout" /etc/nginx/sites-available/ 2>/dev/null || echo "No site-specific timeout settings found"

echo ""
echo "📄 All Nginx timeout settings:"
sudo grep -r "timeout" /etc/nginx/ 2>/dev/null | grep -v ".dpkg" | head -20

echo ""
echo "🔍 Looking for proxy timeout settings specifically:"
sudo grep -r "proxy_.*timeout" /etc/nginx/ 2>/dev/null || echo "No proxy timeout settings found"

echo ""
echo "📊 SUMMARY:"
echo "If you see 'proxy_read_timeout 60s' or similar, that's likely your problem."
echo "Your app might be working fine but taking longer than 60s to respond."
echo "Nginx times out and returns 504 before your app can finish."
