// create-user-and-test.js
const { chromium } = require('playwright');

async function createUserAndTestDashboard() {
  console.log('🚀 Starting User Creation and Dashboard Test...\n');
  
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
    console.log('📝 Step 1: Creating a new user...');
    await page.goto('http://localhost:5174/register', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Generate unique user credentials
    const timestamp = Date.now();
    const userEmail = `testuser${timestamp}@example.com`;
    const userPassword = 'TestPassword123!';
    
    console.log(`📧 Creating user: ${userEmail}`);
    
    // Fill registration form
    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[id="email"]', userEmail);
    await page.fill('input[id="password"]', userPassword);
    await page.fill('input[id="confirmPassword"]', userPassword);
    
    // Submit registration
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Check if registration was successful
    const currentUrl = page.url();
    console.log(`📍 Current URL after registration: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/tenant/dashboard')) {
      console.log('✅ User registration and login successful!');
    } else if (currentUrl.includes('/register')) {
      console.log('❌ Registration failed - still on register page');
      return;
    } else {
      console.log('⚠️  Unexpected redirect after registration');
    }
    
    console.log('\n🔍 Step 2: Checking if we are on user dashboard...');
    
    // Check current URL
    const dashboardUrl = page.url();
    console.log(`📍 Dashboard URL: ${dashboardUrl}`);
    
    // Check for dashboard content
    const dashboardHeader = await page.$('h1');
    if (dashboardHeader) {
      const headerText = await dashboardHeader.textContent();
      console.log(`📋 Dashboard header: "${headerText}"`);
    }
    
    // Check for any error messages
    const errorMessage = await page.$('.bg-red-50, .text-red-600, [class*="error"]');
    if (errorMessage) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ Error message: "${errorText}"`);
    }
    
    // Check for loading states
    const loadingSpinner = await page.$('.animate-spin');
    if (loadingSpinner) {
      console.log('⏳ Loading spinner detected');
    }
    
    console.log('\n📊 Step 3: Monitoring API calls for 15 seconds...');
    await page.waitForTimeout(15000);
    
    console.log('\n📋 Step 4: Analyzing results...');
    
    // Analyze API calls
    console.log('\n' + '='.repeat(70));
    console.log('📊 USER DASHBOARD API CALL ANALYSIS');
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
      }
      
    } else {
      console.log('\n⚠️  No API calls detected - this might indicate:');
      console.log('   - The page is not loading properly');
      console.log('   - The dashboard is not making any API calls');
      console.log('   - There might be a JavaScript error preventing execution');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ User Creation and Dashboard Test Complete!');
    console.log('='.repeat(70));
    
    // Take a screenshot
    await page.screenshot({ path: 'create-user-and-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: create-user-and-test.png');
    
    // Save user credentials for future use
    console.log(`\n💾 User credentials created:`);
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: ${userPassword}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
createUserAndTestDashboard().catch(console.error);
