const { chromium } = require('playwright');

async function testSuperAdminLogin() {
  console.log('🚀 Starting Super Admin Login Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better observation
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor all network requests
  const apiCalls = [];
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
      const call = apiCalls.find(c => c.url === response.url() && c.timestamp);
      if (call) {
        call.status = response.status();
        call.statusText = response.statusText();
      }
    }
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
    console.log('📧 Email input:', await emailInput.isVisible() ? 'Visible' : 'Not visible');
    console.log('🔒 Password input:', await passwordInput.isVisible() ? 'Visible' : 'Not visible');
    console.log('🔘 Login button:', await loginButton.isVisible() ? 'Visible' : 'Not visible');
    
    // List of passwords to try
    const passwordsToTry = [
      'TestPassword123!',
      'SuperAdmin123!',
      'superadmin123!',
      'SuperAdmin123',
      'superadmin123',
      'Admin123!',
      'admin123!',
      'Admin123',
      'admin123',
      'Password123!',
      'password123!',
      'Password123',
      'password123',
      'Immigration123!',
      'immigration123!',
      'Immigration123',
      'immigration123',
      'RCIC123!',
      'rcic123!',
      'RCIC123',
      'rcic123'
    ];
    
    const superAdminEmail = 'superadmin@immigrationapp.com';
    
    console.log(`\n🔐 Testing Super Admin Login: ${superAdminEmail}`);
    console.log(`📋 Will try ${passwordsToTry.length} different passwords\n`);
    
    for (let i = 0; i < passwordsToTry.length; i++) {
      const password = passwordsToTry[i];
      console.log(`\n🧪 Attempt ${i + 1}/${passwordsToTry.length}: Testing password "${password}"`);
      
      // Clear inputs
      await emailInput.clear();
      await passwordInput.clear();
      
      // Fill in credentials
      await emailInput.fill(superAdminEmail);
      await passwordInput.fill(password);
      
      // Click login button
      await loginButton.click();
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Check for success indicators
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Check for error messages
      const errorMessage = await page.locator('.error, .alert-danger, [class*="error"], [class*="danger"]').first().textContent().catch(() => null);
      if (errorMessage) {
        console.log(`❌ Error message: ${errorMessage}`);
      }
      
      // Check for success indicators
      if (currentUrl.includes('/super-admin') || currentUrl.includes('/dashboard')) {
        console.log('🎉 SUCCESS! Login successful!');
        console.log(`✅ Redirected to: ${currentUrl}`);
        
        // Check if we're on super admin dashboard
        if (currentUrl.includes('/super-admin')) {
          console.log('🏆 Successfully logged into Super Admin Dashboard!');
          
          // Wait for dashboard to load
          await page.waitForTimeout(3000);
          
          // Check for super admin specific elements
          const dashboardTitle = await page.locator('h1, h2, [class*="title"], [class*="heading"]').first().textContent().catch(() => null);
          console.log(`📊 Dashboard Title: ${dashboardTitle}`);
          
          // Check for super admin specific content
          const superAdminContent = await page.locator('text=Super Admin, text=System, text=Tenant Management').first().isVisible().catch(() => false);
          console.log(`🔍 Super Admin content visible: ${superAdminContent}`);
          
        } else {
          console.log('⚠️ Logged in but not on super admin dashboard');
        }
        
        break;
      } else if (currentUrl.includes('/login')) {
        console.log('❌ Still on login page - password incorrect');
      } else {
        console.log(`🔄 Redirected to: ${currentUrl}`);
      }
      
      // Wait before next attempt
      await page.waitForTimeout(1000);
    }
    
    // Print API calls made during login attempts
    console.log('\n📡 API Calls Made During Test:');
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} ${call.url} - Status: ${call.status || 'Pending'}`);
    });
    
    // Wait for user to observe
    console.log('\n⏳ Waiting 10 seconds for observation...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'super-admin-login-error.png' });
    console.log('📸 Screenshot saved as super-admin-login-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testSuperAdminLogin().catch(console.error);
