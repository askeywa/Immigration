// setup-cloudflare-nginx.js
// Complete setup script for Cloudflare and Nginx integration

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Cloudflare and Nginx Integration...\n');

// --- Step 1: Update Environment Variables ---
console.log('📝 Step 1: Updating environment variables...');

const envPath = path.join(__dirname, 'backend', '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  process.exit(1);
}

// Add Cloudflare and Nginx configuration
const additionalConfig = `
# Cloudflare Configuration (REQUIRED - Get these from Cloudflare Dashboard)
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
MAIN_DOMAIN=ibuyscrap.ca

# Nginx Configuration (for reference)
NGINX_CONFIG_PATH=/etc/nginx/sites-available/multi-tenant
NGINX_ENABLED_PATH=/etc/nginx/sites-enabled/multi-tenant
NGINX_LOG_PATH=/var/log/nginx

# EC2 Configuration
EC2_PUBLIC_IP=18.220.224.109
EC2_PRIVATE_IP=172.31.40.28
EC2_PUBLIC_DNS=ec2-18-220-224-109.us-east-2.compute.amazonaws.com

# Service Ports
BACKEND_PORT=5000
FRONTEND_PORT=5174
NGINX_PORT=80
NGINX_SSL_PORT=443`;

// Check if Cloudflare config already exists
if (!envContent.includes('CLOUDFLARE_API_TOKEN')) {
  envContent += additionalConfig;
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Added Cloudflare and Nginx configuration to backend/.env');
  } catch (error) {
    console.error('❌ Error writing .env file:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Cloudflare and Nginx configuration already exists in backend/.env');
}

// --- Step 2: Create Test Scripts ---
console.log('\n📝 Step 2: Creating test scripts...');

// Cloudflare test script
const cloudflareTestScript = `// test-cloudflare-connection.js
const CloudflareService = require('./backend/src/services/cloudflareService').default;

async function testCloudflare() {
    console.log('🧪 Testing Cloudflare connection...');
    
    const cloudflare = CloudflareService.getInstance();
    
    try {
        const isConnected = await cloudflare.testConnection();
        if (isConnected) {
            console.log('✅ Cloudflare connection successful!');
            
            // Test creating a DNS record
            const testRecord = await cloudflare.createDNSRecord({
                type: 'A',
                name: 'test-subdomain',
                content: '18.220.224.109',
                proxied: true,
                ttl: 1
            });
            
            console.log('✅ DNS record creation test successful!');
            console.log('Record ID:', testRecord.id);
            
            // Clean up test record
            await cloudflare.deleteDNSRecord(testRecord.id);
            console.log('✅ Test record cleaned up');
            
        } else {
            console.log('❌ Cloudflare connection failed');
        }
    } catch (error) {
        console.error('❌ Cloudflare test failed:', error.message);
    }
}

testCloudflare();`;

fs.writeFileSync('test-cloudflare-connection.js', cloudflareTestScript);
console.log('✅ Created test-cloudflare-connection.js');

// Nginx test script
const nginxTestScript = `#!/bin/bash
# test-nginx-setup.sh

echo "🧪 Testing Nginx setup..."

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is not installed"
    echo "Run: sudo apt install nginx -y"
    exit 1
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx is not running"
    echo "Run: sudo systemctl start nginx"
    exit 1
fi

# Check Nginx configuration
if ! nginx -t; then
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Check if ports are open
if ! netstat -tlnp | grep :80; then
    echo "❌ Port 80 is not open"
    exit 1
fi

echo "✅ Nginx setup test passed!"

# Test HTTP endpoints
echo "🌐 Testing HTTP endpoints..."
curl -f http://localhost/health > /dev/null 2>&1 && echo "✅ Health endpoint working" || echo "❌ Health endpoint failed"
curl -f http://localhost/api/health > /dev/null 2>&1 && echo "✅ API endpoint working" || echo "❌ API endpoint failed"

echo "🎉 Nginx test completed!"`;

fs.writeFileSync('test-nginx-setup.sh', nginxTestScript);
console.log('✅ Created test-nginx-setup.sh');

// --- Step 3: Create Setup Instructions ---
console.log('\n📝 Step 3: Creating setup instructions...');

const setupInstructions = `# Complete Setup Instructions

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
\`\`\`bash
# SSH into your EC2
ssh -i your-key.pem ubuntu@18.220.224.109

# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
\`\`\`

### 2.2 Configure Firewall
\`\`\`bash
# Install UFW
sudo apt install ufw -y

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 5174/tcp
sudo ufw --force enable
\`\`\`

### 2.3 Configure Nginx
\`\`\`bash
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
\`\`\`

## 🔧 Step 3: Deploy Application

### 3.1 Deploy to EC2
\`\`\`bash
# Run the deployment script
./deploy-multi-tenant.sh
\`\`\`

### 3.2 Test Setup
\`\`\`bash
# Test Cloudflare
node test-cloudflare-connection.js

# Test Nginx
chmod +x test-nginx-setup.sh
./test-nginx-setup.sh
\`\`\`

## 🔧 Step 4: SSL Setup

### 4.1 Install Certbot
\`\`\`bash
sudo apt install certbot python3-certbot-nginx -y
\`\`\`

### 4.2 Get SSL Certificate
\`\`\`bash
sudo certbot --nginx -d ibuyscrap.ca -d www.ibuyscrap.ca
\`\`\`

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
5. Test SSL: curl -I https://your-domain.com`;

