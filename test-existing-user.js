// test-existing-user.js
const { chromium } = require('playwright');

async function testExistingUser() {
  console.log('🚀 Testing User Dashboard with Existing User...\n');
  
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
    } else if (msg.type() === 'warn') {
      console.log(`⚠️  Console Warning: ${msg.text()}`);
    }
  });
  
  try {
    console.log('🔐 Step 1: Logging in with existing user...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait longer to avoid rate limiting
    
    // Use the user credentials from the previous test
    const userEmail = 'testuser1758588538354@example.com';
    const userPassword = 'TestPassword123!';
    
    console.log(`📧 Logging in as: ${userEmail}`);
    
    await page.fill('input[id="email"]', userEmail);
    await page.fill('input[id="password"]', userPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000); // Wait longer for login
    
    // Check if login was successful
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/tenant/dashboard')) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed or redirected elsewhere');
      return;
    }
    
    console.log('\n📊 Step 2: Monitoring API calls for 15 seconds...');
    await page.waitForTimeout(15000);
    
    console.log('\n📋 Step 3: Analyzing results...');
    
    // Analyze API calls
    console.log('\n' + '='.repeat(70));
    console.log('📊 USER DASHBOARD API CALL ANALYSIS (FIXED VERSION)');
    console.log('='.repeat(70));
    
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
        
        // Show first few timestamps
        calls.slice(0, 3).forEach((call, index) => {
          console.log(`     ${index + 1}. ${call.timestamp} - ${call.method}`);
        });
        if (calls.length > 3) {
          console.log(`     ... and ${calls.length - 3} more`);
        }
      });
      
      // Check for problematic patterns
      const profileCalls = apiCalls.filter(call => 
        call.url.includes('/profiles') || call.url.includes('/profile')
      );
      
      const themeCalls = apiCalls.filter(call => 
        call.url.includes('/themes')
      );
      
      const authCalls = apiCalls.filter(call => 
        call.url.includes('/auth')
      );
      
      console.log('\n🔍 Specific Analysis:');
      console.log(`  📊 Profile calls: ${profileCalls.length}`);
      console.log(`  🎨 Theme calls: ${themeCalls.length}`);
      console.log(`  🔐 Auth calls: ${authCalls.length}`);
      
      if (profileCalls.length > 10) {
        console.log(`\n❌ CRITICAL: Too many profile calls (${profileCalls.length})`);
        console.log('   This indicates the infinite loop is still present!');
      } else if (profileCalls.length > 0) {
        console.log(`\n✅ Profile calls: ${profileCalls.length} (Normal)`);
      } else {
        console.log(`\n⚠️  No profile calls detected - dashboard might not be loading profile data`);
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
      
      // Check for infinite loop pattern
      const duplicateEndpoints = Object.entries(endpointGroups).filter(([endpoint, calls]) => calls.length > 5);
      if (duplicateEndpoints.length > 0) {
        console.log(`\n❌ CRITICAL: Endpoints with excessive calls:`);
        duplicateEndpoints.forEach(([endpoint, calls]) => {
          console.log(`   - ${endpoint}: ${calls.length} calls`);
        });
      } else {
        console.log(`\n✅ No endpoints with excessive calls detected`);
      }
      
    } else {
      console.log('\n⚠️  No API calls detected');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ User Dashboard Test Complete!');
    console.log('='.repeat(70));
    
    // Take a screenshot
    await page.screenshot({ path: 'test-existing-user.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: test-existing-user.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testExistingUser().catch(console.error);
