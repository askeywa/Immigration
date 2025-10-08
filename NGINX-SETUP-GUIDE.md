# Nginx Setup Guide for Multi-Tenant Architecture

## **🎯 Overview**

Nginx is a free, open-source web server that will run on your EC2 instance. It doesn't require an account - it's software you install and configure.

## **🔧 Step 1: Install Nginx on Your EC2**

### **1.1 Connect to Your EC2 Instance**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@52.15.148.97
```

### **1.2 Update System Packages**
```bash
sudo apt update
sudo apt upgrade -y
```

### **1.3 Install Nginx**
```bash
sudo apt install nginx -y
```

### **1.4 Start and Enable Nginx**
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### **1.5 Check Nginx Status**
```bash
sudo systemctl status nginx
```

## **🔧 Step 2: Configure Firewall**

### **2.1 Install UFW (Uncomplicated Firewall)**
```bash
sudo apt install ufw -y
```

### **2.2 Configure Firewall Rules**
```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow your backend port
sudo ufw allow 5000/tcp

# Allow your frontend port
sudo ufw allow 5174/tcp

# Enable firewall
sudo ufw --force enable
```

### **2.3 Check Firewall Status**
```bash
sudo ufw status
```

## **🔧 Step 3: Configure Nginx for Multi-Tenant**

### **3.1 Backup Default Configuration**
```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
```

### **3.2 Create Multi-Tenant Configuration**
```bash
sudo nano /etc/nginx/sites-available/multi-tenant
```

### **3.3 Add This Configuration**
```nginx
# Multi-tenant Nginx configuration for Immigration Portal

# Upstream definitions
upstream backend_api {
    server localhost:5000;
    keepalive 32;
}

upstream frontend_app {
    server localhost:5174;
    keepalive 32;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/s;

# Main server block for Super Admin (ibuyscrap.ca)
server {
    listen 80;
    listen [::]:80;
    server_name ibuyscrap.ca www.ibuyscrap.ca;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Super Admin Frontend
    location / {
        proxy_pass http://frontend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend_app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Super Admin API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend_api/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # API specific headers
        proxy_set_header Content-Type application/json;
        proxy_set_header Accept application/json;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend_api/health;
        access_log off;
    }
}

# Tenant server block (catch-all for tenant domains)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Tenant API endpoints
    location /api/v1/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend_api/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Tenant-Domain $host;
        
        # API specific headers
        proxy_set_header Content-Type application/json;
        proxy_set_header Accept application/json;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Tenant login page
    location /immigration-portal/login {
        proxy_pass http://frontend_app/tenant-login.html;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Tenant-Domain $host;
    }

    # Tenant dashboard page
    location /immigration-portal/dashboard {
        proxy_pass http://frontend_app/tenant-dashboard.html;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Tenant-Domain $host;
    }

    # Tenant static assets
    location /immigration-portal-assets/ {
        proxy_pass http://frontend_app/assets/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache static assets
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend_api/health;
        access_log off;
    }

    # Default fallback
    location / {
        return 200 '<!DOCTYPE html>
<html>
<head>
    <title>Immigration Portal - Tenant Setup Required</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #333; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Immigration Portal</h1>
        <p>This domain is not yet configured as a tenant.</p>
        <p>Please contact your administrator to set up your immigration portal access.</p>
        <p>Domain: $host</p>
    </div>
</body>
</html>';
        add_header Content-Type text/html;
    }
}
```

### **3.4 Enable the Configuration**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/multi-tenant /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
```

### **3.5 Restart Nginx**
```bash
sudo systemctl restart nginx
```

## **🔧 Step 4: Install SSL Certificates (Optional but Recommended)**

### **4.1 Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### **4.2 Get SSL Certificate**
```bash
# For your main domain
sudo certbot --nginx -d ibuyscrap.ca -d www.ibuyscrap.ca

# For tenant domains (after they're created)
sudo certbot --nginx -d honeynwild.com -d www.honeynwild.com
```

### **4.3 Auto-renewal**
```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## **🔧 Step 5: Test Your Setup**

### **5.1 Test Nginx**
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check if Nginx is listening on port 80
sudo netstat -tlnp | grep :80
```

### **5.2 Test from Browser**
- Visit: `http://52.15.148.97` (should show your app)
- Visit: `http://ibuyscrap.ca` (after DNS propagation)

### **5.3 Test API Endpoints**
```bash
# Test health endpoint
curl http://52.15.148.97/health

# Test API endpoint
curl http://52.15.148.97/api/health
```

## **🔧 Step 6: Environment Variables for Nginx**

Nginx doesn't need environment variables, but your application does. Add these to your `backend/.env`:

```env
# Nginx Configuration (for reference)
NGINX_CONFIG_PATH=/etc/nginx/sites-available/multi-tenant
NGINX_ENABLED_PATH=/etc/nginx/sites-enabled/multi-tenant

# Your application ports
BACKEND_PORT=5000
FRONTEND_PORT=5174

# Your EC2 details
EC2_PUBLIC_IP=52.15.148.97
EC2_PRIVATE_IP=172.31.40.28
EC2_PUBLIC_DNS=ec2-52-15-148-97.us-east-2.compute.amazonaws.com
```

## **🔧 Step 7: Monitoring and Logs**

### **7.1 Check Nginx Logs**
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### **7.2 Monitor Nginx Status**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check if Nginx is running
ps aux | grep nginx

# Check Nginx configuration
sudo nginx -T
```

## **🔧 Step 8: Troubleshooting**

### **Common Issues:**

1. **"Nginx won't start"**
   - Check configuration: `sudo nginx -t`
   - Check logs: `sudo tail -f /var/log/nginx/error.log`

2. **"502 Bad Gateway"**
   - Check if backend is running on port 5000
   - Check if frontend is running on port 5174

3. **"Permission denied"**
   - Check file permissions: `sudo chown -R www-data:www-data /var/www/`
   - Check Nginx user: `sudo nano /etc/nginx/nginx.conf`

4. **"Port already in use"**
   - Check what's using the port: `sudo netstat -tlnp | grep :80`
   - Kill the process or change the port

### **Debug Commands:**
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Check Nginx processes
ps aux | grep nginx

# Check open ports
sudo netstat -tlnp

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## **🎯 Next Steps**

Once Nginx is working:
1. Deploy your application using the deployment script
2. Test tenant creation
3. Verify multi-tenant routing
4. Set up SSL certificates
5. Monitor performance and logs

## **💡 Pro Tips**

- **Free Software**: Nginx is completely free and open-source
- **High Performance**: Nginx is known for its speed and efficiency
- **Easy Configuration**: Simple text-based configuration files
- **Great Documentation**: Extensive documentation and community support
- **Scalable**: Can handle thousands of concurrent connections