fs.writeFileSync('SETUP-INSTRUCTIONS.md', setupInstructions);
console.log('✅ Created SETUP-INSTRUCTIONS.md');

// --- Step 4: Create Quick Start Script ---
console.log('\n📝 Step 4: Creating quick start script...');

const quickStartScript = `#!/bin/bash
# quick-start-cloudflare-nginx.sh

echo "🚀 Quick Start: Cloudflare + Nginx Setup"
echo "========================================"

# Check if running on EC2
if [ ! -f /sys/hypervisor/uuid ] || [ \`head -c 3 /sys/hypervisor/uuid\` != "ec2" ]; then
    echo "❌ This script should be run on your EC2 instance"
    echo "Please SSH into your EC2 first:"
    echo "ssh -i your-key.pem ubuntu@18.220.224.109"
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
echo "🎉 Your EC2 is ready for multi-tenant deployment!"`;

fs.writeFileSync('quick-start-cloudflare-nginx.sh', quickStartScript);
console.log('✅ Created quick-start-cloudflare-nginx.sh');

// --- Step 5: Create Environment Template ---
console.log('\n📝 Step 5: Creating environment template...');

const envTemplate = `# Environment Variables Template
# Copy this to backend/.env and fill in your actual values

# === CLOUDFLARE CONFIGURATION (REQUIRED) ===
# Get these from: https://dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
MAIN_DOMAIN=ibuyscrap.ca

# === NGINX CONFIGURATION ===
NGINX_CONFIG_PATH=/etc/nginx/sites-available/multi-tenant
NGINX_ENABLED_PATH=/etc/nginx/sites-enabled/multi-tenant
NGINX_LOG_PATH=/var/log/nginx

# === EC2 CONFIGURATION ===
EC2_PUBLIC_IP=18.220.224.109
EC2_PRIVATE_IP=172.31.40.28
EC2_PUBLIC_DNS=ec2-18-220-224-109.us-east-2.compute.amazonaws.com

# === SERVICE PORTS ===
BACKEND_PORT=5000
FRONTEND_PORT=5174
NGINX_PORT=80
NGINX_SSL_PORT=443

# === EXISTING CONFIGURATION ===
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/?retryWrites=true&w=majority&appName=RCICDB
JWT_SECRET=3fc9908663650cc993389d8b02330b90dbe6d977966266ea34482690fdac889556936a69507fe97554e3824b1e60eb92a6a448bbda9c1bf1119bfb9e1a779b03
JWT_REFRESH_SECRET=35009599e94ff03ade8fdc7349914f3261f45c27ab872fcc5923846f2f458a67b93e146e4d059ed41f36faa6cb01071edfd989c7d8664f249720779c7f472547
FRONTEND_URL=http://localhost:5174
ALLOWED_SUPER_ADMIN_DOMAINS=ibuyscrap.ca,www.ibuyscrap.ca,localhost
ALLOW_START_WITHOUT_DB=true
REDIS_ENABLED=false
NEW_RELIC_LICENSE_KEY=e2144a7161536cb2269f19949e3aac45FFFFNRAL
NEW_RELIC_APP_NAME=Immigration portal
NEW_RELIC_AI_MONITORING_ENABLED=true
SUPER_ADMIN_FRONTEND_URL=https://ibuyscrap.ca
TENANT_FRONTEND_URL_TEMPLATE=https://{domain}/immigration-portal
SUPER_ADMIN_DOMAIN=ibuyscrap.ca
TENANT_DOMAIN_PREFIX=immigration-portal
API_BASE_URL=localhost:5000
TENANT_API_BASE_URL=https://{domain}/immigration-portal
TENANT_API_VERSION=v1`;

fs.writeFileSync('backend/.env.template', envTemplate);
console.log('✅ Created backend/.env.template');

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 What was created:');
console.log('✅ Updated backend/.env with Cloudflare and Nginx configuration');
console.log('✅ Created test-cloudflare-connection.js');
console.log('✅ Created test-nginx-setup.sh');
console.log('✅ Created SETUP-INSTRUCTIONS.md');
console.log('✅ Created quick-start-cloudflare-nginx.sh');
console.log('✅ Created backend/.env.template');
console.log('\n📝 Next steps:');
console.log('1. Follow CLOUDFLARE-ACCOUNT-SETUP.md to get Cloudflare credentials');
console.log('2. Update backend/.env with your actual Cloudflare values');
console.log('3. Run: node test-cloudflare-connection.js');
console.log('4. Deploy to EC2: ./deploy-multi-tenant.sh');
console.log('\n🎯 Your multi-tenant architecture is ready to deploy!');
