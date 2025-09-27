// Debug page loading issues
const { chromium } = require('playwright');

async function debugPageLoad() {
  console.log('🔍 Debug Page Loading Issues');
  console.log('='.repeat(40));
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track all requests and responses
  const allRequests = [];
  const errors = [];
  const startTime = Date.now();
  
  // Monitor ALL network requests
  page.on('request', (request) => {
    const url = request.url();
    const method = request.method();
    const timestamp = Date.now() - startTime;
    
    allRequests.push({
      timestamp,
      method,
      url,
      type: 'request'
    });
    
    console.log(`📤 [${timestamp}ms] ${method} ${url}`);
  });
  
  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    const timestamp = Date.now() - startTime;
    
    allRequests.push({
      timestamp,
      url,
      status,
      type: 'response'
    });
    
    if (status >= 400) {
      console.log(`❌ [${timestamp}ms] ${status} ERROR ${url}`);
      errors.push({
        timestamp,
        url,
        status,
        type: 'http_error'
      });
    } else {
      console.log(`📥 [${timestamp}ms] ${status} ${url}`);
    }
  });
  
  // Monitor console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const timestamp = Date.now() - startTime;
      console.log(`🚨 [${timestamp}ms] CONSOLE ERROR: ${msg.text()}`);
      errors.push({
        timestamp,
        message: msg.text(),
        type: 'console_error'
      });
    }
  });
  
  try {
    console.log('🌐 Navigating to frontend...');
    await page.goto('http://localhost:5174', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(5000);
    
    // Check what's actually on the page
    console.log('🔍 Checking page content...');
    const pageTitle = await page.title();
    console.log(`📄 Page Title: ${pageTitle}`);
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check for any visible text or elements
    const bodyText = await page.textContent('body');
    console.log(`📝 Page Content (first 200 chars): ${bodyText?.substring(0, 200)}...`);
    
    // Check for specific elements
    const loginForm = await page.$('input[type="email"]');
    const loginButton = await page.$('button[type="submit"]');
    const anyForm = await page.$('form');
    
    console.log(`🔍 Elements found:`);
    console.log(`  - Email input: ${loginForm ? '✅ Found' : '❌ Not found'}`);
    console.log(`  - Submit button: ${loginButton ? '✅ Found' : '❌ Not found'}`);
    console.log(`  - Any form: ${anyForm ? '✅ Found' : '❌ Not found'}`);
    
    // Check for React errors
    const reactErrors = await page.evaluate(() => {
      const errors = [];
      // Check if there are any error boundaries triggered
      const errorElements = document.querySelectorAll('[data-react-error], .error-boundary, [class*="error"]');
      errorElements.forEach(el => {
        errors.push(el.textContent);
      });
      return errors;
    });
    
    if (reactErrors.length > 0) {
      console.log('🚨 React errors found:', reactErrors);
    }
    
    // Try to navigate to login page specifically
    console.log('\n🧭 Trying to navigate to /login...');
    try {
      await page.goto('http://localhost:5174/login', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      
      const loginUrl = page.url();
      console.log(`📍 Login URL: ${loginUrl}`);
      
      const loginFormAfter = await page.$('input[type="email"]');
      console.log(`🔍 Login form after navigation: ${loginFormAfter ? '✅ Found' : '❌ Not found'}`);
      
    } catch (error) {
      console.log('❌ Login page navigation failed:', error.message);
    }
    
    // Analyze the results
    console.log('\n📊 ERROR ANALYSIS:');
    console.log('='.repeat(40));
    
    if (errors.length === 0) {
      console.log('✅ No errors detected!');
    } else {
      console.log(`❌ ${errors.length} errors found:`);
      errors.forEach((error, index) => {
        console.log(`\n${index + 1}. [${error.timestamp}ms] ${error.type.toUpperCase()}`);
        if (error.url) console.log(`   URL: ${error.url}`);
        if (error.status) console.log(`   Status: ${error.status}`);
        if (error.message) console.log(`   Message: ${error.message}`);
      });
    }
    
    // Check for specific problematic resources
    const problematicRequests = allRequests.filter(req => 
      req.status >= 400 || 
      (req.url.includes('themeService') && req.status >= 400)
    );
    
    if (problematicRequests.length > 0) {
      console.log('\n🚨 Problematic Requests:');
      problematicRequests.forEach((req, index) => {
        console.log(`${index + 1}. [${req.timestamp}ms] ${req.status} ${req.url}`);
      });
    }
    
    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      pageTitle,
      currentUrl,
      errors: errors,
      allRequests: allRequests,
      problematicRequests: problematicRequests,
      reactErrors: reactErrors
    };
    
    require('fs').writeFileSync('debug-page-load-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Debug results saved to: debug-page-load-results.json');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the debug
debugPageLoad().catch(console.error);
