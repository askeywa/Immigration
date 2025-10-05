#!/bin/bash

# Script to fetch EC2 crash logs
# This will check PM2 logs, system logs, and memory usage

echo "🔍 Immigration Portal - Crash Investigation"
echo "==========================================="
echo ""

# SSH connection details
SSH_KEY="C:\Main_Data\AI\_Keys\node-key.pem"
EC2_HOST="ubuntu@ec2-18-220-224-109.us-east-2.compute.amazonaws.com"

echo "📋 Fetching logs from EC2 instance..."
echo ""

# Create a temporary directory for logs
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="crash-investigation-${TIMESTAMP}"
mkdir -p "${LOG_DIR}"

echo "1️⃣  Fetching PM2 logs (last 500 lines)..."
ssh -i "${SSH_KEY}" "${EC2_HOST}" "pm2 logs immigration-portal --lines 500 --nostream" > "${LOG_DIR}/pm2-logs.txt" 2>&1

echo "2️⃣  Fetching PM2 error logs..."
ssh -i "${SSH_KEY}" "${EC2_HOST}" "pm2 logs immigration-portal --err --lines 500 --nostream" > "${LOG_DIR}/pm2-error-logs.txt" 2>&1

echo "3️⃣  Fetching PM2 process status..."
ssh -i "${SSH_KEY}" "${EC2_HOST}" "pm2 status" > "${LOG_DIR}/pm2-status.txt" 2>&1

echo "4️⃣  Fetching PM2 process info..."
ssh -i "${SSH_KEY}" "${EC2_HOST}" "pm2 info immigration-portal" > "${LOG_DIR}/pm2-info.txt" 2>&1

echo "5️⃣  Fetching system memory usage..."
ssh -i "${SSH_KEY}" "${EC2_HOST}" "free -h && df -h" > "${LOG_DIR}/system-memory.txt" 2>&1

echo "6️⃣  Fetching MongoDB connection status..."
ssh -i "${SSH_KEY}" "${EC2_HOST}" "ss -tuln | grep 27017 || echo 'No MongoDB local connection'" > "${LOG_DIR}/mongodb-status.txt" 2>&1

echo "7️⃣  Fetching Nginx logs (last 200 lines)..."
ssh -i "${SSH_KEY}" "${EC2_HOST}" "sudo tail -n 200 /var/log/nginx/error.log" > "${LOG_DIR}/nginx-error-logs.txt" 2>&1

echo "8️⃣  Fetching system logs (auth, syslog)..."
ssh -i "${SSH_KEY}" "${EC2_HOST}" "sudo journalctl -u node --since '24 hours ago' --no-pager" > "${LOG_DIR}/system-logs.txt" 2>&1

echo "9️⃣  Checking for Out Of Memory (OOM) kills..."
ssh -i "${SSH_KEY}" "${EC2_HOST}" "sudo dmesg | grep -i 'out of memory\|killed process' | tail -n 50" > "${LOG_DIR}/oom-kills.txt" 2>&1

echo "🔟  Fetching PM2 resurrection list..."
ssh -i "${SSH_KEY}" "${EC2_HOST}" "cat ~/.pm2/dump.pm2" > "${LOG_DIR}/pm2-dump.txt" 2>&1

echo ""
echo "✅ All logs fetched successfully!"
echo "📁 Logs saved to: ${LOG_DIR}/"
echo ""
echo "📋 Next steps:"
echo "   1. Check ${LOG_DIR}/pm2-error-logs.txt for application errors"
echo "   2. Check ${LOG_DIR}/oom-kills.txt for memory issues"
echo "   3. Check ${LOG_DIR}/pm2-info.txt for restart count"
echo ""

