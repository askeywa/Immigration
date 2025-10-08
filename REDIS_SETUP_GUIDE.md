# 🚀 Redis Setup Guide - Complete Step-by-Step Instructions

## 📋 Table of Contents
- [Redis Overview](#redis-overview)
- [Do You Need Redis Account?](#do-you-need-redis-account)
- [Environment Variables](#environment-variables)
- [EC2 Redis Installation](#ec2-redis-installation)
- [Redis Configuration](#redis-configuration)
- [Testing Redis](#testing-redis)
- [Production Considerations](#production-considerations)
- [Troubleshooting](#troubleshooting)

---

## 🔍 **Redis Overview**

### **What is Redis?**
Redis is an **in-memory data store** that acts as a database, cache, and message broker. It's incredibly fast because it stores data in RAM instead of on disk.

### **Why Do You Need Redis?**
Your Immigration Portal uses Redis for:
- **Rate Limiting** - Prevent API abuse
- **Caching** - Speed up responses
- **Session Management** - Handle user sessions
- **Monitoring** - Store performance metrics

---

## 1️⃣ **Do You Need Redis Account?**

### **❌ NO - You Don't Need a Redis Account!**

#### **Redis is Open Source:**
- ✅ **Free to use** - No account required
- ✅ **Self-hosted** - You install it on your own server
- ✅ **No cloud service needed** - Run it on your EC2 instance

#### **When You WOULD Need an Account:**
- **Redis Cloud** (Redis Labs) - Managed Redis service
- **AWS ElastiCache** - Amazon's managed Redis
- **Azure Cache for Redis** - Microsoft's managed Redis

#### **Your Current Setup:**
- ✅ **Self-hosted Redis** - Install on your EC2 instance
- ✅ **No external dependencies** - Everything runs on your server
- ✅ **No monthly costs** - Completely free

---

## 2️⃣ **Environment Variables for Redis**

### **✅ Required Environment Variables:**

#### **Basic Configuration:**
```bash
# Redis Connection
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379

# Optional: Redis Password (for security)
REDIS_PASSWORD=your_secure_password_here
```

#### **Cluster Configuration (Optional):**
```bash
# Redis Cluster Nodes (for high availability)
REDIS_MASTER_1_HOST=redis-master-1
REDIS_MASTER_1_PORT=6379
REDIS_MASTER_2_HOST=redis-master-2
REDIS_MASTER_2_PORT=6379
REDIS_MASTER_3_HOST=redis-master-3
REDIS_MASTER_3_PORT=6379

# Redis Replica Nodes
REDIS_REPLICA_1_HOST=redis-replica-1
REDIS_REPLICA_1_PORT=6379
REDIS_REPLICA_2_HOST=redis-replica-2
REDIS_REPLICA_2_PORT=6379
REDIS_REPLICA_3_HOST=redis-replica-3
REDIS_REPLICA_3_PORT=6379
```

### **🔐 Security Considerations:**

#### **Redis Password:**
```bash
# Generate a strong password
REDIS_PASSWORD=$(openssl rand -base64 32)

# Example: REDIS_PASSWORD=Kx9mP2vQ8nR7sT4uY6wE3rA5dF1gH0jL9kM2nB4vC6xZ8qW
```

#### **Firewall Configuration:**
```bash
# Only allow local connections (recommended)
# Redis will only accept connections from localhost
```

---

## 3️⃣ **EC2 Redis Installation - Step by Step**

### **🚀 Complete Installation Process:**

#### **Step 1: Connect to Your EC2 Instance**
```bash
# Connect via SSH
ssh -i your-key.pem ubuntu@52.15.148.97

# Or if you're already connected, continue to Step 2
```

#### **Step 2: Update System Packages**
```bash
# Update package list
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y
```

#### **Step 3: Install Redis**
```bash
# Install Redis server
sudo apt install redis-server -y

# Install Redis tools (optional but recommended)
sudo apt install redis-tools -y
```

#### **Step 4: Configure Redis**
```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf
```

#### **Step 5: Redis Configuration Settings**
```bash
# Find and modify these settings in redis.conf:

# 1. Bind to localhost only (security)
bind 127.0.0.1

# 2. Set a password (security)
requirepass your_secure_password_here

# 3. Enable persistence (save data to disk)
save 900 1
save 300 10
save 60 10000

# 4. Set max memory (adjust based on your EC2 instance)
maxmemory 256mb
maxmemory-policy allkeys-lru

# 5. Enable logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

#### **Step 6: Start and Enable Redis**
```bash
# Start Redis service
sudo systemctl start redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server

# Check Redis status
sudo systemctl status redis-server
```

#### **Step 7: Test Redis Installation**
```bash
# Test Redis connection
redis-cli ping

# Expected output: PONG

# Test with password (if you set one)
redis-cli -a your_secure_password_here ping

# Expected output: PONG
```

---

## 4️⃣ **Redis Configuration for Your Project**

### **🔧 Update Your Environment Variables:**

#### **On Your EC2 Instance:**
```bash
# Edit your .env file
sudo nano /home/ubuntu/app/backend/.env

# Add these Redis variables:
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_secure_password_here
```

#### **Update GitHub Secrets:**
Go to: https://github.com/askeywa/Immigration/settings/secrets/actions

Add these secrets:
- `REDIS_ENABLED=true`
- `REDIS_URL=redis://localhost:6379`
- `REDIS_PASSWORD=your_secure_password_here`

### **🔧 Update Your Application:**

#### **Restart Your Application:**
```bash
# Restart PM2 processes
pm2 restart immigration-portal

# Check logs
pm2 logs immigration-portal

# Check Redis connection in logs
pm2 logs immigration-portal | grep -i redis
```

---

## 5️⃣ **Testing Redis Connection**

### **🧪 Test Redis from Command Line:**
```bash
# Basic connection test
redis-cli ping

# Test with password
redis-cli -a your_password ping

# Test setting and getting data
redis-cli -a your_password
> SET test_key "Hello Redis"
> GET test_key
> EXIT
```

### **🧪 Test Redis from Your Application:**
```bash
# Check application logs
pm2 logs immigration-portal | grep -i redis

# Look for these messages:
# "Rate limiting service initialized with Redis"
# "Redis connected successfully"
```

### **🧪 Test Redis via API:**
```bash
# Test rate limiting (should work with Redis)
curl -X POST https://ibuyscrap.ca/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}' \
  --limit-rate 10k

# Try multiple requests quickly to test rate limiting
```

---

## 6️⃣ **Production Considerations**

### **🔐 Security Best Practices:**

#### **1. Firewall Configuration:**
```bash
# Only allow local connections
sudo ufw allow from 127.0.0.1 to any port 6379
sudo ufw deny 6379
```

#### **2. Redis Password:**
```bash
# Use a strong password
REDIS_PASSWORD=$(openssl rand -base64 32)
```

#### **3. Redis Configuration:**
```bash
# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG ""
```

### **📊 Performance Optimization:**

#### **1. Memory Management:**
```bash
# Set appropriate max memory
maxmemory 512mb
maxmemory-policy allkeys-lru
```

#### **2. Persistence:**
```bash
# Enable RDB persistence
save 900 1
save 300 10
save 60 10000
```

#### **3. Logging:**
```bash
# Enable logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

---

## 7️⃣ **Redis Monitoring**

### **📈 Monitor Redis Performance:**

#### **Command Line Monitoring:**
```bash
# Check Redis info
redis-cli -a your_password info

# Monitor Redis in real-time
redis-cli -a your_password monitor

# Check memory usage
redis-cli -a your_password info memory
```

#### **Application Monitoring:**
```bash
# Check PM2 logs for Redis
pm2 logs immigration-portal | grep -i redis

# Monitor rate limiting
pm2 logs immigration-portal | grep -i "rate limit"
```

---

## 8️⃣ **Troubleshooting**

### **🚨 Common Issues and Solutions:**

#### **Issue 1: Redis Won't Start**
```bash
# Check Redis status
sudo systemctl status redis-server

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Restart Redis
sudo systemctl restart redis-server
```

#### **Issue 2: Connection Refused**
```bash
# Check if Redis is running
sudo netstat -tlnp | grep 6379

# Check Redis configuration
sudo nano /etc/redis/redis.conf

# Verify bind address
bind 127.0.0.1
```

#### **Issue 3: Authentication Failed**
```bash
# Check password in configuration
sudo grep requirepass /etc/redis/redis.conf

# Test with password
redis-cli -a your_password ping
```

#### **Issue 4: Application Can't Connect**
```bash
# Check environment variables
cat /home/ubuntu/app/backend/.env | grep REDIS

# Check application logs
pm2 logs immigration-portal | grep -i redis
```

---

## 9️⃣ **Redis Commands Reference**

### **🔧 Essential Redis Commands:**

#### **Basic Operations:**
```bash
# Connect to Redis
redis-cli -a your_password

# Set a key-value pair
SET key_name "value"

# Get a value
GET key_name

# Delete a key
DEL key_name

# Check if key exists
EXISTS key_name

# Get all keys (use carefully in production)
KEYS *

# Get Redis info
INFO

# Exit Redis CLI
EXIT
```

#### **Monitoring Commands:**
```bash
# Monitor all commands in real-time
MONITOR

# Get Redis statistics
INFO stats

# Get memory information
INFO memory

# Get client information
INFO clients
```

---

## 🎯 **Quick Setup Checklist**

### **✅ Installation Checklist:**
- [ ] Connect to EC2 instance
- [ ] Update system packages
- [ ] Install Redis server
- [ ] Configure Redis (password, bind, persistence)
- [ ] Start and enable Redis service
- [ ] Test Redis connection
- [ ] Update environment variables
- [ ] Restart application
- [ ] Test Redis integration

### **✅ Security Checklist:**
- [ ] Set strong Redis password
- [ ] Configure firewall (localhost only)
- [ ] Disable dangerous commands
- [ ] Enable logging
- [ ] Set memory limits

### **✅ Testing Checklist:**
- [ ] Redis CLI ping test
- [ ] Application Redis connection test
- [ ] Rate limiting test
- [ ] Monitoring test

---

## 🎉 **Summary**

### **What You Need to Do:**

1. **❌ No Redis Account** - Redis is free and self-hosted
2. **✅ Environment Variables** - Set `REDIS_ENABLED`, `REDIS_URL`, `REDIS_PASSWORD`
3. **✅ Install Redis on EC2** - Use the step-by-step guide above
4. **✅ Configure and Test** - Follow the configuration and testing steps

### **Benefits After Setup:**
- **🚀 Faster Performance** - Redis caching speeds up responses
- **🛡️ Better Security** - Rate limiting prevents abuse
- **📊 Better Monitoring** - Redis stores performance metrics
- **🔄 Better Reliability** - Distributed caching across server instances

### **Next Steps:**
1. Install Redis on your EC2 instance
2. Update environment variables
3. Restart your application
4. Test Redis integration
5. Monitor Redis performance

**Your Immigration Portal will be significantly faster and more secure with Redis!** 🚀
