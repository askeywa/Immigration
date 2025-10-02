const axios = require('axios');

console.log('🔍 Backend Login Issue Diagnosis');
console.log('================================\n');

async function diagnoseLoginIssue() {
  const baseUrl = 'https://ibuyscrap.ca/api';
  
  console.log('📊 Analysis of Test Results:');
  console.log('============================');
  console.log('✅ Health endpoint: Working (200 OK)');
  console.log('✅ Database connection: Connected (MongoDB readyState: 1)');
  console.log('❌ Login endpoint: Timing out (10+ seconds)');
  console.log('❌ Super admin health: 401 (requires authentication)');
  console.log('❌ Database health endpoint: 404 (route not found)\n');
  
  console.log('🔍 Root Cause Analysis:');
  console.log('======================');
  console.log('The login endpoint is timing out, which indicates:');
  console.log('1. 🗄️ Database query is hanging (most likely)');
  console.log('2. 🔐 Authentication service is stuck');
  console.log('3. 🔑 JWT token generation is failing');
  console.log('4. 🌐 Network connectivity issue to database');
  console.log('5. ⚡ Server resource exhaustion\n');
  
  console.log('🎯 Most Likely Causes:');
  console.log('=====================');
  console.log('1. **Database Index Missing**: User lookup query is slow');
  console.log('2. **Database Connection Pool Exhausted**: No available connections');
  console.log('3. **Authentication Service Error**: bcrypt comparison hanging');
  console.log('4. **Environment Variables Missing**: JWT_SECRET or other config issues');
  console.log('5. **User Not Found**: Query hanging because user doesn\'t exist\n');
  
  console.log('🛠️ Recommended Fixes:');
  console.log('====================');
  console.log('1. **Check Backend Logs**: Look for database query errors');
  console.log('2. **Verify User Exists**: Check if superadmin user is in database');
  console.log('3. **Database Indexes**: Ensure email field is indexed');
  console.log('4. **Environment Variables**: Verify JWT_SECRET is set');
  console.log('5. **Database Connection**: Check MongoDB connection pool\n');
  
  // Test with shorter timeout to confirm it's a hang
  console.log('🧪 Quick Test with 2-second timeout...');
  try {
    const quickResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'superadmin@immigrationapp.com',
      password: 'SuperAdmin123!'
    }, {
      timeout: 2000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Quick test succeeded:', quickResponse.status);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('❌ Quick test confirmed: Login endpoint is hanging (>2 seconds)');
    } else {
      console.log('❌ Quick test error:', error.response?.status, error.message);
    }
  }
  
  console.log('\n📋 Next Steps:');
  console.log('==============');
  console.log('1. Check backend server logs on EC2');
  console.log('2. Verify superadmin user exists in MongoDB');
  console.log('3. Check database indexes on email field');
  console.log('4. Verify JWT_SECRET environment variable');
  console.log('5. Test database connection from server');
}

diagnoseLoginIssue().then(() => {
  console.log('\n🎯 Diagnosis completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Diagnosis failed:', error);
  process.exit(1);
});
