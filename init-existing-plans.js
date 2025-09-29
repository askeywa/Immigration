// Initialize existing subscription plans in database
console.log('🔧 Initializing Existing Subscription Plans in Database...');

async function initExistingPlans() {
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

    // Step 2: Try to call the createDefaultPlans method
    console.log('🔍 Looking for plan initialization endpoint...');
    
    // Try to access the database initialization
    const initResponse = await fetch('http://localhost:5000/api/admin/init-plans', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (initResponse.ok) {
      const initData = await initResponse.json();
      console.log('✅ Plans initialized successfully!');
      console.log('📋 Response:', initData);
    } else {
      console.log('⚠️ No direct initialization endpoint found');
      console.log('💡 This means the plans need to be created manually in the database');
    }

    // Step 3: Try to create tenant with trial plan
    console.log('\n🏢 Testing tenant creation with trial plan...');
    const tenantData = {
      name: 'Honey & Wild Night Club',
      domain: 'honeynwild.com',
      description: 'Premium nightclub and entertainment venue offering Canadian immigration services for international staff and performers.',
      subscriptionPlan: 'trial', // Explicitly specify trial plan
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
      
      console.log('\n📋 Subscription Plan Options Available:');
      console.log('1. 🆓 Trial Plan (7 days free) - DEFAULT');
      console.log('2. 💼 Basic Plan ($99/month)');
      console.log('3. ⭐ Professional Plan ($199/month) - POPULAR');
      console.log('4. 🏢 Enterprise Plan ($399/month)');
      console.log('5. 📦 Starter Package ($500 one-time)');
      
    } else {
      console.log('❌ Tenant creation failed:');
      console.log('   Status:', tenantResponse.status);
      console.log('   Response:', JSON.stringify(tenantResult, null, 2));
      
      console.log('\n🔍 Manual Database Setup Required:');
      console.log('1. Connect to MongoDB Atlas');
      console.log('2. Run the createDefaultPlans() method');
      console.log('3. Or manually insert the 5 subscription plans');
    }

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
  }
}

initExistingPlans();
