const https = require('https');
const http = require('http');

console.log('🔍 Troubleshooting Cloudflare 522 Error');
console.log('=======================================\n');

console.log('📊 Current Status:');
console.log('==================');
console.log('✅ GitHub Actions: Successful');
console.log('✅ Application: Running (PM2 online)');
console.log('✅ Redis: Working');
console.log('✅ Nginx: Installed and configured');
console.log('❌ Domain: Still showing Cloudflare 522 error\n');

console.log('🎯 Advanced Troubleshooting Steps:');
console.log('===================================\n');

console.log('1. 🔍 Check if Nginx is actually running and listening:');
console.log('   ssh ubuntu@18.220.224.109');
console.log('   sudo systemctl status nginx');
console.log('   sudo netstat -tlnp | grep :80');
console.log('   sudo netstat -tlnp | grep :443');
console.log('');

console.log('2. 🧪 Test local access to Nginx:');
console.log('   curl http://localhost');
console.log('   curl http://127.0.0.1');
console.log('   curl http://18.220.224.109');
console.log('');

console.log('3. 🔧 Check Nginx configuration:');
console.log('   sudo nginx -t');
console.log('   cat /etc/nginx/sites-available/immigration-portal');
console.log('   ls -la /etc/nginx/sites-enabled/');
console.log('');

console.log('4. 📋 Check Nginx error logs:');
console.log('   sudo tail -f /var/log/nginx/error.log');
console.log('   sudo tail -f /var/log/nginx/access.log');
console.log('');

console.log('5. 🔒 Verify AWS Security Group:');
console.log('   • Go to AWS EC2 Console');
console.log('   • Select instance 18.220.224.109');
console.log('   • Security tab → Security Groups');
console.log('   • Edit inbound rules');
console.log('   • Ensure these rules exist:');
console.log('     - Type: HTTP, Port: 80, Source: 0.0.0.0/0');
console.log('     - Type: HTTPS, Port: 443, Source: 0.0.0.0/0');
console.log('     - Type: SSH, Port: 22, Source: Your IP');
console.log('');

console.log('6. 🌐 Check Cloudflare DNS settings:');
console.log('   • Go to Cloudflare Dashboard');
console.log('   • Select domain ibuyscrap.ca');
console.log('   • DNS tab');
console.log('   • Verify A record points to 18.220.224.109');
console.log('   • Check if proxy is enabled (orange cloud)');
console.log('');

console.log('7. 🔍 Test from different locations:');
console.log('   curl -I http://18.220.224.109');
console.log('   curl -I http://ibuyscrap.ca');
console.log('   curl -I https://ibuyscrap.ca');
console.log('');

console.log('8. 📊 Check application binding:');
console.log('   pm2 logs immigration-portal --lines 20');
console.log('   sudo netstat -tlnp | grep :5000');
console.log('   curl http://localhost:5000/api/health');
console.log('');

console.log('9. 🔧 Alternative: Test with different port:');
console.log('   # Temporarily change Nginx to listen on different port');
console.log('   sudo nano /etc/nginx/sites-available/immigration-portal');
console.log('   # Change "listen 80;" to "listen 8080;"');
console.log('   sudo nginx -t && sudo systemctl reload nginx');
console.log('   curl http://18.220.224.109:8080');
console.log('');

console.log('10. 🚨 Check for conflicting services:');
console.log('    sudo lsof -i :80');
console.log('    sudo lsof -i :443');
console.log('    sudo lsof -i :5000');
console.log('');

// Test external connectivity
async function testExternalConnectivity() {
  console.log('🌐 Testing External Connectivity:');
  console.log('=================================\n');
  
  try {
    // Test direct EC2 IP
    console.log('Testing direct EC2 IP (18.220.224.109:80)...');
    await testConnection('18.220.224.109', 80);
    
    // Test domain
    console.log('\nTesting domain (ibuyscrap.ca:80)...');
    await testConnection('ibuyscrap.ca', 80);
    
  } catch (error) {
    console.log(`❌ External connectivity test failed: ${error.message}`);
  }
}

function testConnection(hostname, port) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: hostname,
      port: port,
      path: '/',
      method: 'GET',
      timeout: 10000
    }, (res) => {
      console.log(`✅ ${hostname}:${port} - HTTP ${res.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
      resolve();
    });
    
    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${hostname}:${port} - Connection refused`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`❌ ${hostname}:${port} - Connection timeout`);
      } else {
        console.log(`❌ ${hostname}:${port} - ${error.message}`);
      }
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log(`❌ ${hostname}:${port} - Request timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Run external connectivity test
testExternalConnectivity();
