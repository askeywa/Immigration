// Detailed error testing to identify specific issues
const { chromium } = require('playwright');

async function detailedErrorTest() {
  console.log('🔍 Detailed Error Analysis');
  console.log('='.repeat(40));
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track all requests and responses
  const allRequests = [];
  const errors = [];
  const startTime = Date.now();
  
  // Monitor ALL network requests (not just API)
  page.on('request', (request) => {
    const url = request.url();
    const method = request.method();
    const timestamp = Date.now() - startTime;
    
    allRequests.push({
      timestamp,
      method,
      url,
      type: 'request'
    });
    
    // Log all requests to see what's failing
    console.log(`📤 [${timestamp}ms] ${method} ${url}`);
  });
  
  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    const timestamp = Date.now() - startTime;
    
    allRequests.push({
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
  });
  
  // Monitor console errors with more detail
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
    console.log('🌐 Navigating to frontend...');
    await page.goto('http://localhost:5174', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for initial load...');
    await page.waitForTimeout(3000);
    
    // Check if theme caching is working by looking at the console
    console.log('🔍 Checking theme service console logs...');
    const consoleLogs = await page.evaluate(() => {
      // This won't work in the browser context, but we can check for errors
      return 'Console logs cannot be accessed from page context';
    });
    
    // Try to trigger theme loading multiple times to test caching
    console.log('🔄 Testing theme caching by navigating multiple times...');
    
    for (let i = 0; i < 3; i++) {
      console.log(`\n--- Navigation ${i + 1} ---`);
      await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }
    
    // Analyze the results
    console.log('\n📊 DETAILED ANALYSIS:');
    console.log('='.repeat(50));
    
    // Find 404 errors
    const notFoundErrors = errors.filter(error => error.status === 404);
    if (notFoundErrors.length > 0) {
      console.log('\n❌ 404 ERRORS FOUND:');
      notFoundErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.url}`);
      });
    }
    
    // Find theme API calls
    const themeCalls = allRequests.filter(req => 
      req.url.includes('/api/themes/current')
    );
    
    console.log(`\n🎨 THEME API CALLS: ${themeCalls.length}`);
    themeCalls.forEach((call, index) => {
      console.log(`${index + 1}. [${call.timestamp}ms] ${call.method} ${call.url}`);
    });
    
    // Check for duplicate theme calls
    const themeCallCounts = {};
    themeCalls.forEach(call => {
      if (call.type === 'request') {
        themeCallCounts[call.url] = (themeCallCounts[call.url] || 0) + 1;
      }
    });
    
    console.log('\n🔄 THEME CALL DUPLICATION:');
    Object.entries(themeCallCounts).forEach(([url, count]) => {
      if (count > 1) {
        console.log(`❌ ${url}: ${count} times (should be cached!)`);
      } else {
        console.log(`✅ ${url}: ${count} time`);
      }
    });
    
    // Find all unique endpoints
    const uniqueEndpoints = [...new Set(allRequests
      .filter(req => req.url.includes('/api/'))
      .map(req => req.url)
    )];
    
    console.log('\n📋 ALL API ENDPOINTS CALLED:');
    uniqueEndpoints.forEach((endpoint, index) => {
      console.log(`${index + 1}. ${endpoint}`);
    });
    
    // Check for any other duplicate API calls
    const apiCallCounts = {};
    allRequests
      .filter(req => req.url.includes('/api/') && req.type === 'request')
      .forEach(call => {
        apiCallCounts[call.url] = (apiCallCounts[call.url] || 0) + 1;
      });
    
    const duplicateAPICalls = Object.entries(apiCallCounts)
      .filter(([url, count]) => count > 1);
    
    if (duplicateAPICalls.length > 0) {
      console.log('\n⚠️ DUPLICATE API CALLS:');
      duplicateAPICalls.forEach(([url, count]) => {
        console.log(`  ${url}: ${count} times`);
      });
    } else {
      console.log('\n✅ No duplicate API calls found!');
    }
    
    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      errors: errors,
      allRequests: allRequests,
      themeCalls: themeCalls,
      themeCallCounts: themeCallCounts,
      uniqueEndpoints: uniqueEndpoints,
      apiCallCounts: apiCallCounts,
      duplicateAPICalls: duplicateAPICalls
    };
    
    require('fs').writeFileSync('detailed-error-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed results saved to: detailed-error-results.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
detailedErrorTest().catch(console.error);
