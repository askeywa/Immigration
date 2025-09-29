// Initialize default subscription plans
console.log('🔧 Initializing Default Subscription Plans...');

async function initSubscriptionPlans() {
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

    // Step 2: Check if there's an endpoint to initialize plans
    console.log('🔍 Checking for subscription plan endpoints...');
    
    // Try to access subscription plans endpoint
    const plansResponse = await fetch('http://localhost:5000/api/subscription-plans', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Subscription plans endpoint status:', plansResponse.status);
    
    if (plansResponse.ok) {
      const plansData = await plansResponse.json();
      console.log('✅ Subscription plans endpoint accessible');
      console.log('📋 Available plans:', plansData.data?.length || 0);
    } else {
      console.log('⚠️ Subscription plans endpoint not found or not accessible');
    }

    // Step 3: Try to create a tenant with a specific plan
    console.log('\n🏢 Trying to create tenant with trial plan...');
    const tenantData = {
      name: 'Test Company 2',
      domain: 'testcompany2.com',
      description: 'Test tenant with trial plan',
      subscriptionPlan: 'trial', // Try to specify trial plan
      adminUser: {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@testcompany2.com',
        password: 'TestPassword123!'
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
      console.log('✅ Tenant with trial plan created successfully!');
      console.log('🎉 Tenant Details:');
      console.log(`   - ID: ${tenantResult.tenant._id}`);
      console.log(`   - Name: ${tenantResult.tenant.name}`);
      console.log(`   - Domain: ${tenantResult.tenant.domain}`);
      console.log(`   - Status: ${tenantResult.tenant.status}`);
    } else {
      console.log('❌ Tenant creation failed:');
      console.log('   Status:', tenantResponse.status);
      console.log('   Response:', JSON.stringify(tenantResult, null, 2));
    }

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
  }
}

initSubscriptionPlans();
