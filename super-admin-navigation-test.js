const { chromium } = require('playwright');

async function testSuperAdminNavigation() {
  console.log('🧭 Starting Super Admin Navigation Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Detailed error tracking
  const errors = [];
  const requests = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        resourceType: response.request().resourceType(),
        timestamp: new Date().toISOString()
      });
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
  
  try {
    console.log('🔐 Step 1: Logging in as Super Admin...');
    
    await page.goto('http://localhost:5174/login');
    await page.waitForSelector('input[type="email"]');
    
    await page.fill('input[type="email"]', 'superadmin@immigrationapp.com');
    await page.fill('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/super-admin**');
    console.log('✅ Logged in successfully');
    
    console.log('\n🧭 Step 2: Testing Navigation Links...');
    
    // Test each navigation link
    const navLinks = [
      { name: 'Dashboard', url: '/super-admin' },
      { name: 'Tenants', url: '/super-admin/tenants' },
      { name: 'Users', url: '/super-admin/users' },
      { name: 'Reports', url: '/super-admin/reports' },
      { name: 'Analytics', url: '/super-admin/analytics' }
    ];
    
    for (const link of navLinks) {
      console.log(`\n🔗 Testing ${link.name} link...`);
      
      // Clear previous errors
      const errorsBefore = errors.length;
      
      try {
        // Click the navigation link
        await page.click(`a[href="${link.url}"]`);
        await page.waitForLoadState('networkidle');
        
        const currentUrl = page.url();
        console.log(`   Current URL: ${currentUrl}`);
        
        // Check if we're on the expected page
        if (currentUrl.includes(link.url)) {
          console.log(`   ✅ Successfully navigated to ${link.name}`);
          
          // Check for page content
          const pageTitle = await page.locator('h1, h2, [class*="title"]').first().textContent().catch(() => null);
          if (pageTitle) {
            console.log(`   📄 Page Title: ${pageTitle}`);
          }
          
          // Check for any error messages on the page
          const errorMessages = await page.locator('.error, .alert-danger, [class*="error"]').allTextContents();
          if (errorMessages.length > 0) {
            console.log(`   ⚠️ Error messages found:`);
            errorMessages.forEach((msg, index) => {
              console.log(`      ${index + 1}. ${msg}`);
            });
          }
          
        } else {
          console.log(`   ❌ Navigation failed - expected ${link.url}, got ${currentUrl}`);
        }
        
        // Check for new errors
        const newErrors = errors.slice(errorsBefore);
        if (newErrors.length > 0) {
          console.log(`   ❌ ${newErrors.length} new errors during navigation:`);
          newErrors.forEach((error, index) => {
            console.log(`      ${index + 1}. [${error.type || 'network'}] ${error.status || 'N/A'} - ${error.url || error.message}`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error testing ${link.name}: ${error.message}`);
      }
      
      // Wait between navigation tests
      await page.waitForTimeout(2000);
    }
    
    console.log('\n🔍 Step 3: Detailed Error Analysis...');
    
    if (errors.length > 0) {
      console.log(`\n❌ Total Errors Found: ${errors.length}`);
      
      // Group errors by type
      const errorGroups = {};
      errors.forEach(error => {
        const key = error.type || 'network_error';
        if (!errorGroups[key]) errorGroups[key] = [];
        errorGroups[key].push(error);
      });
      
      // Analyze each error group
      Object.entries(errorGroups).forEach(([type, errorList]) => {
        console.log(`\n📊 ${type.toUpperCase()} Errors (${errorList.length}):`);
        
        errorList.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.url || error.message}`);
          if (error.status) console.log(`      Status: ${error.status} ${error.statusText}`);
          if (error.resourceType) console.log(`      Resource Type: ${error.resourceType}`);
          console.log(`      Timestamp: ${error.timestamp}`);
        });
      });
      
      // Focus on 404 errors
      const notFoundErrors = errors.filter(e => e.status === 404);
      if (notFoundErrors.length > 0) {
        console.log('\n🔍 404 ERROR INVESTIGATION:');
        console.log('These resources are missing and causing 404 errors:');
        
        notFoundErrors.forEach((error, index) => {
          console.log(`\n   ${index + 1}. Missing Resource:`);
          console.log(`      URL: ${error.url}`);
          console.log(`      Type: ${error.resourceType}`);
          console.log(`      Time: ${error.timestamp}`);
          
          // Analyze the URL to determine what's missing
          if (error.url.includes('favicon')) {
            console.log(`      💡 This is a missing favicon - common and harmless`);
          } else if (error.url.includes('.ico')) {
            console.log(`      💡 This is a missing icon file - common and harmless`);
          } else if (error.url.includes('manifest')) {
            console.log(`      💡 This is a missing web app manifest - common and harmless`);
          } else if (error.url.includes('/api/')) {
            console.log(`      ⚠️ This is a missing API endpoint - needs investigation`);
          } else if (error.url.includes('.css') || error.url.includes('.js')) {
            console.log(`      ⚠️ This is a missing CSS/JS file - may affect functionality`);
          } else {
            console.log(`      ❓ Unknown resource type - needs investigation`);
          }
        });
      }
      
    } else {
      console.log('✅ No errors found during navigation test!');
    }
    
    console.log('\n📊 Step 4: Request Summary...');
    console.log(`Total requests made: ${requests.length}`);
    
    const requestTypes = {};
    requests.forEach(req => {
      requestTypes[req.resourceType] = (requestTypes[req.resourceType] || 0) + 1;
    });
    
    console.log('Request types:');
    Object.entries(requestTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    // Wait for final observation
    console.log('\n⏳ Waiting 10 seconds for final observation...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'super-admin-navigation-error.png' });
    console.log('📸 Screenshot saved as super-admin-navigation-error.png');
  } finally {
    await browser.close();
  }
}

// Run the navigation test
testSuperAdminNavigation().catch(console.error);

