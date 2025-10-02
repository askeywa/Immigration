console.log('🔍 Most Likely Deployment Issues (Based on Pattern)');
console.log('===================================================\n');

console.log('📊 Analysis of Previous Errors:');
console.log('===============================');
console.log('✅ Fixed: Bash syntax errors (EOF conflicts)');
console.log('✅ Fixed: Quote conflicts in Redis configuration');
console.log('❌ Current: Deployment reaches EC2 but fails during execution\n');

console.log('🎯 Most Likely Current Issues:');
console.log('==============================\n');

console.log('1. 🔐 SSH/File Permission Issues:');
console.log('   • EC2 user permissions on /var/www/immigration-portal/');
console.log('   • SSH key authentication problems');
console.log('   • Directory ownership issues\n');

console.log('2. 🚀 PM2 Startup Problems:');
console.log('   • dist/server.js not found or not executable');
console.log('   • Environment variables missing in .env file');
console.log('   • Port 5000 already in use by another process');
console.log('   • PM2 ecosystem.config.js syntax errors\n');

console.log('3. 📦 Build/Dependency Issues:');
console.log('   • Missing Node.js modules');
console.log('   • TypeScript compilation errors');
console.log('   • npm install failures on EC2\n');

console.log('4. 🌐 Network/Service Issues:');
console.log('   • Redis service not starting');
console.log('   • MongoDB connection failures');
console.log('   • Nginx configuration problems\n');

console.log('💡 Quick Diagnostic Commands (if you have SSH access):');
console.log('======================================================');
console.log('ssh ubuntu@18.220.224.109');
console.log('ls -la /var/www/immigration-portal/backend/dist/');
console.log('ls -la /var/www/immigration-portal/backend/.env');
console.log('pm2 status');
console.log('pm2 logs');
console.log('curl http://localhost:5000/api/health\n');

console.log('🛠️ Most Common Fixes:');
console.log('====================');
console.log('• Fix file permissions: sudo chown -R ubuntu:ubuntu /var/www/immigration-portal');
console.log('• Check .env file exists: ls -la /var/www/immigration-portal/backend/.env');
console.log('• Kill existing processes: sudo pkill -f node');
console.log('• Restart PM2: pm2 restart all');
console.log('• Check Redis: sudo systemctl status redis-server\n');

console.log('📋 What to Look For in GitHub Logs:');
console.log('===================================');
console.log('• "Permission denied" → File permission issue');
console.log('• "No such file or directory" → Missing files');
console.log('• "Port 5000 is already in use" → Port conflict');
console.log('• "pm2: command not found" → PM2 not installed');
console.log('• "Failed to start" → Application startup error');
console.log('• "Connection refused" → Service not running');
console.log('• "Exit code 255" → SSH/command execution error\n');

console.log('🎯 Focus Areas:');
console.log('===============');
console.log('1. Check if .env file was created properly');
console.log('2. Verify PM2 can start the application');
console.log('3. Check if dist/server.js exists and is executable');
console.log('4. Verify Redis service is running');
console.log('5. Test health endpoint manually');
