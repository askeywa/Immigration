const axios = require('axios');

console.log('🔍 Diagnose Login Timeout Issue');
console.log('===============================\n');

async function diagnoseLoginTimeout() {
  const baseUrl = 'https://ibuyscrap.ca/api';
  let start;
  
  console.log('🧪 Testing various scenarios to diagnose the timeout...\n');
  
  // Test 1: Quick health check
  console.log('1. 🏥 Quick health check...');
  try {
    start = Date.now();
    const response = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    const duration = Date.now() - start;
    console.log(`✅ Health check: ${response.status} (${duration}ms)`);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }
  
  // Test 2: Database health check
  console.log('\n2. 🗄️ Database health check...');
  try {
    start = Date.now();
    const response = await axios.get(`${baseUrl}/health/database`, { timeout: 10000 });
    const duration = Date.now() - start;
    console.log(`✅ Database health: ${response.status} (${duration}ms)`);
    console.log('📊 Database status:', response.data);
  } catch (error) {
    console.log('❌ Database health failed:', error.message);
    console.log('   This might indicate database connection issues');
  }
  
  // Test 3: Login with shorter timeout
  console.log('\n3. 🔐 Login test with shorter timeout...');
  try {
    start = Date.now();
    const response = await axios.post(`${baseUrl}/auth/login`, {
      email: 'superadmin@immigrationapp.com',
      password: 'SuperAdmin123!'
    }, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    const duration = Date.now() - start;
    console.log(`✅ Login successful: ${response.status} (${duration}ms)`);
    console.log('📧 User:', response.data.data?.user?.email);
    console.log('👤 Role:', response.data.data?.user?.role);
  } catch (error) {
    const duration = Date.now() - start;
    if (error.code === 'ECONNABORTED') {
      console.log(`⏱️ Login timeout after ${duration}ms`);
      console.log('   This indicates the login process is hanging');
    } else {
      console.log('❌ Login failed:', error.response?.status, error.message);
      console.log('📊 Response:', error.response?.data);
    }
  }
  
  // Test 4: Try with different credentials
  console.log('\n4. 🔍 Test with invalid credentials (should be fast)...');
  try {
    start = Date.now();
    const response = await axios.post(`${baseUrl}/auth/login`, {
      email: 'invalid@test.com',
      password: 'wrongpassword'
    }, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    const duration = Date.now() - start;
    console.log(`⚠️ Invalid login returned: ${response.status} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    if (error.response?.status === 401) {
      console.log(`✅ Invalid login correctly rejected: 401 (${duration}ms)`);
    } else if (error.code === 'ECONNABORTED') {
      console.log(`⏱️ Invalid login also timed out after ${duration}ms`);
      console.log('   This suggests the entire login endpoint is hanging');
    } else {
      console.log('❌ Invalid login failed:', error.response?.status, error.message);
    }
  }
  
  // Test 5: Check server logs endpoint
  console.log('\n5. 📋 Check if server is responsive to other endpoints...');
  try {
    start = Date.now();
    const response = await axios.get(`${baseUrl}/super-admin/health`, { 
      timeout: 5000,
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    const duration = Date.now() - start;
    console.log(`✅ Server responsive: ${response.status} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    if (error.response?.status === 401) {
      console.log(`✅ Server responsive (401 expected): ${duration}ms`);
    } else if (error.code === 'ECONNABORTED') {
      console.log(`⏱️ Server not responsive: timeout after ${duration}ms`);
    } else {
      console.log('❌ Server check failed:', error.response?.status, error.message);
    }
  }
  
  console.log('\n🎯 Diagnosis Summary:');
  console.log('====================');
  console.log('If login times out but health checks work:');
  console.log('  - Database connection issues during login');
  console.log('  - Authentication service hanging');
  console.log('  - User lookup query taking too long');
  console.log('  - Password comparison hanging');
  console.log('\nIf all endpoints timeout:');
  console.log('  - Server overloaded');
  console.log('  - Database connection pool exhausted');
  console.log('  - Memory/resource issues');
}

// Run the diagnosis
diagnoseLoginTimeout().then(() => {
  console.log('\n🎯 Login timeout diagnosis completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Diagnosis failed:', error);
  process.exit(1);
});
