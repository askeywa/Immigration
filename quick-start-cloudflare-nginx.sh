#!/bin/bash
# quick-start-cloudflare-nginx.sh

echo "🚀 Quick Start: Cloudflare + Nginx Setup"
echo "========================================"

# Check if running on EC2
if [ ! -f /sys/hypervisor/uuid ] || [ `head -c 3 /sys/hypervisor/uuid` != "ec2" ]; then
    echo "❌ This script should be run on your EC2 instance"
    echo "Please SSH into your EC2 first:"
    echo "ssh -i your-key.pem ubuntu@52.15.148.97"
    exit 1
fi

echo "✅ Running on EC2 instance"

# Update system
echo "📦 Updating system packages..."
sudo apt update -y
sudo apt upgrade -y

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Install UFW
echo "🔥 Installing firewall..."
sudo apt install ufw -y

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 5174/tcp
sudo ufw --force enable

# Start Nginx
echo "🌐 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Certbot
echo "🔒 Installing SSL tools..."
sudo apt install certbot python3-certbot-nginx -y

echo "✅ Quick setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Configure Cloudflare (see CLOUDFLARE-ACCOUNT-SETUP.md)"
echo "2. Update backend/.env with your Cloudflare credentials"
echo "3. Run: ./deploy-multi-tenant.sh"
echo "4. Test: node test-cloudflare-connection.js"
echo ""
echo "🎉 Your EC2 is ready for multi-tenant deployment!"