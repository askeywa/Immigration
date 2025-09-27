const { chromium } = require('playwright');

async function detailedSuperAdminTest() {
  console.log('🔍 Starting Detailed Super Admin Dashboard Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Moderate speed for detailed observation
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor all network requests in detail
  const apiCalls = [];
  const staticAssets = [];
  const errors = [];
  const successfulRequests = [];
  
  page.on('request', request => {
    const requestData = {
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      timestamp: new Date().toISOString(),
      headers: request.headers()
    };
    
    if (request.url().includes('/api/')) {
      apiCalls.push(requestData);
    } else if (['image', 'stylesheet', 'script', 'font', 'media'].includes(request.resourceType())) {
      staticAssets.push(requestData);
    }
  });
  
  page.on('response', response => {
    const request = response.request();
    const url = request.url();
    const status = response.status();
    
    if (status >= 400) {
      errors.push({
        url: url,
        status: status,
        statusText: response.statusText(),
        resourceType: request.resourceType(),
        timestamp: new Date().toISOString(),
        headers: response.headers()
      });
    } else {
      successfulRequests.push({
        url: url,
        status: status,
        resourceType: request.resourceType(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Monitor console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        type: 'console_error',
        message: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Monitor page errors
  page.on('pageerror', error => {
    errors.push({
      type: 'page_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    console.log('📱 Step 1: Navigating to login page...');
    await page.goto('http://localhost:5174/login');
    await page.waitForLoadState('networkidle');
    
    console.log('🔐 Step 2: Logging in as Super Admin...');
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill credentials
    await page.fill('input[type="email"]', 'superadmin@immigrationapp.com');
    await page.fill('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for navigation to super admin dashboard
    await page.waitForURL('**/super-admin**', { timeout: 15000 });
    console.log('✅ Successfully logged in and navigated to Super Admin Dashboard');
    
    console.log('\n🔍 Step 3: Analyzing Super Admin Dashboard...');
    
    // Wait for dashboard to fully load
    await page.waitForTimeout(5000);
    
    // Check dashboard structure
    console.log('\n📊 Dashboard Structure Analysis:');
    
    // Check for main dashboard elements
    const mainElements = await page.locator('main, [role="main"], .main-content, .dashboard').count();
    console.log(`📋 Main content areas: ${mainElements}`);
    
    // Check for navigation
    const navElements = await page.locator('nav, [role="navigation"], .navigation, .sidebar').count();
    console.log(`🧭 Navigation elements: ${navElements}`);
    
    // Check for dashboard cards/sections
    const cardElements = await page.locator('.card, .dashboard-card, .metric-card, .stat-card').count();
    console.log(`📈 Dashboard cards: ${cardElements}`);
    
    // Check for buttons and interactive elements
    const buttonElements = await page.locator('button, [role="button"], .btn').count();
    console.log(`🔘 Interactive buttons: ${buttonElements}`);
    
    // Check for tables
    const tableElements = await page.locator('table, .table').count();
    console.log(`📊 Tables: ${tableElements}`);
    
    // Check for forms
    const formElements = await page.locator('form, .form').count();
    console.log(`📝 Forms: ${formElements}`);
    
    console.log('\n🔍 Step 4: Testing Dashboard Functionality...');
    
    // Test navigation links
    const navLinks = await page.locator('nav a, .navigation a, .sidebar a').all();
    console.log(`🔗 Navigation links found: ${navLinks.length}`);
    
    for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
      const link = navLinks[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`   ${i + 1}. "${text}" -> ${href}`);
    }
    
    // Test dashboard interactions
    console.log('\n🖱️ Testing Interactive Elements...');
    
    // Try clicking on any dashboard cards or buttons
    const clickableElements = await page.locator('.card, .dashboard-card, .metric-card, button:not([disabled])').all();
    console.log(`🖱️ Clickable elements found: ${clickableElements.length}`);
    
    if (clickableElements.length > 0) {
      console.log('   Testing first few clickable elements...');
      for (let i = 0; i < Math.min(clickableElements.length, 3); i++) {
        try {
          const element = clickableElements[i];
          const tagName = await element.evaluate(el => el.tagName);
          const className = await element.getAttribute('class');
          console.log(`   ${i + 1}. Clicking ${tagName} with class: ${className}`);
          
          await element.click();
          await page.waitForTimeout(1000);
          
          // Check if URL changed or new content loaded
          const currentUrl = page.url();
          console.log(`      Current URL after click: ${currentUrl}`);
          
        } catch (error) {
          console.log(`      ❌ Error clicking element: ${error.message}`);
        }
      }
    }
    
    console.log('\n📡 Step 5: Analyzing Network Requests...');
    
    // Analyze API calls
    console.log('\n🌐 API Calls Made:');
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} ${call.url}`);
      console.log(`   Resource Type: ${call.resourceType}`);
      console.log(`   Timestamp: ${call.timestamp}`);
    });
    
    // Analyze static assets
    console.log('\n📦 Static Assets Loaded:');
    const assetTypes = {};
    staticAssets.forEach(asset => {
      assetTypes[asset.resourceType] = (assetTypes[asset.resourceType] || 0) + 1;
    });
    
    Object.entries(assetTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} files`);
    });
    
    // Analyze errors in detail
    console.log('\n❌ Errors Analysis:');
    if (errors.length > 0) {
      const errorTypes = {};
      errors.forEach(error => {
        const type = error.type || 'network_error';
        errorTypes[type] = (errorTypes[type] || 0) + 1;
      });
      
      console.log('   Error Summary:');
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} errors`);
      });
      
      console.log('\n   Detailed Error List:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.type || 'network'}] ${error.status || 'N/A'} - ${error.url || error.message}`);
        if (error.resourceType) console.log(`      Resource Type: ${error.resourceType}`);
      });
      
      // Focus on 404 errors
      const notFoundErrors = errors.filter(e => e.status === 404);
      if (notFoundErrors.length > 0) {
        console.log('\n🔍 404 Errors Investigation:');
        notFoundErrors.forEach((error, index) => {
          console.log(`   ${index + 1}. URL: ${error.url}`);
          console.log(`      Resource Type: ${error.resourceType}`);
          console.log(`      Timestamp: ${error.timestamp}`);
        });
      }
    } else {
      console.log('   ✅ No errors found!');
    }
    
    // Check dashboard performance
    console.log('\n⚡ Performance Analysis:');
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });
    
    console.log(`   DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`   Load Complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`   Total Load Time: ${performanceMetrics.totalLoadTime}ms`);
    
    // Wait for user observation
    console.log('\n⏳ Waiting 20 seconds for detailed observation...');
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'super-admin-detailed-test-error.png' });
    console.log('📸 Screenshot saved as super-admin-detailed-test-error.png');
  } finally {
    await browser.close();
  }
}

// Run the detailed test
detailedSuperAdminTest().catch(console.error);

