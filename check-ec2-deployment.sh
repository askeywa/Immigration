#!/bin/bash

# Check EC2 Deployment Status
# Run this: bash check-ec2-deployment.sh

echo "🔍 Checking EC2 Deployment Status"
echo "========================================"

SSH_KEY="C:\\Main_Data\\AI\\_Keys\\node-key.pem"
EC2_HOST="ubuntu@ec2-3-17-203-194.us-east-2.compute.amazonaws.com"

echo ""
echo "📊 Step 1: Checking if enhancedTenantResolution.js exists..."
ssh -i "$SSH_KEY" "$EC2_HOST" "ls -la /var/www/immigration-portal/backend/dist/middleware/ | grep enhancedTenantResolution"

echo ""
echo "📊 Step 2: Checking authRoutes.js imports..."
ssh -i "$SSH_KEY" "$EC2_HOST" "cat /var/www/immigration-portal/backend/dist/routes/authRoutes.js | grep -A 2 -B 2 'tenantResolution' | head -20"

echo ""
echo "📊 Step 3: Checking recent PM2 logs..."
ssh -i "$SSH_KEY" "$EC2_HOST" "cd /var/www/immigration-portal/backend && pm2 logs --nostream --lines 50 | grep -i 'tenant\|login\|validation'"

echo ""
echo "📊 Step 4: Checking PM2 process status..."
ssh -i "$SSH_KEY" "$EC2_HOST" "pm2 list"

echo ""
echo "✅ Check complete!"

