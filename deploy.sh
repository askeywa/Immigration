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
npm run build

# Install frontend dependencies and build
echo "🎨 Building frontend..."
cd ../frontend
npm ci
npm run build

# Create environment file
echo "⚙️ Creating environment file..."
cat > ../backend/.env << EOL
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://immigration_db_user:Qwsaqwsa1234@rcicdb.npymiqt.mongodb.net/?retryWrites=true&w=majority&appName=RCICDB
JWT_SECRET=3fc9908663650cc993389d8b02330b90dbe6d977966266ea34482690fdac889556936a69507fe97554e3824b1e60eb92a6a448bbda9c1bf1119bfb9e1a779b03
FRONTEND_URL=https://ibuyscrap.ca
EOL

# Restart applications with PM2
echo "🔄 Restarting backend..."
cd ../backend
pm2 delete immigration-api || true
pm2 start ecosystem.config.js
pm2 save

# Copy frontend build to nginx
echo "📁 Copying frontend files..."
sudo cp -r ../frontend/dist/* /var/www/html/

# Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

echo "✅ Deployment completed successfully!"
