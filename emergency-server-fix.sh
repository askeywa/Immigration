#!/bin/bash

echo "🚨 EMERGENCY SERVER FIX SCRIPT"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "This script is running as root. Some commands may need sudo."
fi

echo "🔍 STEP 1: CHECKING SYSTEM STATUS"
echo "================================="

# Check system resources
print_status "Checking system resources..."
echo "Memory usage:"
free -h
echo ""
echo "Disk usage:"
df -h
echo ""
echo "Load average:"
uptime
echo ""

# Check if Node.js processes are running
print_status "Checking Node.js processes..."
NODE_PROCESSES=$(ps aux | grep -E "(node|pm2)" | grep -v grep)
if [ -n "$NODE_PROCESSES" ]; then
    print_success "Node.js processes found:"
    echo "$NODE_PROCESSES"
else
    print_error "No Node.js processes found!"
fi
echo ""

# Check if PM2 is running
print_status "Checking PM2 status..."
if command -v pm2 &> /dev/null; then
    pm2 status
else
    print_warning "PM2 not found or not installed"
fi
echo ""

# Check if Docker is running
print_status "Checking Docker status..."
if command -v docker &> /dev/null; then
    docker ps
else
    print_warning "Docker not found or not installed"
fi
echo ""

echo "🔍 STEP 2: CHECKING DATABASE STATUS"
echo "==================================="

# Check MongoDB status
print_status "Checking MongoDB status..."
if systemctl is-active --quiet mongod; then
    print_success "MongoDB is running"
    sudo systemctl status mongod --no-pager
else
    print_error "MongoDB is not running!"
    print_status "Attempting to start MongoDB..."
    sudo systemctl start mongod
    if systemctl is-active --quiet mongod; then
        print_success "MongoDB started successfully"
    else
        print_error "Failed to start MongoDB"
    fi
fi
echo ""

# Check Redis status
print_status "Checking Redis status..."
if systemctl is-active --quiet redis; then
    print_success "Redis is running"
    sudo systemctl status redis --no-pager
else
    print_warning "Redis is not running"
    print_status "Attempting to start Redis..."
    sudo systemctl start redis
fi
echo ""

echo "🔍 STEP 3: CHECKING APPLICATION LOGS"
echo "===================================="

# Check PM2 logs
print_status "Checking PM2 logs (last 50 lines)..."
if command -v pm2 &> /dev/null; then
    pm2 logs --lines 50
else
    print_warning "PM2 not available for log checking"
fi
echo ""

# Check system logs for errors
print_status "Checking system logs for errors..."
sudo journalctl --since "1 hour ago" --priority=err --no-pager | tail -20
echo ""

echo "🔍 STEP 4: CHECKING NETWORK STATUS"
echo "=================================="

# Check if ports are listening
print_status "Checking listening ports..."
netstat -tulpn | grep -E "(3000|5000|8080|80|443|27017|6379)"
echo ""

# Check if nginx is running
print_status "Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
    sudo systemctl status nginx --no-pager
else
    print_error "Nginx is not running!"
    print_status "Attempting to start Nginx..."
    sudo systemctl start nginx
fi
echo ""

echo "🔍 STEP 5: CHECKING ENVIRONMENT VARIABLES"
echo "========================================="

# Check if .env files exist
print_status "Checking environment files..."
if [ -f "/var/www/immigration-portal/backend/.env" ]; then
    print_success "Backend .env file found"
    print_status "Checking critical environment variables..."
    if grep -q "JWT_SECRET" /var/www/immigration-portal/backend/.env; then
        print_success "JWT_SECRET is set"
    else
        print_error "JWT_SECRET is missing!"
    fi
    
    if grep -q "MONGODB_URI" /var/www/immigration-portal/backend/.env; then
        print_success "MONGODB_URI is set"
    else
        print_error "MONGODB_URI is missing!"
    fi
else
    print_error "Backend .env file not found!"
fi
echo ""

echo "🔧 STEP 6: ATTEMPTING FIXES"
echo "==========================="

# Restart services
print_status "Restarting critical services..."

print_status "Restarting MongoDB..."
sudo systemctl restart mongod
sleep 2

print_status "Restarting Redis..."
sudo systemctl restart redis
sleep 2

print_status "Restarting Nginx..."
sudo systemctl restart nginx
sleep 2

# Restart PM2 processes
if command -v pm2 &> /dev/null; then
    print_status "Restarting PM2 processes..."
    pm2 restart all
    sleep 5
    pm2 status
fi

# Restart Docker containers if they exist
if command -v docker &> /dev/null && [ -f "/var/www/immigration-portal/docker-compose.yml" ]; then
    print_status "Restarting Docker containers..."
    cd /var/www/immigration-portal
    docker-compose restart
    sleep 5
    docker-compose ps
fi

echo ""
echo "🔍 STEP 7: CREATING SUPER ADMIN USER"
echo "===================================="

# Create super admin user script
print_status "Creating super admin user creation script..."

cat > /tmp/create-super-admin.js << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/src/models/User');

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/immigration-portal');
        console.log('Connected to MongoDB');

        // Check if super admin already exists
        const existingAdmin = await User.findOne({ email: 'superadmin@immigrationapp.com' });
        
        if (existingAdmin) {
            console.log('Super admin user already exists, updating password...');
            existingAdmin.password = await bcrypt.hash('SuperAdmin123!', 12);
            existingAdmin.isSuperAdmin = true;
            existingAdmin.role = 'super_admin';
            await existingAdmin.save();
            console.log('Super admin user updated successfully!');
        } else {
            console.log('Creating new super admin user...');
            const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
            
            const superAdmin = new User({
                firstName: 'Super',
                lastName: 'Admin',
                email: 'superadmin@immigrationapp.com',
                password: hashedPassword,
                role: 'super_admin',
                isSuperAdmin: true,
                isEmailVerified: true,
                createdAt: new Date()
            });
            
            await superAdmin.save();
            console.log('Super admin user created successfully!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating super admin:', error);
        process.exit(1);
    }
}

createSuperAdmin();
EOF

print_status "Running super admin user creation script..."
cd /var/www/immigration-portal
if [ -f "backend/src/models/User.js" ]; then
    node /tmp/create-super-admin.js
    print_success "Super admin user creation script completed"
else
    print_error "User model not found, manual intervention required"
fi

echo ""
echo "🎯 STEP 8: FINAL STATUS CHECK"
echo "============================="

# Final status check
print_status "Final status check..."

# Check if services are running
services=("mongod" "redis" "nginx")
for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service"; then
        print_success "$service is running"
    else
        print_error "$service is not running"
    fi
done

# Check PM2 status
if command -v pm2 &> /dev/null; then
    print_status "PM2 Status:"
    pm2 status
fi

echo ""
echo "🎉 EMERGENCY FIX COMPLETED!"
echo "=========================="
echo ""
echo "📋 NEXT STEPS:"
echo "1. Test login at https://ibuyscrap.ca/login"
echo "2. Use credentials: superadmin@immigrationapp.com / SuperAdmin123!"
echo "3. If still not working, check PM2 logs: pm2 logs"
echo "4. If issues persist, restart the EC2 instance"
echo ""
echo "🔍 MONITORING COMMANDS:"
echo "- Check PM2 logs: pm2 logs"
echo "- Check system resources: htop"
echo "- Check disk space: df -h"
echo "- Check memory: free -h"
echo ""
echo "📞 IF STILL NOT WORKING:"
echo "1. Check AWS EC2 console for instance health"
echo "2. Restart the EC2 instance from AWS console"
echo "3. Check CloudWatch logs for detailed error information"
echo ""
