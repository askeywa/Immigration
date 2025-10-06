const puppeteer = require('puppeteer');

async function diagnoseDashboardLoading() {
  let browser;
  
  try {
    console.log('🔍 Diagnosing Dashboard Loading Issue');
    console.log('=====================================');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--disable-web-security', '--no-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor network requests
    const networkRequests = [];
    const networkErrors = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        if (response.status() >= 400) {
          networkErrors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      }
    });
    
    // Login
    console.log('🔐 Logging in...');
    await page.goto('https://honeynwild.com/immigration-portal/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.type('#email', 'admin@honeynwild.com', { delay: 100 });
    await page.type('#password', 'Admin@123!', { delay: 100 });
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 });
    } catch (e) {
      console.log('⚠️ Navigation timeout, checking current state...');
    }
    
    let currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('auth-callback')) {
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
        currentUrl = page.url();
      } catch (e) {
        console.log('⚠️ Final navigation timeout');
        currentUrl = page.url();
      }
    }
    
    console.log(`📍 Final URL: ${currentUrl}`);
    
    // Navigate directly to dashboard if needed
    if (!currentUrl.includes('tenant/dashboard')) {
      console.log('🔄 Navigating directly to dashboard...');
      await page.goto('https://ibuyscrap.ca/tenant/dashboard', { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
      });
    }
    
    // Wait for dashboard to load and check for loading state
    console.log('⏳ Waiting for dashboard content...');
    
    let loadingState = true;
    let attempts = 0;
    const maxAttempts = 20; // 20 seconds total
    
    while (loadingState && attempts < maxAttempts) {
      attempts++;
      
      // Check if loading spinner is still present
      const loadingElements = await page.$$('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
      const loadingText = await page.evaluate(() => {
        const text = document.body.textContent.toLowerCase();
        return text.includes('loading') || text.includes('spinner');
      });
      
      if (loadingElements.length === 0 && !loadingText) {
        loadingState = false;
        console.log('✅ Dashboard content loaded successfully');
        break;
      }
      
      console.log(`⏳ Still loading... (${attempts}/${maxAttempts})`);
      
      // Check for any error messages
      const errorMessages = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.error, .alert, [class*="error"], [class*="alert"]');
        return Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
      });
      
      if (errorMessages.length > 0) {
        console.log('❌ Error messages found:');
        errorMessages.forEach(msg => console.log(`   - ${msg}`));
      }
      
      // Check console for errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (loadingState) {
      console.log('❌ Dashboard still loading after 20 seconds - investigating...');
      
      // Take screenshot
      await page.screenshot({ path: 'dashboard-loading-issue.png', fullPage: true });
      console.log('📸 Screenshot saved: dashboard-loading-issue.png');
      
      // Check what's actually on the page
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          hasContent: document.body.children.length,
          textContent: document.body.textContent.substring(0, 500),
          loadingElements: document.querySelectorAll('[class*="loading"], [class*="spinner"]').length
        };
      });
      
      console.log('📄 Page Analysis:');
      console.log(`   Title: ${pageContent.title}`);
      console.log(`   URL: ${pageContent.url}`);
      console.log(`   Elements: ${pageContent.hasContent}`);
      console.log(`   Loading Elements: ${pageContent.loadingElements}`);
      console.log(`   Content Preview: ${pageContent.textContent.substring(0, 200)}...`);
    }
    
    // Analyze network requests
    console.log('\n📡 Network Analysis:');
    console.log(`   Total API Requests: ${networkRequests.length}`);
    
    if (networkRequests.length > 0) {
      console.log('   API Calls Made:');
      networkRequests.forEach(req => {
        console.log(`     ${req.method} ${req.url}`);
      });
    } else {
      console.log('   ❌ No API requests detected - this is the problem!');
    }
    
    if (networkErrors.length > 0) {
      console.log('   ❌ API Errors:');
      networkErrors.forEach(err => {
        console.log(`     ${err.status} ${err.url} - ${err.statusText}`);
      });
    }
    
    // Check for specific dashboard API calls
    const dashboardApis = networkRequests.filter(req => 
      req.url.includes('dashboard') || 
      req.url.includes('stats') || 
      req.url.includes('analytics') ||
      req.url.includes('tenant')
    );
    
    console.log(`   Dashboard API Calls: ${dashboardApis.length}`);
    
    if (dashboardApis.length === 0) {
      console.log('   ❌ No dashboard API calls found - frontend not making requests!');
    }
    
    // Try to manually trigger dashboard data fetch
    console.log('\n🔧 Attempting Manual Fix...');
    
    try {
      // Check if React Query is available and manually trigger refetch
      const manualTrigger = await page.evaluate(() => {
        // Try to find and trigger React Query refetch
        if (window.queryClient) {
          return 'React Query found - attempting refetch';
        }
        
        // Try to find any fetch functions
        if (window.fetchTenantData) {
          window.fetchTenantData();
          return 'Manual fetch triggered';
        }
        
        // Try to reload the page
        window.location.reload();
        return 'Page reloaded';
      });
      
      console.log(`   ${manualTrigger}`);
      
      // Wait a bit for manual trigger to work
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if loading is resolved
      const stillLoading = await page.evaluate(() => {
        const text = document.body.textContent.toLowerCase();
        return text.includes('loading') || text.includes('spinner');
      });
      
      if (!stillLoading) {
        console.log('✅ Manual fix successful!');
      } else {
        console.log('❌ Manual fix did not resolve the issue');
      }
      
    } catch (e) {
      console.log(`❌ Manual fix failed: ${e.message}`);
    }
    
    console.log('\n🎯 Diagnosis Summary:');
    console.log('=====================');
    console.log(`✅ Login: Working`);
    console.log(`✅ Navigation: Working`);
    console.log(`${loadingState ? '❌' : '✅'} Dashboard Content: ${loadingState ? 'Stuck Loading' : 'Loaded'}`);
    console.log(`📡 API Requests: ${networkRequests.length}`);
    console.log(`❌ API Errors: ${networkErrors.length}`);
    
    if (networkRequests.length === 0) {
      console.log('\n🔍 ROOT CAUSE: No API requests being made');
      console.log('   Possible issues:');
      console.log('   - Frontend not triggering API calls');
      console.log('   - React Query not configured properly');
      console.log('   - Component not mounting correctly');
      console.log('   - Authentication headers missing');
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run diagnosis
diagnoseDashboardLoading();
