// Initialize database with default subscription plans
console.log('🔧 Initializing Database with Default Subscription Plans...');

async function initDatabase() {
  try {
    // Step 1: Login as Super Admin
    console.log('🔐 Logging in as Super Admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@immigrationapp.com',
        password: 'ImmigrationDB2024'
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Login failed: ${errorData.message}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Super Admin login successful');
    const authToken = loginData.data.token;

    // Step 2: Try to access a database initialization endpoint
    console.log('🔍 Looking for database initialization endpoint...');
    
    // Try different possible endpoints
    const endpoints = [
      '/api/admin/init-database',
      '/api/admin/init-plans',
      '/api/admin/setup',
      '/api/init',
      '/api/setup'
    ];

    let initEndpoint = null;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          initEndpoint = endpoint;
          console.log(`✅ Found initialization endpoint: ${endpoint}`);
          break;
        } else {
          console.log(`❌ ${endpoint}: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }

    if (initEndpoint) {
      console.log('🎉 Database initialization endpoint found and called!');
    } else {
      console.log('⚠️ No database initialization endpoint found');
      console.log('💡 You may need to manually create subscription plans in the database');
    }

    // Step 3: Try to create a tenant again
    console.log('\n🏢 Trying to create tenant after initialization...');
    const tenantData = {
      name: 'Honey & Wild Night Club',
      domain: 'honeynwild.com',
      description: 'Premium nightclub and entertainment venue offering Canadian immigration services for international staff and performers.',
      adminUser: {
        firstName: 'Eugene',
        lastName: 'Scott',
        email: 'admin@honeynwild.com',
        password: 'HoneyWild2024!'
      }
    };

    const tenantResponse = await fetch('http://localhost:5000/api/tenants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(tenantData)
    });

    const tenantResult = await tenantResponse.json();
    
    if (tenantResponse.ok) {
      console.log('✅ Honey & Wild Tenant created successfully!');
      console.log('🎉 Tenant Details:');
      console.log(`   - ID: ${tenantResult.tenant._id}`);
      console.log(`   - Name: ${tenantResult.tenant.name}`);
      console.log(`   - Domain: ${tenantResult.tenant.domain}`);
      console.log(`   - Status: ${tenantResult.tenant.status}`);
      console.log(`   - Admin: ${tenantResult.adminUser.firstName} ${tenantResult.adminUser.lastName}`);
      console.log(`   - Admin Email: ${tenantResult.adminUser.email}`);
    } else {
      console.log('❌ Tenant creation still failed:');
      console.log('   Status:', tenantResponse.status);
      console.log('   Response:', JSON.stringify(tenantResult, null, 2));
      
      console.log('\n🔍 Manual Solution:');
      console.log('1. Connect to MongoDB Atlas');
      console.log('2. Create a default subscription plan:');
      console.log('   {');
      console.log('     "name": "trial",');
      console.log('     "displayName": "7-Day Free Trial",');
      console.log('     "type": "trial",');
      console.log('     "pricing": { "amount": 0, "currency": "USD" },');
      console.log('     "limits": { "maxUsers": 25, "maxAdmins": 2 },');
      console.log('     "features": ["basic_support"],');
      console.log('     "trialDays": 7,');
      console.log('     "sortOrder": 1');
      console.log('   }');
    }

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
  }
}

initDatabase();
