// test-fresh-user.js
const { chromium } = require('playwright');

async function testFreshUser() {
  console.log('🚀 Testing User Dashboard with Fresh User...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
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
    console.log('🔐 Step 1: Creating fresh user...');
    
    // Go to register page
    await page.goto('http://localhost:5174/register');
    await page.waitForLoadState('networkidle');
    
    // Generate unique email
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const password = 'TestUser123!';
    
    console.log(`📧 Creating user: ${email}`);
    
    // Fill registration form
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="confirmPassword"]', password);
    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    console.log('✅ Registration successful!');
    console.log(`📍 Current URL: ${page.url()}`);
    
    console.log('\n📊 Step 2: Monitoring API calls for 15 seconds...');
    
    // Monitor API calls for 15 seconds
    await page.waitForTimeout(15000);
    
    console.log('\n📋 Step 3: Analyzing results...');
    
    // Analyze API calls
    const totalCalls = apiCalls.length;
    const callsByEndpoint = {};
    
    apiCalls.forEach(call => {
      const endpoint = call.url.replace('http://localhost:5174', '');
      if (!callsByEndpoint[endpoint]) {
        callsByEndpoint[endpoint] = {
          count: 0,
          methods: new Set(),
          timestamps: []
        };
      }
      callsByEndpoint[endpoint].count++;
      callsByEndpoint[endpoint].methods.add(call.method);
      callsByEndpoint[endpoint].timestamps.push(call.timestamp);
    });
    
    // Count profile calls
    const profileCalls = apiCalls.filter(call => 
      call.url.includes('/api/profiles')
    ).length;
    
    // Count theme calls
    const themeCalls = apiCalls.filter(call => 
      call.url.includes('/api/themes')
    ).length;
    
    // Count auth calls
    const authCalls = apiCalls.filter(call => 
      call.url.includes('/api/auth')
    ).length;
    
    // Check for rapid successive calls (within 100ms)
    let rapidCalls = 0;
    for (let i = 1; i < apiCalls.length; i++) {
      const prevTime = new Date(apiCalls[i-1].timestamp).getTime();
      const currTime = new Date(apiCalls[i].timestamp).getTime();
      if (currTime - prevTime < 100) {
        rapidCalls++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 USER DASHBOARD API CALL ANALYSIS (FRESH USER)');
    console.log('='.repeat(70));
    console.log(`\n📈 Total API Calls: ${totalCalls}`);
    console.log('\n📋 API Calls by Endpoint:');
    
    Object.entries(callsByEndpoint).forEach(([endpoint, data]) => {
      console.log(`\n  🔗 ${endpoint}`);
      console.log(`     Count: ${data.count}`);
      console.log(`     Methods: ${Array.from(data.methods).join(', ')}`);
      if (data.count <= 5) {
        data.timestamps.forEach((timestamp, index) => {
          console.log(`     ${index + 1}. ${timestamp} - ${Array.from(data.methods)[0]}`);
        });
      } else {
        console.log(`     1. ${data.timestamps[0]} - ${Array.from(data.methods)[0]}`);
        console.log(`     2. ${data.timestamps[1]} - ${Array.from(data.methods)[0]}`);
        console.log(`     3. ${data.timestamps[2]} - ${Array.from(data.methods)[0]}`);
        console.log(`     ... and ${data.count - 3} more`);
      }
    });
    
    console.log(`\n🔍 Specific Analysis:`);
    console.log(`  📊 Profile calls: ${profileCalls}`);
    console.log(`  🎨 Theme calls: ${themeCalls}`);
    console.log(`  🔐 Auth calls: ${authCalls}`);
    
    if (profileCalls > 10) {
      console.log(`\n❌ CRITICAL: Too many profile calls (${profileCalls})`);
      console.log('   This indicates the infinite loop is still present!');
    } else {
      console.log(`\n✅ Profile calls are normal (${profileCalls})`);
    }
    
    if (rapidCalls > 0) {
      console.log(`\n❌ CRITICAL: ${rapidCalls} rapid successive calls detected`);
    } else {
      console.log(`\n✅ Rapid successive calls: ${rapidCalls} (Normal)`);
    }
    
    if (profileCalls > 10) {
      console.log(`\n❌ CRITICAL: Endpoints with excessive calls:`);
      Object.entries(callsByEndpoint).forEach(([endpoint, data]) => {
        if (data.count > 10) {
          console.log(`   - ${endpoint}: ${data.count} calls`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ User Dashboard Test Complete!');
    console.log('='.repeat(70));
    
    // Take screenshot
    await page.screenshot({ path: 'test-fresh-user.png' });
    console.log('📸 Screenshot saved as: test-fresh-user.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testFreshUser();
