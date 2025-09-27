#!/bin/bash

echo "🚀 Starting deployment..."

# Navigate to application directory
cd /var/www/immigration-portal

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install backend dependencies and build
echo "🔧 Building backend..."
cd backend

# Clean dist directory manually (fix for rimraf issue)
echo "🧹 Cleaning backend dist directory..."
rm -rf dist

# Install dependencies and build
npm ci --only=production
# Run TypeScript compiler directly (bypass prebuild script that needs rimraf)
npx tsc

# Install frontend dependencies and build
echo "🎨 Building frontend..."
cd ../frontend
npm ci
npm run build

# Environment variables are now set by GitHub Actions
echo "⚙️ Environment variables set by GitHub Actions with secure secrets..."

# Restart applications with PM2
echo "🔄 Restarting backend..."
cd ../backend
pm2 delete immigration-api || true
pm2 start ecosystem.config.js --env production
pm2 save

# Copy frontend build to nginx
echo "📁 Copying frontend files..."
sudo cp -r ../frontend/dist/* /var/www/html/

# Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

echo "✅ Deployment completed successfully!"
