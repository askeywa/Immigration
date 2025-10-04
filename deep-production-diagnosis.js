// Deep production diagnosis - checking multiple potential issues
const axios = require('axios');

const PRODUCTION_URL = 'https://ibuyscrap.ca';
const PRODUCTION_API_URL = `${PRODUCTION_URL}/api`;

async function deepProductionDiagnosis() {
    console.log('🔍 DEEP PRODUCTION DIAGNOSIS...');
    console.log('================================');
    
    try {
        // Step 1: Check if deployment actually happened
        console.log('\n1️⃣ Checking deployment status...');
        try {
            const healthResponse = await axios.get(`${PRODUCTION_API_URL}/health`, { timeout: 10000 });
            console.log('✅ Server is responding');
            console.log(`   Status: ${healthResponse.status}`);
            console.log(`   Environment: ${healthResponse.data.environment}`);
            console.log(`   Database Connected: ${healthResponse.data.database?.connected}`);
            console.log(`   Database Name: ${healthResponse.data.database?.name}`);
            console.log(`   Database State: ${healthResponse.data.database?.readyState}`);
            
            // Check if we're still on the old database
            if (healthResponse.data.database?.name === 'test') {
                console.log('\n❌ STILL USING OLD DATABASE!');
                console.log('   This means either:');
                console.log('   1. GitHub Secret was not updated correctly');
                console.log('   2. Deployment did not happen after secret update');
                console.log('   3. Server is using cached environment variables');
                console.log('   4. Server needs to be manually restarted');
                
                // Let's check when the server was last restarted
                console.log('\n🔍 Checking server restart status...');
                try {
                    const restartResponse = await axios.get(`${PRODUCTION_API_URL}/health/detailed`, { timeout: 5000 });
                    console.log('   Detailed health info:', restartResponse.data);
                } catch (e) {
                    console.log('   No detailed health endpoint available');
                }
            }
            
        } catch (healthError) {
            console.log('❌ Server health check failed:', healthError.message);
            return;
        }

        // Step 2: Check if the super admin user exists in the correct database
        console.log('\n2️⃣ Checking super admin user in database...');
        try {
            // Try to create the super admin user directly
            const createUserResponse = await axios.post(`${PRODUCTION_API_URL}/super-admin/create-user`, {
                email: 'superadmin@immigrationapp.com',
                password: 'SuperAdmin123!',
                firstName: 'Super',
                lastName: 'Admin',
                role: 'super_admin'
            }, { timeout: 15000 });
            
            console.log('✅ Super admin user creation response:');
            console.log(`   Status: ${createUserResponse.status}`);
            console.log(`   Message: ${createUserResponse.data.message}`);
            
        } catch (createError) {
            console.log('❌ Super admin user creation failed:');
            console.log(`   Status: ${createError.response?.status}`);
            console.log(`   Message: ${createError.response?.data?.message || createError.message}`);
            
            if (createError.response?.status === 401) {
                console.log('\n🔍 401 on user creation suggests:');
                console.log('   - Server is running but database connection is still broken');
                console.log('   - OR the endpoint requires authentication first');
            }
        }

        // Step 3: Check database connection directly
        console.log('\n3️⃣ Testing database connection directly...');
        try {
            const dbTestResponse = await axios.get(`${PRODUCTION_API_URL}/admin/db-test`, { timeout: 10000 });
            console.log('✅ Database test response:');
            console.log(`   Status: ${dbTestResponse.status}`);
            console.log(`   Data: ${JSON.stringify(dbTestResponse.data, null, 2)}`);
            
        } catch (dbError) {
            console.log('❌ Database test failed:');
            console.log(`   Status: ${dbError.response?.status}`);
            console.log(`   Message: ${dbError.response?.data?.message || dbError.message}`);
        }

        // Step 4: Check if there are any recent deployment logs
        console.log('\n4️⃣ Checking for deployment indicators...');
        try {
            const versionResponse = await axios.get(`${PRODUCTION_API_URL}/version`, { timeout: 5000 });
            console.log('✅ Version info:', versionResponse.data);
        } catch (e) {
            console.log('   No version endpoint available');
        }

        // Step 5: Check if the issue is with the specific database name
        console.log('\n5️⃣ Testing different database scenarios...');
        
        // Test if the server can connect to any database at all
        try {
            const testResponse = await axios.get(`${PRODUCTION_API_URL}/admin/test-connection`, { timeout: 5000 });
            console.log('✅ Connection test response:', testResponse.data);
        } catch (e) {
            console.log('   No connection test endpoint available');
        }

        // Step 6: Check MongoDB Atlas connection
        console.log('\n6️⃣ Checking MongoDB Atlas connectivity...');
        try {
            // Try to ping the MongoDB Atlas cluster
            const mongoTest = await axios.get(`${PRODUCTION_API_URL}/health/mongo`, { timeout: 10000 });
            console.log('✅ MongoDB health check:', mongoTest.data);
        } catch (e) {
            console.log('   No MongoDB health endpoint available');
        }
        
    } catch (error) {
        console.error('❌ Deep diagnosis failed:', error.message);
    }
    
    console.log('\n🏁 DEEP DIAGNOSIS COMPLETE');
    console.log('\n🔧 POSSIBLE SOLUTIONS:');
    console.log('1. Manually restart the production server');
    console.log('2. Check if GitHub Actions deployment actually ran');
    console.log('3. Verify the secret was saved correctly in GitHub');
    console.log('4. Check if there are multiple .env files on the server');
    console.log('5. Force a new deployment by pushing a change');
}

deepProductionDiagnosis().catch(console.error);
