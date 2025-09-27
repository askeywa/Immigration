// Dashboard-specific test to check for errors
const { chromium } = require('playwright');

async function testDashboard() {
  console.log('🧪 Dashboard Error Testing');
  console.log('='.repeat(40));
  
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
  
  // Monitor page errors
  page.on('pageerror', (error) => {
    const timestamp = Date.now() - startTime;
    console.log(`💥 [${timestamp}ms] PAGE ERROR: ${error.message}`);
    errors.push({
      timestamp,
      message: error.message,
      stack: error.stack,
      type: 'page_error'
    });
  });
  
  try {
    console.log('🌐 Navigating to frontend...');
    await page.goto('http://localhost:5174', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for initial load...');
    await page.waitForTimeout(3000);
    
    // Try to navigate to dashboard
    console.log('🧭 Attempting to navigate to dashboard...');
    try {
      await page.goto('http://localhost:5174/dashboard', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      console.log('✅ Dashboard page loaded');
    } catch (error) {
      console.log('❌ Dashboard navigation failed:', error.message);
      errors.push({
        timestamp: Date.now() - startTime,
        message: `Dashboard navigation failed: ${error.message}`,
        type: 'navigation_error'
      });
    }
    
    // Try to navigate to user dashboard
    console.log('🧭 Attempting to navigate to user dashboard...');
    try {
      await page.goto('http://localhost:5174/user/dashboard', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      console.log('✅ User dashboard page loaded');
    } catch (error) {
      console.log('❌ User dashboard navigation failed:', error.message);
      errors.push({
        timestamp: Date.now() - startTime,
        message: `User dashboard navigation failed: ${error.message}`,
        type: 'navigation_error'
      });
    }
    
    // Check for React errors in the page
    console.log('🔍 Checking for React errors...');
    const reactErrors = await page.evaluate(() => {
      const errors = [];
      // Check if there are any error boundaries triggered
      const errorElements = document.querySelectorAll('[data-react-error]');
      errorElements.forEach(el => {
        errors.push(el.textContent);
      });
      return errors;
    });
    
    if (reactErrors.length > 0) {
      console.log('🚨 React errors found:', reactErrors);
      errors.push({
        timestamp: Date.now() - startTime,
        message: `React errors: ${reactErrors.join(', ')}`,
        type: 'react_error'
      });
    }
    
    // Analyze results
    console.log('\n📊 ERROR ANALYSIS:');
    console.log('='.repeat(40));
    
    if (errors.length === 0) {
      console.log('✅ No errors detected!');
    } else {
      console.log(`❌ ${errors.length} errors found:`);
      errors.forEach((error, index) => {
        console.log(`\n${index + 1}. [${error.timestamp}ms] ${error.type.toUpperCase()}`);
        console.log(`   Message: ${error.message}`);
        if (error.url) console.log(`   URL: ${error.url}`);
        if (error.status) console.log(`   Status: ${error.status}`);
      });
    }
    
    // API call analysis
    const uniqueAPICalls = [...new Set(apiCalls.filter(call => call.type === 'request').map(call => call.url))];
    const duplicateCalls = {};
    apiCalls.filter(call => call.type === 'request').forEach(call => {
      if (!duplicateCalls[call.url]) {
        duplicateCalls[call.url] = 0;
      }
      duplicateCalls[call.url]++;
    });
    
    const duplicateAPICalls = Object.entries(duplicateCalls).filter(([url, count]) => count > 1);
    
    console.log('\n📊 API CALLS ANALYSIS:');
    console.log(`🔢 Total API Calls: ${uniqueAPICalls.length}`);
    console.log(`🔄 Duplicate Calls: ${duplicateAPICalls.length}`);
    
    if (duplicateAPICalls.length > 0) {
      console.log('\n⚠️ Duplicate API Calls:');
      duplicateAPICalls.forEach(([url, count]) => {
        console.log(`  ${url}: ${count} times`);
      });
    }
    
    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      errors: errors,
      apiCalls: apiCalls,
      uniqueAPICalls: uniqueAPICalls,
      duplicateAPICalls: duplicateAPICalls,
      reactErrors: reactErrors
    };
    
    require('fs').writeFileSync('dashboard-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed results saved to: dashboard-test-results.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
testDashboard().catch(console.error);
