// Deployment Diagnosis Script
// Run this on your EC2 instance to check deployment status

const { execSync } = require('child_process');

console.log('🔍 DEPLOYMENT DIAGNOSIS');
console.log('========================\n');

try {
    // Check current directory
    console.log('📁 Current Directory:');
    console.log(execSync('pwd', { encoding: 'utf8' }));
    
    // Check if application files exist
    console.log('📂 Application Files:');
    try {
        console.log(execSync('ls -la /home/ubuntu/app/', { encoding: 'utf8' }));
    } catch (e) {
        console.log('❌ /home/ubuntu/app/ does not exist');
    }
    
    try {
        console.log(execSync('ls -la /var/www/immigration-portal/', { encoding: 'utf8' }));
    } catch (e) {
        console.log('❌ /var/www/immigration-portal/ does not exist');
    }
    
    // Check PM2 status
    console.log('⚙️ PM2 Status:');
    console.log(execSync('pm2 status', { encoding: 'utf8' }));
    
    // Check if backend files exist
    console.log('🔧 Backend Files:');
    try {
        console.log(execSync('ls -la /home/ubuntu/app/backend/', { encoding: 'utf8' }));
    } catch (e) {
        console.log('❌ /home/ubuntu/app/backend/ does not exist');
    }
    
    // Check if .env file exists
    console.log('🔐 Environment File:');
    try {
        console.log(execSync('ls -la /home/ubuntu/app/backend/.env', { encoding: 'utf8' }));
    } catch (e) {
        console.log('❌ .env file does not exist');
    }
    
    // Check Node.js processes
    console.log('🟢 Node.js Processes:');
    console.log(execSync('ps aux | grep node', { encoding: 'utf8' }));
    
    // Check ports
    console.log('🌐 Port Status:');
    console.log(execSync('netstat -tlnp | grep :5000', { encoding: 'utf8' }));
    
    // Check Redis
    console.log('🗄️ Redis Status:');
    try {
        console.log(execSync('systemctl status redis-server', { encoding: 'utf8' }));
    } catch (e) {
        console.log('❌ Redis not running');
    }
    
    // Check Nginx
    console.log('🌍 Nginx Status:');
    try {
        console.log(execSync('systemctl status nginx', { encoding: 'utf8' }));
    } catch (e) {
        console.log('❌ Nginx not running');
    }
    
    console.log('\n✅ Diagnosis Complete!');
    
} catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
}
