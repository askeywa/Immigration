const https = require('https');
const http = require('http');

console.log('🔍 Deployment Failure Diagnosis');
console.log('===============================\n');

console.log('❌ DEPLOYMENT FAILED');
console.log('   Job: Deploy to EC2');
console.log('   Run ID: 18203493133');
console.log('   URL: https://github.com/askeywa/Immigration/actions/runs/18203493133\n');

console.log('🔍 Common Causes & Solutions:');
console.log('=============================\n');

console.log('1. 🔐 SSH Authentication Issues:');
console.log('   • Check if EC2_SSH_KEY secret is correct');
console.log('   • Verify SSH key permissions on EC2');
console.log('   • Test: ssh ubuntu@18.220.224.109\n');

console.log('2. 📁 Directory/Permission Issues:');
console.log('   • Check if /var/www/immigration-portal exists');
console.log('   • Verify ubuntu user has write permissions');
console.log('   • Test: ls -la /var/www/immigration-portal\n');

console.log('3. 🔧 Build/Installation Failures:');
console.log('   • Node.js/npm installation issues');
console.log('   • Missing dependencies');
console.log('   • TypeScript compilation errors\n');

console.log('4. 🚀 PM2 Startup Issues:');
console.log('   • dist/server.js not found');
console.log('   • Environment variables missing');
console.log('   • Port 5000 already in use\n');

console.log('5. 🔗 Network/Connectivity Issues:');
console.log('   • EC2 security group restrictions');
console.log('   • Firewall blocking connections');
console.log('   • DNS resolution problems\n');

console.log('📋 Manual Debugging Steps:');
console.log('==========================\n');

console.log('1. SSH into EC2:');
console.log('   ssh ubuntu@18.220.224.109\n');

console.log('2. Check directory structure:');
console.log('   ls -la /var/www/immigration-portal/');
console.log('   ls -la /var/www/immigration-portal/backend/\n');

console.log('3. Check if builds exist:');
console.log('   ls -la /var/www/immigration-portal/backend/dist/');
console.log('   ls -la /var/www/immigration-portal/frontend/dist/\n');

console.log('4. Check PM2 status:');
console.log('   pm2 status');
console.log('   pm2 logs\n');

console.log('5. Check environment file:');
console.log('   ls -la /var/www/immigration-portal/backend/.env');
console.log('   cat /var/www/immigration-portal/backend/.env | head -5\n');

console.log('6. Try manual PM2 start:');
console.log('   cd /var/www/immigration-portal/backend');
console.log('   pm2 start ecosystem.config.js --env production\n');

console.log('7. Check application health:');
console.log('   curl http://localhost:5000/api/health\n');

console.log('\n🔗 Quick Links:');
console.log('===============');
console.log('• GitHub Actions: https://github.com/askeywa/Immigration/actions/runs/18203493133');
console.log('• EC2 Instance: 18.220.224.109');
console.log('• Application URL: http://18.220.224.109:5000');

console.log('\n💡 Next Steps:');
console.log('==============');
console.log('1. Check the GitHub Actions logs for specific error messages');
console.log('2. SSH into EC2 and run the debugging commands above');
console.log('3. Identify the root cause and fix it');
console.log('4. Re-run the deployment or push a fix');

// Test basic connectivity
async function testBasicConnectivity() {
  console.log('\n🔍 Testing Basic Connectivity:');
  console.log('==============================');
  
  try {
    const http = require('http');
    
    // Test EC2 HTTP connectivity
    const req = http.request({
      hostname: '18.220.224.109',
      port: 80,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log(`✅ EC2 HTTP (port 80): ${res.statusCode}`);
    });
    
    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ EC2 HTTP (port 80): Connection refused');
      } else {
        console.log(`❌ EC2 HTTP (port 80): ${error.message}`);
      }
    });
    
    req.end();
    
  } catch (error) {
    console.log(`❌ Connectivity test error: ${error.message}`);
  }
}

testBasicConnectivity();
