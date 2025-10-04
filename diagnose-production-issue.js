// Production login diagnosis script
const axios = require('axios');

const PRODUCTION_URL = 'https://ibuyscrap.ca';
const PRODUCTION_API_URL = `${PRODUCTION_URL}/api`;

async function diagnoseProductionIssue() {
    console.log('🔍 DIAGNOSING PRODUCTION LOGIN ISSUE...');
    console.log('==========================================');
    
    try {
        // Step 1: Check if the server is running
        console.log('\n1️⃣ Checking server health...');
        try {
            const healthResponse = await axios.get(`${PRODUCTION_API_URL}/health`, { timeout: 10000 });
            console.log('✅ Server is running');
            console.log(`   Status: ${healthResponse.status}`);
            console.log(`   Database Connected: ${healthResponse.data.database?.connected}`);
            console.log(`   Database Name: ${healthResponse.data.database?.name}`);
            console.log(`   Database State: ${healthResponse.data.database?.readyState}`);
            console.log(`   Environment: ${healthResponse.data.environment}`);
            
            if (!healthResponse.data.database?.connected) {
                console.log('\n❌ ISSUE FOUND: Database is not connected!');
                console.log('   This explains the 401 Unauthorized error.');
                console.log('   The server cannot validate credentials without database access.');
                return;
            }
            
            if (healthResponse.data.database?.name !== 'productionDB') {
                console.log('\n❌ ISSUE FOUND: Wrong database name!');
                console.log(`   Current: ${healthResponse.data.database?.name}`);
                console.log('   Expected: productionDB');
                console.log('   This means the MONGODB_URI secret is still outdated.');
                return;
            }
            
        } catch (healthError) {
            console.log('❌ Server health check failed:', healthError.message);
            console.log('   The server might be down or unreachable.');
            return;
        }

        // Step 2: Test direct API login
        console.log('\n2️⃣ Testing direct API login...');
        try {
            const loginResponse = await axios.post(`${PRODUCTION_API_URL}/auth/login`, {
                email: 'superadmin@immigrationapp.com',
                password: 'SuperAdmin123!'
            }, { timeout: 15000 });
            
            console.log('✅ Login successful via API');
            console.log(`   Status: ${loginResponse.status}`);
            console.log(`   User Role: ${loginResponse.data.data?.user?.role}`);
            
        } catch (loginError) {
            console.log('❌ API Login failed:');
            console.log(`   Status: ${loginError.response?.status}`);
            console.log(`   Message: ${loginError.response?.data?.message || loginError.message}`);
            
            if (loginError.response?.status === 401) {
                console.log('\n🔍 401 Analysis:');
                console.log('   - Server is running and responding');
                console.log('   - Database is connected');
                console.log('   - But login still fails with 401');
                console.log('   - This suggests the super admin user does not exist in productionDB');
                console.log('\n🔧 SOLUTION:');
                console.log('   We need to create the super admin user in productionDB');
                console.log('   The role fix we applied earlier was to the wrong database!');
            }
        }
        
    } catch (error) {
        console.error('❌ Diagnosis failed:', error.message);
    }
    
    console.log('\n🏁 DIAGNOSIS COMPLETE');
}

diagnoseProductionIssue().catch(console.error);
