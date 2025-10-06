const puppeteer = require('puppeteer');

async function fixLoginRedirect() {
  let browser;
  
  try {
    console.log('🔧 Fixing Login Redirect Issue');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable detailed logging
    page.on('console', msg => {
      console.log('🌐 Console:', msg.text());
    });
    
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/tenant/')) {
        console.log(`📡 Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/tenant/')) {
        console.log(`📡 Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to login page
    console.log('🔗 Navigating to login page...');
    await page.goto('https://honeynwild.com/immigration-portal/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fill and submit form
    console.log('🔐 Filling login form...');
    await page.type('input[type="email"]', 'admin@honeynwild.com');
    await page.type('input[type="password"]', 'Admin@123!');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🔑 Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for API call and response
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Check if we got redirected
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check for any error messages
    const errorMessages = await page.$$('.error, .alert, [class*="error"], [class*="alert"]');
    console.log(`⚠️ Error messages: ${errorMessages.length}`);
    
    for (let i = 0; i < errorMessages.length; i++) {
      const text = await errorMessages[i].evaluate(el => el.textContent);
      console.log(`  Error ${i + 1}: "${text}"`);
    }
    
    // Check for success messages
    const successMessages = await page.$$('.success, [class*="success"]');
    console.log(`✅ Success messages: ${successMessages.length}`);
    
    for (let i = 0; i < successMessages.length; i++) {
      const text = await successMessages[i].evaluate(el => el.textContent);
      console.log(`  Success ${i + 1}: "${text}"`);
    }
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // If we're still on the login page, let's manually check the API call
    if (currentUrl.includes('honeynwild.com')) {
      console.log('\n🔍 Still on honeynwild.com - checking API response...');
      
      // Let's try to manually call the API to see what's happening
      const apiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('https://ibuyscrap.ca/api/v1/tenant/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Original-Host': 'honeynwild.com',
              'X-Tenant-Domain': 'honeynwild.com'
            },
            body: JSON.stringify({
              email: 'admin@honeynwild.com',
              password: 'Admin@123!',
              tenantDomain: 'honeynwild.com'
            })
          });
          
          const data = await response.json();
          return {
            status: response.status,
            data: data
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      });
      
      console.log('🔍 Manual API Response:', JSON.stringify(apiResponse, null, 2));
      
      if (apiResponse.data && apiResponse.data.success) {
        console.log('✅ API call successful!');
        console.log('🔗 Frontend URL from API:', apiResponse.data.data.frontendUrl);
        
        // Try manual redirect
        console.log('🔄 Attempting manual redirect...');
        await page.evaluate((frontendUrl) => {
          window.location.href = frontendUrl;
        }, apiResponse.data.data.frontendUrl);
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const finalUrl = page.url();
        console.log(`📍 Final URL after manual redirect: ${finalUrl}`);
        
        if (finalUrl.includes('ibuyscrap.ca')) {
          console.log('✅ Manual redirect successful!');
        } else {
          console.log('❌ Manual redirect failed');
        }
      } else {
        console.log('❌ API call failed:', apiResponse);
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'fix-login-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
    // Keep browser open
    console.log('👀 Browser will stay open for 20 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

fixLoginRedirect();
