// Comprehensive API call testing with Playwright
const { chromium } = require('playwright');

async function testAPICalls() {
  console.log('🚀 Starting comprehensive API call testing...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    devtools: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track API calls
  const apiCalls = [];
  const startTime = Date.now();
  
  // Monitor all network requests
  page.on('request', (request) => {
    const url = request.url();
    const method = request.method();
    const timestamp = Date.now() - startTime;
    
    // Only track API calls (not static assets)
    if (url.includes('/api/') || url.includes('localhost:5000')) {
      apiCalls.push({
        timestamp,
        method,
        url,
        type: 'request',
        time: new Date().toISOString()
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
        type: 'response',
        time: new Date().toISOString()
      });
      console.log(`📥 [${timestamp}ms] ${status} ${url}`);
    }
  });
  
  try {
    // Navigate to login page
    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:5174/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for login form to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill login form (update these with your test credentials)
    console.log('📝 Filling login form...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Click login button
    console.log('🔐 Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for all dashboard API calls to complete
    console.log('⏳ Waiting for all dashboard API calls to complete...');
    await page.waitForTimeout(5000);
    
    // Test navigation to other pages to see additional API calls
    console.log('🧭 Testing navigation to other pages...');
    
    // Try to navigate to profile page if it exists
    try {
      const profileLink = page.locator('a[href*="profile"]').first();
      if (await profileLink.count() > 0) {
        await profileLink.click();
        await page.waitForTimeout(2000);
        await page.goBack();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('ℹ️ Profile navigation test skipped (link not found)');
    }
    
    // Analyze the API calls
    console.log('\n📊 API CALLS ANALYSIS:');
    console.log('='.repeat(60));
    
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
    
    // Show timing analysis
    console.log('\n⏱️ Timing Analysis:');
    apiCalls.filter(call => call.type === 'request').forEach((call, index) => {
      console.log(`${index + 1}. [${call.timestamp}ms] ${call.method} ${call.url}`);
    });
    
    // Save detailed log
    const logData = {
      timestamp: new Date().toISOString(),
      totalAPICalls: uniqueAPICalls.length,
      duplicateCalls: duplicateCalls.length,
      loginCalls: loginCalls.length,
      dashboardCalls: dashboardCalls.length,
      apiCalls: apiCalls,
      endpointGroups: endpointGroups,
      duplicates: duplicates,
      performance: {
        totalTime: Date.now() - startTime,
        averageCallTime: apiCalls.length > 0 ? (Date.now() - startTime) / apiCalls.length : 0
      }
    };
    
    require('fs').writeFileSync('api-calls-test-results.json', JSON.stringify(logData, null, 2));
    console.log('\n💾 Detailed test results saved to: api-calls-test-results.json');
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
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
testAPICalls().catch(console.error);
