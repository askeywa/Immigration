const { chromium } = require('playwright');

async function testSuperAdminDashboardAfterFixes() {
  console.log('🚀 Starting Final Super Admin Dashboard Test After Fixes...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track all network requests and errors
  const apiCalls = [];
  const errors = [];
  const successfulCalls = [];
  
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
        } else {
          successfulCalls.push({
            url: response.url(),
            status: response.status(),
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        type: 'console_error',
        message: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('pageerror', error => {
    errors.push({
      type: 'page_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    console.log('🔐 Step 1: Logging in as Super Admin...');
    
    await page.goto('http://localhost:5174/login');
    await page.waitForSelector('input[type="email"]');
    
    await page.fill('input[type="email"]', 'superadmin@immigrationapp.com');
    await page.fill('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/super-admin**');
    console.log('✅ Successfully logged in and navigated to Super Admin Dashboard');
    
    console.log('\n🧭 Step 2: Testing All Super Admin Pages...');
    
    const pages = [
      { name: 'Dashboard', url: '/super-admin' },
      { name: 'Tenants', url: '/super-admin/tenants' },
      { name: 'Users', url: '/super-admin/users' },
      { name: 'Reports', url: '/super-admin/reports' },
      { name: 'Analytics', url: '/super-admin/analytics' }
    ];
    
    for (const pageInfo of pages) {
      console.log(`\n🔗 Testing ${pageInfo.name} page...`);
      
      // Clear previous errors for this page
      const errorsBefore = errors.length;
      const successfulCallsBefore = successfulCalls.length;
      
      try {
        // Try both Link component and a tag selectors
        const linkSelector = `[href="${pageInfo.url}"], a[href="${pageInfo.url}"]`;
        await page.click(linkSelector);
        await page.waitForLoadState('networkidle');
        
        const currentUrl = page.url();
        console.log(`   Current URL: ${currentUrl}`);
        
        // Check if we're on the expected page
        if (currentUrl.includes(pageInfo.url)) {
          console.log(`   ✅ Successfully navigated to ${pageInfo.name}`);
          
          // Check for page content
          const pageTitle = await page.locator('h1, h2, [class*="title"]').first().textContent().catch(() => null);
          if (pageTitle) {
            console.log(`   📄 Page Title: ${pageTitle}`);
          }
          
          // Check for error messages on the page
          const errorMessages = await page.locator('.error, .alert-danger, [class*="error"]').allTextContents();
          if (errorMessages.length > 0) {
            console.log(`   ⚠️ Error messages found:`);
            errorMessages.forEach((msg, index) => {
              console.log(`      ${index + 1}. ${msg}`);
            });
          }
          
          // Check for data loading
          const dataElements = await page.locator('.card, .dashboard-card, .metric-card, table, .data-table').count();
          console.log(`   📊 Data elements found: ${dataElements}`);
          
          // Check for loading states
          const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]').count();
          if (loadingElements > 0) {
            console.log(`   ⏳ Loading elements still visible: ${loadingElements}`);
          }
          
        } else {
          console.log(`   ❌ Navigation failed - expected ${pageInfo.url}, got ${currentUrl}`);
        }
        
        // Check for new errors
        const newErrors = errors.slice(errorsBefore);
        const newSuccessfulCalls = successfulCalls.slice(successfulCallsBefore);
        
        if (newErrors.length > 0) {
          console.log(`   ❌ ${newErrors.length} new errors during navigation:`);
          newErrors.forEach((error, index) => {
            console.log(`      ${index + 1}. [${error.type || 'network'}] ${error.status || 'N/A'} - ${error.url || error.message}`);
          });
        } else {
          console.log(`   ✅ No new errors during navigation`);
        }
        
        if (newSuccessfulCalls.length > 0) {
          console.log(`   ✅ ${newSuccessfulCalls.length} successful API calls:`);
          newSuccessfulCalls.forEach((call, index) => {
            console.log(`      ${index + 1}. ${call.status} - ${call.url}`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error testing ${pageInfo.name}: ${error.message}`);
      }
      
      // Wait between page tests
      await page.waitForTimeout(3000);
    }
    
    console.log('\n📊 Step 3: Final Analysis...');
    
    console.log(`\n📈 Overall Results:`);
    console.log(`   Total API calls made: ${apiCalls.length}`);
    console.log(`   Successful API calls: ${successfulCalls.length}`);
    console.log(`   Failed API calls: ${errors.filter(e => e.status >= 400).length}`);
    console.log(`   Console errors: ${errors.filter(e => e.type === 'console_error').length}`);
    console.log(`   Page errors: ${errors.filter(e => e.type === 'page_error').length}`);
    
    // Analyze API endpoints
    console.log(`\n🌐 API Endpoint Analysis:`);
    const endpointStats = {};
    successfulCalls.forEach(call => {
      const endpoint = call.url.replace('http://localhost:5174/api/', '');
      endpointStats[endpoint] = (endpointStats[endpoint] || 0) + 1;
    });
    
    Object.entries(endpointStats).forEach(([endpoint, count]) => {
      console.log(`   ✅ ${endpoint}: ${count} successful calls`);
    });
    
    // Check for 404 errors
    const notFoundErrors = errors.filter(e => e.status === 404);
    if (notFoundErrors.length > 0) {
      console.log(`\n❌ 404 Errors Found:`);
      notFoundErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.url}`);
      });
    } else {
      console.log(`\n✅ No 404 errors found!`);
    }
    
    // Overall assessment
    const successRate = (successfulCalls.length / apiCalls.length * 100).toFixed(1);
    console.log(`\n🏆 Overall Success Rate: ${successRate}%`);
    
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT! Super Admin Dashboard is working perfectly!');
    } else if (successRate >= 70) {
      console.log('✅ GOOD! Super Admin Dashboard is mostly working with minor issues.');
    } else if (successRate >= 50) {
      console.log('⚠️ FAIR! Super Admin Dashboard has some issues that need attention.');
    } else {
      console.log('❌ POOR! Super Admin Dashboard has significant issues.');
    }
    
    // Wait for final observation
    console.log('\n⏳ Waiting 10 seconds for final observation...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'super-admin-final-test-error.png' });
    console.log('📸 Screenshot saved as super-admin-final-test-error.png');
  } finally {
    await browser.close();
  }
}

// Run the final test
testSuperAdminDashboardAfterFixes().catch(console.error);

