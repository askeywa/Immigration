const axios = require('axios');

console.log('⏳ Monitoring Deployment Readiness');
console.log('==================================\n');

async function monitorDeployment() {
  const baseUrl = 'https://ibuyscrap.ca/api';
  
  console.log('🔍 Checking if authentication fix is deployed...\n');
  
  let attempts = 0;
  const maxAttempts = 20; // Check for 10 minutes (20 * 30 seconds)
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`🧪 Attempt ${attempts}/${maxAttempts} - Testing authentication...`);
    
    try {
      const start = Date.now();
      const response = await axios.post(`${baseUrl}/auth/login`, {
        email: 'superadmin@immigrationapp.com',
        password: 'SuperAdmin123!'
      }, {
        timeout: 8000,
        headers: { 'Content-Type': 'application/json' }
      });
      const duration = Date.now() - start;
      
      console.log(`✅ SUCCESS! Authentication is working! (${duration}ms)`);
      console.log('📧 Email:', response.data.data?.user?.email);
      console.log('👤 Role:', response.data.data?.user?.role);
      console.log('🔑 Token received:', response.data.data?.token ? 'Yes' : 'No');
      
      if (response.data.data?.token) {
        console.log('\n🎉 DEPLOYMENT READY!');
        console.log('🚀 You can now test tenant creation and all features!');
        return true;
      }
      
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log(`⏱️ Still timing out... (${error.message})`);
      } else {
        console.log(`❌ Error: ${error.response?.status} ${error.message}`);
      }
    }
    
    if (attempts < maxAttempts) {
      console.log('⏳ Waiting 30 seconds before next check...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('\n⏰ Maximum attempts reached. Deployment may still be in progress.');
  console.log('🔄 You can run this script again to continue monitoring.');
  return false;
}

// Run the monitoring
monitorDeployment().then((success) => {
  if (success) {
    console.log('\n🎯 Authentication fix is working! Ready for testing.');
  } else {
    console.log('\n⏳ Deployment still in progress. Please wait and try again.');
  }
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Monitoring failed:', error);
  process.exit(1);
});
