const puppeteer = require('puppeteer');

async function compareApiEndpoints() {
  console.log('🔍 COMPARING API ENDPOINTS');
  console.log('='.repeat(50));
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  const endpoints = [
    {
      name: 'Super Admin Login',
      url: 'https://ibuyscrap.ca/api/v1/auth/login',
      method: 'POST',
      body: {
        email: 'superadmin@immigrationapp.com',
        password: 'SuperAdmin123!',
        tenantDomain: ''
      }
    },
    {
      name: 'Tenant Admin Login',
      url: 'https://ibuyscrap.ca/api/v1/tenant/auth/login',
      method: 'POST',
      body: {
        email: 'admin@honeynwild.com',
        password: 'Admin@123!',
        tenantDomain: 'honeynwild.com'
      }
    }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📋 Testing: ${endpoint.name}`);
    console.log(`📋 URL: ${endpoint.url}`);
    
    try {
      const response = await page.evaluate(async (endpointData) => {
        try {
          const apiResponse = await fetch(endpointData.url, {
            method: endpointData.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(endpointData.body)
          });
          
          const responseData = await apiResponse.text();
          
          return {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            body: responseData,
            success: apiResponse.ok
          };
        } catch (error) {
          return {
            error: error.message,
            success: false
          };
        }
      }, endpoint);
      
      if (response.error) {
        console.log(`❌ ${endpoint.name}: ${response.error}`);
      } else if (response.success) {
        console.log(`✅ ${endpoint.name}: ${response.status} ${response.statusText}`);
        console.log(`📡 Response: ${response.body.substring(0, 200)}...`);
      } else {
        console.log(`❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
        console.log(`📡 Response: ${response.body}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Test failed - ${error.message}`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 API endpoint comparison completed. Keeping browser open for 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  await browser.close();
}

compareApiEndpoints().catch(console.error);
