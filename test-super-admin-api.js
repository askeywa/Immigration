const axios = require('axios');

async function testSuperAdminAPI() {
  console.log('🚀 Testing Super Admin Login via API...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const superAdminEmail = 'superadmin@immigrationapp.com';
  
  // List of passwords to try
  const passwordsToTry = [
    'TestPassword123!',
    'SuperAdmin123!',
    'superadmin123!',
    'SuperAdmin123',
    'superadmin123',
    'Admin123!',
    'admin123!',
    'Admin123',
    'admin123',
    'Password123!',
    'password123!',
    'Password123',
    'password123',
    'Immigration123!',
    'immigration123!',
    'Immigration123',
    'immigration123',
    'RCIC123!',
    'rcic123!',
    'RCIC123',
    'rcic123'
  ];
  
  console.log(`🔐 Testing Super Admin: ${superAdminEmail}`);
  console.log(`📋 Will try ${passwordsToTry.length} different passwords\n`);
  
  for (let i = 0; i < passwordsToTry.length; i++) {
    const password = passwordsToTry[i];
    console.log(`\n🧪 Attempt ${i + 1}/${passwordsToTry.length}: Testing password "${password}"`);
    
    try {
      const response = await axios.post(`${baseURL}/auth/login`, {
        email: superAdminEmail,
        password: password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log('🎉 SUCCESS! Login successful!');
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
        
        // Check user role
        if (response.data.data?.user?.role === 'super_admin') {
          console.log('🏆 Super Admin role confirmed!');
          console.log('👤 User:', response.data.data.user.firstName, response.data.data.user.lastName);
          console.log('🔑 Token received:', response.data.data.token ? 'Yes' : 'No');
          return {
            success: true,
            password: password,
            user: response.data.data.user,
            token: response.data.data.token
          };
        } else {
          console.log('⚠️ Login successful but not super admin role:', response.data.data?.user?.role);
        }
        break;
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ API Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        console.log('❌ Network Error: No response received');
      } else {
        console.log('❌ Error:', error.message);
      }
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n❌ No valid password found for super admin');
  return { success: false };
}

// Run the test
testSuperAdminAPI().then(result => {
  if (result.success) {
    console.log('\n🎯 SUPER ADMIN CREDENTIALS FOUND:');
    console.log(`📧 Email: superadmin@immigrationapp.com`);
    console.log(`🔑 Password: ${result.password}`);
  }
}).catch(console.error);
