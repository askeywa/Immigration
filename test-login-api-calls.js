// Test script to monitor API calls during user login and dashboard load
const puppeteer = require('puppeteer');

async function testLoginAndMonitorAPICalls() {
  console.log('🚀 Starting API call monitoring test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable request/response logging
  const apiCalls = [];
  const startTime = Date.now();
  
  // Monitor all network requests
  page.on('request', (request) => {
    const url = request.url();
    const method = request.method();
    const timestamp = Date.now() - startTime;
    
    // Only log API calls (not static assets)
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
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for login form to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill login form (you'll need to update these with real credentials)
    console.log('📝 Filling login form...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');
    
    // Click login button
    console.log('🔐 Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait a bit more for all dashboard API calls to complete
    console.log('⏳ Waiting for all dashboard API calls to complete...');
    await page.waitForTimeout(5000);
    
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
    }
    
    // Save detailed log
    const logData = {
      timestamp: new Date().toISOString(),
      totalAPICalls: uniqueAPICalls.length,
      duplicateCalls: duplicateCalls.length,
      apiCalls: apiCalls,
      endpointGroups: endpointGroups,
      duplicates: duplicates
    };
    
    require('fs').writeFileSync('api-calls-log.json', JSON.stringify(logData, null, 2));
    console.log('\n💾 Detailed log saved to: api-calls-log.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the test
testLoginAndMonitorAPICalls().catch(console.error);
