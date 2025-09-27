// user-dashboard-render-test.js
const { chromium } = require('playwright');

async function testUserDashboardRender() {
  console.log('🚀 Starting User Dashboard Render Test...\n');
  
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
    
    console.log('\n🔄 Step 2: Navigating to user dashboard...');
    await page.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('\n🔍 Step 3: Checking if UserDashboard is rendering...');
    
    // Check if the dashboard header is present
    const dashboardHeader = await page.$('h1');
    if (dashboardHeader) {
      const headerText = await dashboardHeader.textContent();
      console.log(`✅ Dashboard header found: "${headerText}"`);
    } else {
      console.log('❌ No dashboard header found');
    }
    
    // Check if there are any loading indicators
    const loadingSpinner = await page.$('.animate-spin');
    if (loadingSpinner) {
      console.log('⏳ Loading spinner detected - dashboard is still loading');
    } else {
      console.log('✅ No loading spinner - dashboard should be loaded');
    }
    
    // Check if there are any error messages
    const errorMessage = await page.$('.bg-red-50, .text-red-600, [class*="error"]');
    if (errorMessage) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ Error message found: "${errorText}"`);
    } else {
      console.log('✅ No error messages found');
    }
    
    // Check if there are any dashboard cards or content
    const dashboardCards = await page.$$('[class*="card"], [class*="Card"]');
    console.log(`📊 Dashboard cards found: ${dashboardCards.length}`);
    
    // Check if there are any navigation links
    const navLinks = await page.$$('a[href*="/"], button');
    console.log(`🔗 Navigation elements found: ${navLinks.length}`);
    
    // Check the current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check if we're actually on the dashboard page
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully on dashboard page');
    } else {
      console.log('❌ Not on dashboard page - might have been redirected');
    }
    
    console.log('\n📊 Step 4: Monitoring API calls for 10 seconds...');
    await page.waitForTimeout(10000);
    
    console.log('\n📋 Step 5: Final analysis...');
    
    // Analyze API calls
    console.log('\n' + '='.repeat(70));
    console.log('📊 USER DASHBOARD RENDER ANALYSIS');
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
      
      // Check for profile calls specifically
      const profileCalls = apiCalls.filter(call => 
        call.url.includes('/profiles') || call.url.includes('/profile')
      );
      
      if (profileCalls.length > 0) {
        console.log(`\n✅ Profile API calls detected: ${profileCalls.length}`);
        console.log('   This means the dashboard is working and fetching data!');
      } else {
        console.log(`\n⚠️  No profile API calls detected`);
        console.log('   This could mean:');
        console.log('   - The dashboard is not loading profile data');
        console.log('   - The user is not authenticated properly');
        console.log('   - The component is not rendering');
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Render Test Complete!');
    console.log('='.repeat(70));
    
    // Take a screenshot
    await page.screenshot({ path: 'user-dashboard-render-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: user-dashboard-render-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testUserDashboardRender().catch(console.error);
