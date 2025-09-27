// real-user-dashboard-test.js
const { chromium } = require('playwright');

async function testRealUserDashboard() {
  console.log('🚀 Starting Real User Dashboard API Call Analysis...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better observation
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track all network requests
  const apiCalls = [];
  const duplicateCalls = new Map();
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      const timestamp = new Date().toISOString();
      const method = request.method();
      const resourceType = request.resourceType();
      
      const callInfo = {
        timestamp,
        method,
        url,
        resourceType,
        headers: request.headers()
      };
      
      apiCalls.push(callInfo);
      
      // Track duplicates
      const key = `${method} ${url}`;
      if (duplicateCalls.has(key)) {
        duplicateCalls.set(key, duplicateCalls.get(key) + 1);
      } else {
        duplicateCalls.set(key, 1);
      }
      
      console.log(`📡 API Call: ${method} ${url} (${resourceType})`);
    }
  });
  
  // Track responses
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      const statusText = response.statusText();
      console.log(`📥 Response: ${status} ${statusText} - ${url}`);
    }
  });
  
  // Track console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  try {
    console.log('🔐 Step 1: Navigating to login page...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('\n🔑 Step 2: Attempting to login as regular user...');
    
    // Try different user credentials that might exist
    const userCredentials = [
      { email: 'user@example.com', password: 'password123' },
      { email: 'testuser@example.com', password: 'TestPassword123!' },
      { email: 'user@atlantic-immigration-solutions.com', password: 'password123' },
      { email: 'admin@atlantic-immigration-solutions.com', password: 'password123' },
      { email: 'john@example.com', password: 'password123' },
      { email: 'user@test.com', password: 'password123' }
    ];
    
    let loginSuccessful = false;
    
    for (const credentials of userCredentials) {
      console.log(`\n🔄 Trying credentials: ${credentials.email}`);
      
      try {
        // Clear form fields
        await page.fill('input[id="email"]', '');
        await page.fill('input[id="password"]', '');
        
        // Fill login form
        await page.fill('input[id="email"]', credentials.email);
        await page.fill('input[id="password"]', credentials.password);
        
        // Click login button
        await page.click('button[type="submit"]');
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check if we got redirected to a dashboard
        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/tenant/dashboard')) {
          console.log(`✅ Login successful with: ${credentials.email}`);
          loginSuccessful = true;
          break;
        } else if (currentUrl.includes('/login')) {
          console.log(`❌ Login failed with: ${credentials.email}`);
          // Continue to next credentials
        } else {
          console.log(`🔄 Unexpected redirect to: ${currentUrl}`);
          // Check if this is a valid dashboard
          if (currentUrl.includes('localhost:5174') && !currentUrl.includes('/login')) {
            console.log(`✅ Login successful with: ${credentials.email}`);
            loginSuccessful = true;
            break;
          }
        }
      } catch (error) {
        console.log(`❌ Error with credentials ${credentials.email}: ${error.message}`);
        continue;
      }
    }
    
    if (!loginSuccessful) {
      console.log('\n❌ Could not login with any user credentials. Trying to create a test user...');
      
      // Try to register a new user
      console.log('\n📝 Attempting to register a new user...');
      await page.goto('http://localhost:5174/register', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      };
      
      try {
        await page.fill('input[id="firstName"]', testUser.firstName);
        await page.fill('input[id="lastName"]', testUser.lastName);
        await page.fill('input[id="email"]', testUser.email);
        await page.fill('input[id="password"]', testUser.password);
        await page.fill('input[id="confirmPassword"]', testUser.confirmPassword);
        
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/tenant/dashboard')) {
          console.log(`✅ Registration and login successful!`);
          loginSuccessful = true;
        } else {
          console.log(`❌ Registration failed. Current URL: ${currentUrl}`);
        }
      } catch (error) {
        console.log(`❌ Registration error: ${error.message}`);
      }
    }
    
    if (!loginSuccessful) {
      console.log('\n❌ Could not access user dashboard. Using super admin to navigate to user dashboard...');
      
      // Fallback: Login as super admin and navigate to user dashboard
      await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      await page.fill('input[id="email"]', 'superadmin@immigrationapp.com');
      await page.fill('input[id="password"]', 'SuperAdmin123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/super-admin', { timeout: 10000 });
      await page.waitForTimeout(2000);
      
      console.log('\n🔄 Navigating to user dashboard as super admin...');
      await page.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    }
    
    console.log('\n📊 Step 3: Analyzing user dashboard API calls...');
    await page.waitForTimeout(5000); // Wait for all initial API calls
    
    console.log('\n🔍 Step 4: Checking for repeated API calls...');
    // Wait a bit more to see if there are repeated calls
    await page.waitForTimeout(3000);
    
    console.log('\n📋 Step 5: Analyzing API call patterns...');
    
    // Analyze API calls
    console.log('\n' + '='.repeat(80));
    console.log('📊 USER DASHBOARD API CALL ANALYSIS REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 Total API Calls: ${apiCalls.length}`);
    
    // Group by endpoint
    const endpointGroups = {};
    apiCalls.forEach(call => {
      const endpoint = call.url.replace('http://localhost:3000', '').replace('http://localhost:5174', '');
      if (!endpointGroups[endpoint]) {
        endpointGroups[endpoint] = [];
      }
      endpointGroups[endpoint].push(call);
    });
    
    console.log('\n📋 API Calls by Endpoint:');
    Object.entries(endpointGroups).forEach(([endpoint, calls]) => {
      console.log(`\n  🔗 ${endpoint}`);
      console.log(`     Count: ${calls.length}`);
      console.log(`     Methods: ${[...new Set(calls.map(c => c.method))].join(', ')}`);
      console.log(`     Resource Types: ${[...new Set(calls.map(c => c.resourceType))].join(', ')}`);
      
      // Show timestamps
      calls.forEach((call, index) => {
        console.log(`     ${index + 1}. ${call.timestamp} - ${call.method}`);
      });
    });
    
    // Identify duplicate calls
    console.log('\n🔄 Duplicate API Calls:');
    duplicateCalls.forEach((count, endpoint) => {
      if (count > 1) {
        console.log(`  ⚠️  ${endpoint} - Called ${count} times`);
      }
    });
    
    // Check for specific problematic patterns
    console.log('\n🔍 Specific Analysis:');
    
    // Check for theme-related calls
    const themeCalls = apiCalls.filter(call => call.url.includes('/themes/'));
    if (themeCalls.length > 0) {
      console.log(`\n🎨 Theme API Calls: ${themeCalls.length}`);
      themeCalls.forEach(call => {
        console.log(`  - ${call.method} ${call.url} at ${call.timestamp}`);
      });
    }
    
    // Check for user/profile calls
    const userCalls = apiCalls.filter(call => 
      call.url.includes('/users/') || 
      call.url.includes('/profile') ||
      call.url.includes('/auth/')
    );
    if (userCalls.length > 0) {
      console.log(`\n👤 User/Profile API Calls: ${userCalls.length}`);
      userCalls.forEach(call => {
        console.log(`  - ${call.method} ${call.url} at ${call.timestamp}`);
      });
    }
    
    // Check for tenant calls
    const tenantCalls = apiCalls.filter(call => call.url.includes('/tenant'));
    if (tenantCalls.length > 0) {
      console.log(`\n🏢 Tenant API Calls: ${tenantCalls.length}`);
      tenantCalls.forEach(call => {
        console.log(`  - ${call.method} ${call.url} at ${call.timestamp}`);
      });
    }
    
    // Check for dashboard data calls
    const dashboardCalls = apiCalls.filter(call => 
      call.url.includes('/dashboard') ||
      call.url.includes('/stats') ||
      call.url.includes('/analytics')
    );
    if (dashboardCalls.length > 0) {
      console.log(`\n📊 Dashboard Data API Calls: ${dashboardCalls.length}`);
      dashboardCalls.forEach(call => {
        console.log(`  - ${call.method} ${call.url} at ${call.timestamp}`);
      });
    }
    
    // Check for rapid successive calls (within 1 second)
    console.log('\n⚡ Rapid Successive Calls (within 1 second):');
    for (let i = 1; i < apiCalls.length; i++) {
      const prevCall = apiCalls[i - 1];
      const currentCall = apiCalls[i];
      const timeDiff = new Date(currentCall.timestamp) - new Date(prevCall.timestamp);
      
      if (timeDiff < 1000 && prevCall.url === currentCall.url) {
        console.log(`  ⚠️  ${prevCall.url} - Called twice within ${timeDiff}ms`);
      }
    }
    
    // Check for unnecessary calls
    console.log('\n🤔 Potential Issues:');
    
    if (themeCalls.length > 3) {
      console.log(`  ❌ Too many theme calls (${themeCalls.length}) - possible caching issue`);
    }
    
    if (userCalls.length > 5) {
      console.log(`  ❌ Too many user/profile calls (${userCalls.length}) - possible redundant requests`);
    }
    
    const totalCalls = apiCalls.length;
    if (totalCalls > 15) {
      console.log(`  ❌ High total API calls (${totalCalls}) - may indicate inefficient loading`);
    }
    
    // Check for failed requests
    const failedCalls = apiCalls.filter(call => 
      call.url.includes('/api/') && 
      (call.url.includes('404') || call.url.includes('500'))
    );
    if (failedCalls.length > 0) {
      console.log(`  ❌ Failed API calls detected: ${failedCalls.length}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ User Dashboard Analysis Complete!');
    console.log('='.repeat(80));
    
    // Take a screenshot for reference
    await page.screenshot({ path: 'real-user-dashboard-analysis.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: real-user-dashboard-analysis.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testRealUserDashboard().catch(console.error);
