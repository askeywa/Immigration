// Simple API call test without authentication
const { chromium } = require('playwright');

async function simpleAPITest() {
  console.log('🧪 Simple API Call Test (No Authentication Required)');
  console.log('='.repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false,
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
      console.log(`📥 [${timestamp}ms] ${status} ${url}`);
    }
  });
  
  try {
    console.log('🌐 Navigating to frontend...');
    await page.goto('http://localhost:5174', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for initial page load...');
    await page.waitForTimeout(3000);
    
    // Try to navigate to different pages to see API calls
    console.log('🧭 Testing navigation...');
    
    // Check if login page exists
    try {
      await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('ℹ️ Login page navigation test skipped');
    }
    
    // Check if dashboard exists
    try {
      await page.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('ℹ️ Dashboard page navigation test skipped');
    }
    
    // Analyze the API calls
    console.log('\n📊 API CALLS ANALYSIS:');
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
    
    // Save results
    const logData = {
      timestamp: new Date().toISOString(),
      totalAPICalls: uniqueAPICalls.length,
      duplicateCalls: duplicateCalls.length,
      apiCalls: apiCalls,
      endpointGroups: endpointGroups,
      duplicates: duplicates
    };
    
    require('fs').writeFileSync('simple-api-test-results.json', JSON.stringify(logData, null, 2));
    console.log('\n💾 Test results saved to: simple-api-test-results.json');
    
    // Show optimization status
    console.log('\n🎯 Optimization Status:');
    if (uniqueAPICalls.length <= 3) {
      console.log('  ✅ Excellent! Low number of API calls detected.');
    } else if (uniqueAPICalls.length <= 5) {
      console.log('  ✅ Good! Reasonable number of API calls.');
    } else {
      console.log('  ⚠️  High number of API calls. Consider optimization.');
    }
    
    if (duplicateCalls.length === 0) {
      console.log('  ✅ No duplicate API calls found!');
    } else {
      console.log(`  ⚠️  ${duplicateCalls.length} duplicate API calls found.`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
simpleAPITest().catch(console.error);
