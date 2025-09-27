const { chromium } = require('playwright');

async function testSuperAdminBrowserLogin() {
  console.log('🚀 Starting Super Admin Browser Login Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better observation
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor all network requests
  const apiCalls = [];
  const errors = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      const call = apiCalls.find(c => c.url === response.url());
      if (call) {
        call.status = response.status();
        call.statusText = response.statusText();
        
        if (response.status() >= 400) {
          errors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  });
  
  // Monitor console errors
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
    console.log('📱 Navigating to login page...');
    await page.goto('http://localhost:5174/login');
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Looking for login form elements...');
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });
    
    const emailInput = await page.locator('input[type="email"], input[name="email"], #email').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"], #password').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    
    console.log('✅ Login form elements found');
    
    // Super Admin Credentials
    const superAdminEmail = 'superadmin@immigrationapp.com';
    const superAdminPassword = 'SuperAdmin123!';
    
    console.log(`\n🔐 Logging in as Super Admin: ${superAdminEmail}`);
    
    // Clear inputs
    await emailInput.clear();
    await passwordInput.clear();
    
    // Fill in credentials
    await emailInput.fill(superAdminEmail);
    await passwordInput.fill(superAdminPassword);
    
    console.log('📝 Credentials entered, clicking login...');
    
    // Click login button
    await loginButton.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    // Check if login was successful
    if (currentUrl.includes('/super-admin')) {
      console.log('🎉 SUCCESS! Successfully logged into Super Admin Dashboard!');
      
      // Wait for dashboard to load completely
      await page.waitForTimeout(5000);
      
      // Check for super admin specific elements
      try {
        const dashboardTitle = await page.locator('h1, h2, [class*="title"], [class*="heading"]').first().textContent();
        console.log(`📊 Dashboard Title: ${dashboardTitle}`);
        
        // Check for super admin specific content
        const superAdminContent = await page.locator('text=Super Admin, text=System, text=Tenant Management, text=Analytics').first().isVisible();
        console.log(`🔍 Super Admin content visible: ${superAdminContent}`);
        
        // Check for any error messages on the dashboard
        const errorMessages = await page.locator('.error, .alert-danger, [class*="error"], [class*="danger"]').allTextContents();
        if (errorMessages.length > 0) {
          console.log('⚠️ Error messages found on dashboard:');
          errorMessages.forEach((msg, index) => {
            console.log(`   ${index + 1}. ${msg}`);
          });
        }
        
        // Check for loading states
        const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]').count();
        if (loadingElements > 0) {
          console.log(`⏳ ${loadingElements} loading elements still visible`);
        }
        
      } catch (error) {
        console.log('⚠️ Could not check dashboard content:', error.message);
      }
      
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Still on login page - login failed');
      
      // Check for error messages
      const errorMessage = await page.locator('.error, .alert-danger, [class*="error"], [class*="danger"]').first().textContent().catch(() => null);
      if (errorMessage) {
        console.log(`❌ Error message: ${errorMessage}`);
      }
      
    } else {
      console.log(`🔄 Redirected to unexpected page: ${currentUrl}`);
    }
    
    // Print API calls made during login
    console.log('\n📡 API Calls Made During Login:');
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} ${call.url} - Status: ${call.status || 'Pending'}`);
    });
    
    // Print errors if any
    if (errors.length > 0) {
      console.log('\n❌ Errors Encountered:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.message}`);
        if (error.url) console.log(`   URL: ${error.url}`);
        if (error.status) console.log(`   Status: ${error.status}`);
      });
    } else {
      console.log('\n✅ No errors encountered during login!');
    }
    
    // Wait for user to observe the dashboard
    console.log('\n⏳ Waiting 15 seconds for observation...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'super-admin-browser-test-error.png' });
    console.log('📸 Screenshot saved as super-admin-browser-test-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testSuperAdminBrowserLogin().catch(console.error);
