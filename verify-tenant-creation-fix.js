const puppeteer = require('puppeteer');

console.log('🔍 Verify Tenant Creation Fix');
console.log('=============================\n');

async function verifyTenantCreationFix() {
  let browser;
  
  try {
    console.log('🚀 Launching browser...');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture all console logs to see the debugging output
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      
      if (text.includes('SuperAdminTenants: Response structure check:')) {
        console.log('📱 Response Structure:', text);
      }
      if (text.includes('SuperAdminTenants: Backend response check:')) {
        console.log('📱 Backend Response:', text);
      }
      if (text.includes('SuperAdminTenants: Tenant created successfully')) {
        console.log('🎉 SUCCESS:', text);
      }
      if (text.includes('SuperAdminTenants: Backend indicated failure:')) {
        console.log('❌ BACKEND FAILURE:', text);
      }
      if (text.includes('SuperAdminTenants: API response indicated failure:')) {
        console.log('❌ API FAILURE:', text);
      }
      if (msg.type() === 'error' && !text.includes('favicon')) {
        console.log('📱 Browser Error:', text);
      }
    });
    
    console.log('🌐 Navigating to login page...');
    await page.goto('https://ibuyscrap.ca/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Auto-login
    console.log('🔐 Auto-logging in...');
    
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.click('input[type="email"]', { clickCount: 3 });
    await page.type('input[type="email"]', 'superadmin@immigrationapp.com');
    
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.type('input[type="password"]', 'SuperAdmin123!');
    
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Login completed!');
    
    // Navigate to tenant management
    console.log('🏢 Navigating to tenant management...');
    await page.goto('https://ibuyscrap.ca/super-admin/tenants', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click Add Tenant button
    console.log('➕ Clicking Add Tenant button...');
    
    const buttons = await page.$$('button');
    let addButton = null;
    
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Add Tenant')) {
        addButton = button;
        console.log('✅ Found add button with text:', text);
        break;
      }
    }
    
    if (addButton) {
      await addButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Clicked add tenant button');
      
      // Fill form with test data
      console.log('📝 Filling form with test data...');
      
      const inputs = await page.$$('input');
      
      for (const input of inputs) {
        const type = await input.evaluate(el => el.type);
        const placeholder = await input.evaluate(el => el.placeholder || '');
        
        if (type === 'email' || placeholder.toLowerCase().includes('email')) {
          await input.click({ clickCount: 3 });
          await input.type('verify-fix@verify-fix.com');
          console.log('✅ Filled email field');
        } else if (type === 'password' || placeholder.toLowerCase().includes('password')) {
          await input.click({ clickCount: 3 });
          await input.type('VerifyFix123!');
          console.log('✅ Filled password field');
        } else if (placeholder.toLowerCase().includes('company') || placeholder.toLowerCase().includes('name')) {
          await input.click({ clickCount: 3 });
          await input.type('Verify Fix Company');
          console.log('✅ Filled company name field');
        } else if (placeholder.toLowerCase().includes('domain')) {
          await input.click({ clickCount: 3 });
          await input.type('verify-fix.com');
          console.log('✅ Filled domain field');
        } else if (placeholder.toLowerCase().includes('first')) {
          await input.click({ clickCount: 3 });
          await input.type('Verify');
          console.log('✅ Filled first name field');
        } else if (placeholder.toLowerCase().includes('last')) {
          await input.click({ clickCount: 3 });
          await input.type('Fix');
          console.log('✅ Filled last name field');
        }
      }
      
      // Take screenshot before submission
      await page.screenshot({ path: 'before-submission.png' });
      console.log('📸 Screenshot saved as before-submission.png');
      
      console.log('\n🎯 MANUAL VERIFICATION REQUIRED:');
      console.log('================================');
      console.log('✅ Form has been filled with test data');
      console.log('✅ You can now manually click "Create Tenant" button');
      console.log('✅ Watch the browser console for debugging output');
      console.log('✅ The fix should show detailed response structure logs');
      console.log('');
      console.log('📋 Expected behavior:');
      console.log('1. Click "Create Tenant" button manually');
      console.log('2. Watch console for "Response structure check" logs');
      console.log('3. Watch for "Backend response check" logs');
      console.log('4. If successful: "Tenant created successfully"');
      console.log('5. If failed: "Backend indicated failure" or "API response indicated failure"');
      console.log('6. Modal should close on success, stay open on failure');
      console.log('');
      console.log('⏰ Browser will stay open for 60 seconds for manual testing...');
      
      // Wait for manual testing
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      // Take final screenshot
      await page.screenshot({ path: 'after-testing.png' });
      console.log('📸 Final screenshot saved as after-testing.png');
      
      // Check final state
      const modal = await page.$('[role="dialog"], .modal, [class*="modal"]');
      const modalVisible = modal ? await modal.isVisible() : false;
      
      if (modalVisible) {
        console.log('\n❌ RESULT: Modal is still open - tenant creation likely failed');
      } else {
        console.log('\n🎉 RESULT: Modal is closed - tenant creation likely succeeded!');
      }
      
    } else {
      console.log('❌ Add tenant button not found');
    }
    
    // Show all console logs for debugging
    console.log('\n📋 All Console Logs:');
    console.log('===================');
    consoleLogs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    if (browser) {
      console.log('\n🔒 Browser will remain open for 10 more seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await browser.close();
    }
  }
}

// Run the test
verifyTenantCreationFix().then(() => {
  console.log('\n🎯 Tenant creation fix verification completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});
