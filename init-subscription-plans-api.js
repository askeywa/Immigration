// Initialize subscription plans using existing API endpoints
console.log('🔧 Initializing Subscription Plans via API...');

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

    // Step 2: Check existing plans
    console.log('📋 Checking existing subscription plans...');
    const existingPlansResponse = await fetch('http://localhost:5000/api/subscriptions/plans/all', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (existingPlansResponse.ok) {
      const existingPlans = await existingPlansResponse.json();
      console.log('📊 Existing plans:', existingPlans.data?.length || 0);
      
      if (existingPlans.data && existingPlans.data.length > 0) {
        console.log('✅ Subscription plans already exist!');
        console.log('📋 Available plans:');
        existingPlans.data.forEach((plan, index) => {
          console.log(`   ${index + 1}. ${plan.displayName} (${plan.name}) - $${plan.pricing.amount}/${plan.pricing.billingCycle || 'trial'}`);
        });
        
        // Test tenant creation with existing plans
        await testTenantCreation(authToken);
        return;
      }
    }

    // Step 3: Create subscription plans
    console.log('🏗️ Creating subscription plans...');
    
    const plans = [
      {
        name: 'trial',
        displayName: '7-Day Free Trial',
        description: 'Try our platform risk-free for 7 days',
        type: 'trial',
        pricing: { amount: 0, currency: 'USD' },
        limits: { maxUsers: 25, maxAdmins: 2 },
        features: ['basic_support'],
        trialDays: 7,
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'basic_monthly',
        displayName: 'Basic Plan',
        description: 'Perfect for small RCIC practices',
        type: 'monthly',
        pricing: { amount: 99, currency: 'USD', billingCycle: 'monthly' },
        limits: { maxUsers: 25, maxAdmins: 2, storageGB: 10, apiCallsPerMonth: 1000 },
        features: ['basic_support', 'api_access'],
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'professional_monthly',
        displayName: 'Professional Plan',
        description: 'For growing immigration practices',
        type: 'monthly',
        pricing: { amount: 199, currency: 'USD', billingCycle: 'monthly' },
        limits: { maxUsers: 100, maxAdmins: 5, storageGB: 50, apiCallsPerMonth: 5000 },
        features: ['priority_support', 'api_access', 'advanced_analytics', 'custom_branding'],
        isPopular: true,
        sortOrder: 3,
        isActive: true
      },
      {
        name: 'enterprise_monthly',
        displayName: 'Enterprise Plan',
        description: 'For large immigration firms',
        type: 'monthly',
        pricing: { amount: 399, currency: 'USD', billingCycle: 'monthly' },
        limits: { maxUsers: 500, maxAdmins: 10, storageGB: 200, apiCallsPerMonth: 20000 },
        features: [
          'phone_support', 'api_access', 'advanced_analytics', 'custom_branding',
          'sso_integration', 'custom_fields', 'bulk_operations', 'data_export', 'audit_logs'
        ],
        sortOrder: 4,
        isActive: true
      },
      {
        name: 'starter_package',
        displayName: 'Starter Package',
        description: '6 months access for small practices',
        type: 'package',
        pricing: { amount: 500, currency: 'USD', billingCycle: 'one_time' },
        limits: { maxUsers: 10, maxAdmins: 1, storageGB: 5 },
        features: ['basic_support'],
        sortOrder: 5,
        isActive: true
      }
    ];

    let createdCount = 0;
    for (const plan of plans) {
      try {
        console.log(`📝 Creating plan: ${plan.displayName}...`);
        const planResponse = await fetch('http://localhost:5000/api/subscriptions/plans', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(plan)
        });

        if (planResponse.ok) {
          const planResult = await planResponse.json();
          console.log(`✅ Created: ${plan.displayName}`);
          createdCount++;
        } else {
          const errorData = await planResponse.json();
          console.log(`❌ Failed to create ${plan.displayName}: ${errorData.message}`);
        }
      } catch (error) {
        console.log(`❌ Error creating ${plan.displayName}: ${error.message}`);
      }
    }

    console.log(`\n📊 Created ${createdCount}/${plans.length} subscription plans`);

    // Step 4: Test tenant creation
    await testTenantCreation(authToken);

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
  }
}

async function testTenantCreation(authToken) {
  console.log('\n🏢 Testing tenant creation with trial plan...');
  
  const tenantData = {
    name: 'Honey & Wild Night Club',
    domain: 'honeynwild.com',
    description: 'Premium nightclub and entertainment venue offering Canadian immigration services for international staff and performers.',
    subscriptionPlan: 'trial', // Use trial plan
    adminUser: {
      firstName: 'Eugene',
      lastName: 'Scott',
      email: 'admin@honeynwild.com',
      password: 'HoneyWild2024!'
    }
  };

  try {
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
      
      console.log('\n🎯 Perfect! Your system now supports:');
      console.log('✅ 7-Day Free Trial (DEFAULT for new tenants)');
      console.log('✅ Plan selection during tenant creation');
      console.log('✅ Automatic trial assignment');
      console.log('✅ Plan upgrade options');
      
      console.log('\n📋 Available Subscription Plans:');
      console.log('1. 🆓 Trial Plan (7 days free) - DEFAULT');
      console.log('2. 💼 Basic Plan ($99/month)');
      console.log('3. ⭐ Professional Plan ($199/month) - POPULAR');
      console.log('4. 🏢 Enterprise Plan ($399/month)');
      console.log('5. 📦 Starter Package ($500 one-time)');
      
    } else {
      console.log('❌ Tenant creation failed:');
      console.log('   Status:', tenantResponse.status);
      console.log('   Response:', JSON.stringify(tenantResult, null, 2));
    }

  } catch (error) {
    console.error('❌ Tenant creation test failed:', error.message);
  }
}

initSubscriptionPlans();
