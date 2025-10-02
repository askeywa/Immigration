#!/bin/bash

# Redis Installation Script for EC2 Ubuntu
# Run this script on your EC2 instance to install and configure Redis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🚀 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Error handling
handle_error() {
    print_error "Installation failed at line $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

print_status "Starting Redis installation for Immigration Portal..."

# Step 1: Update system packages
print_status "Updating system packages..."
sudo apt update
sudo apt upgrade -y
print_success "System packages updated"

# Step 2: Install Redis
print_status "Installing Redis server..."
sudo apt install redis-server redis-tools -y
print_success "Redis installed successfully"

# Step 3: Generate secure password
print_status "Generating secure Redis password..."
REDIS_PASSWORD=$(openssl rand -base64 32)
print_success "Redis password generated: $REDIS_PASSWORD"

# Step 4: Configure Redis
print_status "Configuring Redis..."

# Backup original config
sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Create new Redis configuration
sudo tee /etc/redis/redis.conf > /dev/null <<EOF
# Redis configuration for Immigration Portal
# Generated on $(date)

# Network
bind 127.0.0.1
port 6379
timeout 0
tcp-keepalive 300

# Security
requirepass $REDIS_PASSWORD

# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG ""

# Client management
maxclients 10000

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Advanced config
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
EOF

print_success "Redis configuration created"

# Step 5: Set proper permissions
print_status "Setting Redis permissions..."
sudo chown redis:redis /etc/redis/redis.conf
sudo chmod 640 /etc/redis/redis.conf
print_success "Permissions set"

# Step 6: Start and enable Redis
print_status "Starting Redis service..."
sudo systemctl start redis-server
sudo systemctl enable redis-server
print_success "Redis service started and enabled"

# Step 7: Test Redis installation
print_status "Testing Redis installation..."
if redis-cli -a "$REDIS_PASSWORD" ping | grep -q "PONG"; then
    print_success "Redis is working correctly!"
else
    print_error "Redis test failed"
    exit 1
fi

# Step 8: Configure firewall
print_status "Configuring firewall..."
sudo ufw allow from 127.0.0.1 to any port 6379
sudo ufw deny 6379
print_success "Firewall configured"

# Step 9: Create environment file
print_status "Creating Redis environment file..."
sudo tee /home/ubuntu/redis-env.txt > /dev/null <<EOF
# Redis Configuration for Immigration Portal
# Generated on $(date)

# Add these to your .env file:
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Add these to your GitHub Secrets:
# REDIS_ENABLED=true
# REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=$REDIS_PASSWORD
EOF

print_success "Environment file created at /home/ubuntu/redis-env.txt"

# Step 10: Display installation summary
print_success "Redis installation completed successfully!"
echo ""
print_status "Installation Summary:"
echo "  • Redis version: $(redis-server --version)"
echo "  • Redis password: $REDIS_PASSWORD"
echo "  • Redis URL: redis://localhost:6379"
echo "  • Configuration: /etc/redis/redis.conf"
echo "  • Logs: /var/log/redis/redis-server.log"
echo "  • Environment file: /home/ubuntu/redis-env.txt"
echo ""

print_status "Next Steps:"
echo "  1. Update your application .env file with Redis settings"
echo "  2. Add Redis secrets to GitHub Actions"
echo "  3. Restart your application"
echo "  4. Test Redis integration"
echo ""

print_status "Testing Commands:"
echo "  • Test connection: redis-cli -a '$REDIS_PASSWORD' ping"
echo "  • Check status: sudo systemctl status redis-server"
echo "  • View logs: sudo tail -f /var/log/redis/redis-server.log"
echo ""

print_success "Redis is ready for your Immigration Portal! 🚀"
