// direct-user-dashboard-test.js
const { chromium } = require('playwright');

async function testDirectUserDashboard() {
  console.log('🚀 Starting Direct User Dashboard Test...\n');
  
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
    console.log('🔐 Step 1: Logging in as super admin...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.fill('input[id="email"]', 'superadmin@immigrationapp.com');
    await page.fill('input[id="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    console.log('\n🔄 Step 2: Force navigating to user dashboard...');
    // Clear any redirects and go directly to dashboard
    await page.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('\n🔍 Step 3: Checking dashboard content...');
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check if we're on the dashboard page
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully on dashboard page');
    } else {
      console.log('❌ Not on dashboard page - might have been redirected');
      console.log('   This suggests the user dashboard route might not be accessible to super admin');
    }
    
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
    
    console.log('\n📊 Step 4: Monitoring API calls for 15 seconds...');
    await page.waitForTimeout(15000);
    
    console.log('\n📋 Step 5: Final analysis...');
    
    // Analyze API calls
    console.log('\n' + '='.repeat(70));
    console.log('📊 DIRECT USER DASHBOARD ANALYSIS');
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
        console.log(`  🔗 ${endpoint} - ${calls.length} calls`);
      });
      
      // Check for profile calls
      const profileCalls = apiCalls.filter(call => 
        call.url.includes('/profiles') || call.url.includes('/profile')
      );
      
      if (profileCalls.length > 0) {
        console.log(`\n✅ Profile API calls detected: ${profileCalls.length}`);
        if (profileCalls.length > 10) {
          console.log('❌ CRITICAL: Too many profile calls - infinite loop still present!');
        } else {
          console.log('✅ Profile calls are within normal range - infinite loop fixed!');
        }
      } else {
        console.log(`\n⚠️  No profile API calls detected`);
      }
      
      // Check for theme calls
      const themeCalls = apiCalls.filter(call => 
        call.url.includes('/themes')
      );
      
      if (themeCalls.length > 0) {
        console.log(`\n🎨 Theme API calls: ${themeCalls.length}`);
        if (themeCalls.length > 3) {
          console.log('❌ Too many theme calls - caching issue still present');
        } else {
          console.log('✅ Theme calls are normal');
        }
      }
      
    } else {
      console.log('\n⚠️  No API calls detected');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Direct Test Complete!');
    console.log('='.repeat(70));
    
    // Take a screenshot
    await page.screenshot({ path: 'direct-user-dashboard-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: direct-user-dashboard-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDirectUserDashboard().catch(console.error);
