// Real login test with user credentials
const { chromium } = require('playwright');

async function realLoginTest() {
  console.log('🔐 Real User Login & Dashboard Test');
  console.log('='.repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track API calls and errors
  const apiCalls = [];
  const errors = [];
  const startTime = Date.now();
  
  // Monitor all network requests
  page.on('request', (request) => {
    const url = request.url();
    const method = request.method();
    const timestamp = Date.now() - startTime;
    
    if (url.includes('/api/') || url.includes('localhost:5000')) {
      apiCalls.push({
        timestamp,
        method,
        url,
        type: 'request'
      });
      console.log(`📤 [${timestamp}ms] ${method} ${url}`);
    }
  });
  
  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    const timestamp = Date.now() - startTime;
    
    if (url.includes('/api/') || url.includes('localhost:5000')) {
      apiCalls.push({
        timestamp,
        url,
        status,
        type: 'response'
      });
      
      if (status >= 400) {
        console.log(`❌ [${timestamp}ms] ${status} ERROR ${url}`);
        errors.push({
          timestamp,
          url,
          status,
          type: 'http_error'
        });
      } else {
        console.log(`📥 [${timestamp}ms] ${status} ${url}`);
      }
    }
  });
  
  // Monitor console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const timestamp = Date.now() - startTime;
      console.log(`🚨 [${timestamp}ms] CONSOLE ERROR: ${msg.text()}`);
      errors.push({
        timestamp,
        message: msg.text(),
        type: 'console_error'
      });
    }
  });
  
  try {
    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:5174/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for login form to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✅ Login form loaded');
    
    // Create test user credentials
    const testEmail = 'testuser@example.com';
    const testPassword = 'TestPassword123!';
    
    console.log('📝 Filling login form with test credentials...');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    console.log('🔐 Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait for login response
    console.log('⏳ Waiting for login response...');
    await page.waitForTimeout(3000);
    
    // Check if login was successful by looking for redirect or error
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    // Check for login errors
    const errorElements = await page.$$('[class*="error"], [class*="alert"], .text-red-500, .text-red-600');
    if (errorElements.length > 0) {
      console.log('❌ Login errors found:');
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        if (errorText && errorText.trim()) {
          console.log(`  - ${errorText.trim()}`);
        }
      }
    }
    
    // Try to navigate to dashboard if not already there
    if (!currentUrl.includes('/dashboard') && !currentUrl.includes('/user')) {
      console.log('🧭 Attempting to navigate to dashboard...');
      try {
        await page.goto('http://localhost:5174/dashboard', { 
          waitUntil: 'networkidle',
          timeout: 15000 
        });
        console.log('✅ Dashboard page loaded');
      } catch (error) {
        console.log('❌ Dashboard navigation failed:', error.message);
      }
    }
    
    // Wait for all dashboard API calls to complete
    console.log('⏳ Waiting for all dashboard API calls to complete...');
    await page.waitForTimeout(5000);
    
    // Analyze the results
    console.log('\n📊 LOGIN & DASHBOARD API ANALYSIS:');
    console.log('='.repeat(50));
    
    const uniqueAPICalls = [...new Set(apiCalls.filter(call => call.type === 'request').map(call => call.url))];
    
    console.log(`\n🔢 Total API Calls Made: ${uniqueAPICalls.length}`);
    console.log('\n📋 API Calls List:');
    uniqueAPICalls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
    
    // Group by endpoint
    const endpointGroups = {};
    uniqueAPICalls.forEach(url => {
      const endpoint = url.split('/api/')[1]?.split('?')[0] || 'unknown';
      if (!endpointGroups[endpoint]) {
        endpointGroups[endpoint] = [];
      }
      endpointGroups[endpoint].push(url);
    });
    
    console.log('\n📊 API Calls by Endpoint:');
    Object.entries(endpointGroups).forEach(([endpoint, calls]) => {
      console.log(`  ${endpoint}: ${calls.length} call(s)`);
    });
    
    // Check for duplicate calls
    const duplicates = {};
    apiCalls.filter(call => call.type === 'request').forEach(call => {
      if (!duplicates[call.url]) {
        duplicates[call.url] = 0;
      }
      duplicates[call.url]++;
    });
    
    const duplicateCalls = Object.entries(duplicates).filter(([url, count]) => count > 1);
    if (duplicateCalls.length > 0) {
      console.log('\n🔄 Duplicate API Calls:');
      duplicateCalls.forEach(([url, count]) => {
        console.log(`  ${url}: ${count} times`);
      });
    } else {
      console.log('\n✅ No duplicate API calls found!');
    }
    
    // Show timing analysis
    console.log('\n⏱️ Timing Analysis:');
    apiCalls.filter(call => call.type === 'request').forEach((call, index) => {
      console.log(`${index + 1}. [${call.timestamp}ms] ${call.method} ${call.url}`);
    });
    
    // Error analysis
    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.timestamp}ms] ${error.type.toUpperCase()}`);
        if (error.url) console.log(`   URL: ${error.url}`);
        if (error.status) console.log(`   Status: ${error.status}`);
        if (error.message) console.log(`   Message: ${error.message}`);
      });
    } else {
      console.log('\n✅ No errors found!');
    }
    
    // Performance analysis
    console.log('\n⏱️ Performance Analysis:');
    const loginCalls = apiCalls.filter(call => 
      call.type === 'request' && 
      (call.url.includes('/auth/login') || call.url.includes('/auth/permissions'))
    );
    const dashboardCalls = apiCalls.filter(call => 
      call.type === 'request' && 
      (call.url.includes('/profiles') || call.url.includes('/users/me') || call.url.includes('/tenants'))
    );
    
    console.log(`  Login Process: ${loginCalls.length} API calls`);
    console.log(`  Dashboard Load: ${dashboardCalls.length} API calls`);
    console.log(`  Total Time: ${Date.now() - startTime}ms`);
    
    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      totalAPICalls: uniqueAPICalls.length,
      duplicateCalls: duplicateCalls.length,
      loginCalls: loginCalls.length,
      dashboardCalls: dashboardCalls.length,
      errors: errors,
      apiCalls: apiCalls,
      endpointGroups: endpointGroups,
      duplicates: duplicates,
      performance: {
        totalTime: Date.now() - startTime,
        averageCallTime: apiCalls.length > 0 ? (Date.now() - startTime) / apiCalls.length : 0
      }
    };
    
    require('fs').writeFileSync('real-login-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed test results saved to: real-login-test-results.json');
    
    // Performance recommendations
    console.log('\n💡 Performance Assessment:');
    if (uniqueAPICalls.length > 5) {
      console.log('  ⚠️  High number of API calls detected. Consider:');
      console.log('     - Batching related API calls');
      console.log('     - Implementing better caching');
      console.log('     - Removing duplicate calls');
    } else if (uniqueAPICalls.length <= 3) {
      console.log('  ✅ Excellent! Low number of API calls.');
    } else {
      console.log('  ✅ Good! Reasonable number of API calls.');
    }
    
    if (duplicateCalls.length > 0) {
      console.log('  ⚠️  Duplicate API calls found. Consider implementing request deduplication.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the test
realLoginTest().catch(console.error);
