// simple-user-dashboard-test.js
const { chromium } = require('playwright');

async function testUserDashboardSimple() {
  console.log('🚀 Starting Simple User Dashboard Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 // Slower to avoid rate limiting
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track API calls
  const apiCalls = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      const timestamp = new Date().toISOString();
      const method = request.method();
      
      apiCalls.push({
        timestamp,
        method,
        url
      });
      
      console.log(`📡 API Call: ${method} ${url}`);
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
    await page.waitForTimeout(3000); // Wait longer to avoid rate limiting
    
    console.log('\n🔑 Step 2: Logging in as super admin...');
    await page.fill('input[id="email"]', 'superadmin@immigrationapp.com');
    await page.fill('input[id="password"]', 'SuperAdmin123!');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000); // Wait longer for login
    
    console.log('\n⏳ Step 3: Waiting for redirect...');
    try {
      await page.waitForURL('**/super-admin', { timeout: 15000 });
    } catch (error) {
      console.log('⚠️  Not redirected to super-admin, checking current URL...');
      console.log(`📍 Current URL: ${page.url()}`);
    }
    
    await page.waitForTimeout(3000);
    
    console.log('\n🔄 Step 4: Navigating to user dashboard...');
    await page.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait for initial load
    
    console.log('\n📊 Step 5: Monitoring API calls for 10 seconds...');
    await page.waitForTimeout(10000); // Monitor for 10 seconds
    
    console.log('\n📋 Step 6: Analyzing results...');
    
    // Analyze API calls
    console.log('\n' + '='.repeat(60));
    console.log('📊 USER DASHBOARD API CALL ANALYSIS');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Total API Calls: ${apiCalls.length}`);
    
    if (apiCalls.length > 0) {
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
      });
      
      // Check for problematic patterns
      const profileCalls = apiCalls.filter(call => 
        call.url.includes('/profiles') || call.url.includes('/profile')
      );
      
      if (profileCalls.length > 10) {
        console.log(`\n❌ CRITICAL: Too many profile calls (${profileCalls.length})`);
        console.log('   This indicates the infinite loop is still present!');
      } else if (profileCalls.length > 0) {
        console.log(`\n✅ Profile calls: ${profileCalls.length} (Normal)`);
      }
      
      // Check for rapid successive calls
      let rapidCalls = 0;
      for (let i = 1; i < apiCalls.length; i++) {
        const prevCall = apiCalls[i - 1];
        const currentCall = apiCalls[i];
        const timeDiff = new Date(currentCall.timestamp) - new Date(prevCall.timestamp);
        
        if (timeDiff < 1000 && prevCall.url === currentCall.url) {
          rapidCalls++;
        }
      }
      
      if (rapidCalls > 5) {
        console.log(`\n❌ CRITICAL: ${rapidCalls} rapid successive calls detected!`);
        console.log('   This indicates the infinite loop is still present!');
      } else {
        console.log(`\n✅ Rapid successive calls: ${rapidCalls} (Normal)`);
      }
      
    } else {
      console.log('\n✅ No API calls detected - this might indicate the page is not loading properly');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Complete!');
    console.log('='.repeat(60));
    
    // Take a screenshot
    await page.screenshot({ path: 'simple-user-dashboard-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: simple-user-dashboard-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testUserDashboardSimple().catch(console.error);
