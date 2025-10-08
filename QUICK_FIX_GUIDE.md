# 🚀 QUICK FIX GUIDE - Copy & Paste Commands

## **Step 1: SSH into your EC2 instance**
```bash
ssh -i your-key.pem ubuntu@18.220.224.109
```

## **Step 2: Navigate to the correct directory**
```bash
cd /var/www/immigration-portal
```

## **Step 3: Check what's there**
```bash
ls -la
```

## **Step 4: Create the .env file**
```bash
cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://ibuyscrap.ca
MONGODB_URI=mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/?retryWrites=true&w=majority&appName=RCICDB
JWT_SECRET=your_very_secure_production_secret
JWT_EXPIRES_IN=7d
MAIN_DOMAIN=ibuyscrap.ca
TENANT_DOMAIN_PREFIX=immigration-portal
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=Qwsaqwsa!@34
SENTRY_DSN=https://1fed6693d06ca399d6d51b27adb20797@o4510120878145536.ingest.us.sentry.io/4510120957050880
SENTRY_RELEASE=1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
NEW_RELIC_APP_NAME=Immigration Portal
NEW_RELIC_ENABLED=true
APP_NAME=Immigration Portal
ALLOW_START_WITHOUT_DB=false
EOF
```

## **Step 5: Install dependencies and build**
```bash
cd backend
npm install
npm run build
```

## **Step 6: Install PM2 if not installed**
```bash
npm install -g pm2
```

## **Step 7: Start the application**
```bash
pm2 start dist/server.js --name "immigration-portal"
pm2 save
pm2 startup
```

## **Step 8: Check if it's running**
```bash
pm2 status
pm2 logs --lines 10
```

## **Step 9: Check if port 5000 is open**
```bash
netstat -tlnp | grep :5000
```

## **Step 10: Test the application**
```bash
curl http://localhost:5000/api/health
```

---

## **If Step 10 works, your backend is running!**

## **Next: Fix the domain issue**

### **Step 11: Install and configure Nginx**
```bash
sudo apt update
sudo apt install nginx -y
```

### **Step 12: Create Nginx config for your domain**
```bash
sudo tee /etc/nginx/sites-available/ibuyscrap.ca << 'EOF'
server {
    listen 80;
    server_name ibuyscrap.ca www.ibuyscrap.ca;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

### **Step 13: Enable the site**
```bash
sudo ln -s /etc/nginx/sites-available/ibuyscrap.ca /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **Step 14: Test your domain**
```bash
curl http://ibuyscrap.ca/api/health
```

---

## **🎉 SUCCESS!**

If all steps work, your application should be accessible at:
- **Backend API:** http://ibuyscrap.ca/api/health
- **Frontend:** http://ibuyscrap.ca (once frontend is served)

---

## **🔍 Troubleshooting Commands**

If something doesn't work:

```bash
# Check PM2 logs
pm2 logs immigration-portal

# Check Nginx status
sudo systemctl status nginx

# Check if Redis is running
sudo systemctl status redis-server

# Check all running processes
ps aux | grep node
```
