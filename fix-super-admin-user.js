const https = require('https');

console.log('🔧 SUPER ADMIN USER FIX');
console.log('=======================\n');

async function createSuperAdminUser() {
  const superAdminData = JSON.stringify({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@immigrationapp.com',
    password: 'SuperAdmin123!',
    role: 'super_admin',
    isSuperAdmin: true
  });

  const options = {
    hostname: 'ibuyscrap.ca',
    port: 443,
    path: '/api/users/create-super-admin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(superAdminData),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 Response:`, data);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Super admin user: CREATED/RESET');
          resolve({ success: true, data: data });
        } else {
          console.log(`❌ Super admin user creation: FAILED (${res.statusCode})`);
          resolve({ success: false, status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Request Error:`, error.message);
      reject(error);
    });

    req.write(superAdminData);
    req.end();
  });
}

async function testLoginAfterCreation() {
  console.log('\n🔐 Testing login after super admin creation...');
  
  const loginData = JSON.stringify({
    email: 'superadmin@immigrationapp.com',
    password: 'SuperAdmin123!'
  });

  const options = {
    hostname: 'ibuyscrap.ca',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📡 Login Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 Login Response:`, data);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Login: SUCCESS');
          resolve({ success: true, data: data });
        } else {
          console.log(`❌ Login: FAILED (${res.statusCode})`);
          resolve({ success: false, status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Login Request Error:`, error.message);
      reject(error);
    });

    req.write(loginData);
    req.end();
  });
}

// Run the fix
async function runFix() {
  try {
    console.log('🚀 Attempting to create/reset super admin user...');
    const createResult = await createSuperAdminUser();
    
    if (createResult.success) {
      console.log('✅ Super admin user creation successful!');
      
      // Wait a moment for the user to be saved
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test login
      const loginResult = await testLoginAfterCreation();
      
      if (loginResult.success) {
        console.log('\n🎉 SUCCESS! Super admin user is now working!');
      } else {
        console.log('\n⚠️ Super admin user created but login still failing. May need backend restart.');
      }
    } else {
      console.log('\n❌ Super admin user creation failed. Trying alternative approach...');
      console.log('\n🔧 MANUAL STEPS TO FIX:');
      console.log('1. SSH into your EC2 instance');
      console.log('2. Check if MongoDB is running: sudo systemctl status mongod');
      console.log('3. Check backend logs: pm2 logs or docker logs');
      console.log('4. Restart backend: pm2 restart all or docker-compose restart');
      console.log('5. Check environment variables are loaded');
      console.log('6. Verify database connection');
    }
  } catch (error) {
    console.error('💥 Fix failed:', error.message);
    console.log('\n🚨 EMERGENCY CONTACT INFO:');
    console.log('- Check AWS EC2 console for instance status');
    console.log('- SSH into instance and check system logs');
    console.log('- Restart all services if needed');
  }
}

runFix().then(() => {
  console.log('\n🎯 Super admin fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fix process failed:', error);
  process.exit(1);
});