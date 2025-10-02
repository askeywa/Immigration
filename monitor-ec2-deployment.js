const https = require('https');

// EC2 server details
const EC2_HOST = '18.220.224.109';
const EC2_USER = 'ubuntu';

async function monitorEC2Deployment() {
  console.log('🔍 Monitoring EC2 deployment status...\n');
  
  try {
    // Test basic connectivity
    console.log('1. Testing EC2 connectivity...');
    await testConnectivity();
    
    // Test application health
    console.log('\n2. Testing application health...');
    await testApplicationHealth();
    
    // Test PM2 status (if we had SSH access, we'd check this)
    console.log('\n3. PM2 Status Check:');
    console.log('   (SSH access needed to check PM2 status)');
    console.log('   Run: ssh ubuntu@18.220.224.109 "pm2 status"');
    
  } catch (error) {
    console.error('❌ Error monitoring deployment:', error.message);
  }
}

function testConnectivity() {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const options = {
      hostname: EC2_HOST,
      port: 80,
      path: '/',
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      console.log(`   ✅ EC2 server responding (HTTP ${res.statusCode})`);
      resolve();
    });
    
    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log('   ❌ EC2 server not responding on port 80');
      } else {
        console.log(`   ❌ Connection error: ${error.message}`);
      }
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log('   ❌ Connection timeout');
      req.destroy();
      reject(new Error('Connection timeout'));
    });
    
    req.end();
  });
}

function testApplicationHealth() {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const options = {
      hostname: EC2_HOST,
      port: 5000,
      path: '/api/health',
      method: 'GET',
      timeout: 10000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const healthData = JSON.parse(data);
          console.log(`   ✅ Application health check passed`);
          console.log(`   Status: ${healthData.status}`);
          console.log(`   Uptime: ${healthData.uptime}`);
          resolve();
        } catch (error) {
          console.log(`   ⚠️  Health endpoint responded but invalid JSON`);
          resolve();
        }
      });
    });
    
    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log('   ❌ Application not responding on port 5000');
        console.log('   💡 This might mean PM2 hasn\'t started the app yet');
      } else {
        console.log(`   ❌ Health check error: ${error.message}`);
      }
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log('   ❌ Health check timeout');
      req.destroy();
      reject(new Error('Health check timeout'));
    });
    
    req.end();
  });
}

// Run monitoring
console.log('🚀 EC2 Deployment Monitor');
console.log('========================\n');

monitorEC2Deployment().then(() => {
  console.log('\n📋 Summary:');
  console.log('   • Check GitHub Actions for deployment progress');
  console.log('   • Monitor PM2 logs on EC2 if needed');
  console.log('   • Test domain access once deployment completes');
}).catch(error => {
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Wait for GitHub Actions to complete');
  console.log('   2. Check PM2 status: ssh ubuntu@18.220.224.109 "pm2 status"');
  console.log('   3. Check PM2 logs: ssh ubuntu@18.220.224.109 "pm2 logs"');
  console.log('   4. Check Nginx status: ssh ubuntu@18.220.224.109 "sudo systemctl status nginx"');
});
