# Complete Setup Instructions

## 🎯 Prerequisites
- EC2 instance running Ubuntu
- Domain name (ibuyscrap.ca)
- SSH access to EC2 instance

## 🔧 Step 1: Cloudflare Setup

### 1.1 Create Cloudflare Account
1. Go to https://dash.cloudflare.com/sign-up
2. Sign up with your email
3. Add your domain: ibuyscrap.ca
4. Update nameservers at your domain registrar

### 1.2 Get API Credentials
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create custom token with permissions:
   - Zone:Zone:Read
   - Zone:DNS:Edit
   - Zone:Page Rules:Edit
3. Copy the token, Zone ID, and Account ID

### 1.3 Update Environment Variables
Edit backend/.env and replace:
- CLOUDFLARE_API_TOKEN=your_actual_token
- CLOUDFLARE_ZONE_ID=your_actual_zone_id
- CLOUDFLARE_ACCOUNT_ID=your_actual_account_id

## 🔧 Step 2: Nginx Setup

### 2.1 Install Nginx on EC2
```bash
# SSH into your EC2
ssh -i your-key.pem ubuntu@52.15.148.97

# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.2 Configure Firewall
```bash
# Install UFW
sudo apt install ufw -y

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 5174/tcp
sudo ufw --force enable
```

### 2.3 Configure Nginx
```bash
# Create multi-tenant configuration
sudo nano /etc/nginx/sites-available/multi-tenant

# Copy the configuration from nginx-multi-tenant.conf
# Enable the configuration
sudo ln -s /etc/nginx/sites-available/multi-tenant /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🔧 Step 3: Deploy Application

### 3.1 Deploy to EC2
```bash
# Run the deployment script
./deploy-multi-tenant.sh
```

### 3.2 Test Setup
```bash
# Test Cloudflare
node test-cloudflare-connection.js

# Test Nginx
chmod +x test-nginx-setup.sh
./test-nginx-setup.sh
```

## 🔧 Step 4: SSL Setup

### 4.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 4.2 Get SSL Certificate
```bash
sudo certbot --nginx -d ibuyscrap.ca -d www.ibuyscrap.ca
```

## 🎯 Testing

### Test Super Admin Access
- Visit: https://ibuyscrap.ca
- Should show your Super Admin dashboard

### Test Tenant Creation
1. Login to Super Admin panel
2. Create a new tenant (e.g., honeynwild.com)
3. Cloudflare should automatically create DNS records
4. Test tenant access: https://honeynwild.com/immigration-portal/login

## 🎉 Success!

Your multi-tenant architecture is now ready:
- ✅ Cloudflare DNS automation
- ✅ Nginx reverse proxy
- ✅ SSL certificates
- ✅ Multi-tenant routing
- ✅ Automatic tenant setup

## 📞 Support

If you encounter issues:
1. Check Cloudflare Dashboard for DNS records
2. Check Nginx logs: sudo tail -f /var/log/nginx/error.log
3. Check backend logs: pm2 logs immigration-backend
4. Test DNS propagation: dig your-domain.com
5. Test SSL: curl -I https://your-domain.com