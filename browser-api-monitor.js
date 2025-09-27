// Browser-based API monitoring script
// Copy and paste this into your browser's console (F12 -> Console)

(function() {
  console.log('🔍 Starting API Call Monitor...');
  
  const apiCalls = [];
  const startTime = Date.now();
  
  // Store original fetch function
  const originalFetch = window.fetch;
  
  // Override fetch to monitor API calls
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    const method = options.method || 'GET';
    const timestamp = Date.now() - startTime;
    
    // Only monitor API calls
    if (typeof url === 'string' && (url.includes('/api/') || url.includes('localhost:5000'))) {
      const callInfo = {
        timestamp,
        method,
        url,
        time: new Date().toISOString(),
        stack: new Error().stack
      };
      
      apiCalls.push(callInfo);
      console.log(`📤 [${timestamp}ms] ${method} ${url}`);
      
      // Return the original fetch with logging
      return originalFetch.apply(this, args)
        .then(response => {
          const responseTime = Date.now() - startTime;
          console.log(`📥 [${responseTime}ms] ${response.status} ${url}`);
          return response;
        })
        .catch(error => {
          const errorTime = Date.now() - startTime;
          console.log(`❌ [${errorTime}ms] ERROR ${url}: ${error.message}`);
          throw error;
        });
    }
    
    // For non-API calls, use original fetch
    return originalFetch.apply(this, args);
  };
  
  // Store original XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  
  // Override XMLHttpRequest to monitor API calls
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    
    xhr.open = function(method, url, ...args) {
      this._method = method;
      this._url = url;
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    xhr.send = function(data) {
      const timestamp = Date.now() - startTime;
      
      if (this._url && (this._url.includes('/api/') || this._url.includes('localhost:5000'))) {
        const callInfo = {
          timestamp,
          method: this._method,
          url: this._url,
          time: new Date().toISOString(),
          type: 'XMLHttpRequest'
        };
        
        apiCalls.push(callInfo);
        console.log(`📤 [${timestamp}ms] ${this._method} ${this._url}`);
        
        // Monitor response
        this.addEventListener('loadend', () => {
          const responseTime = Date.now() - startTime;
          console.log(`📥 [${responseTime}ms] ${this.status} ${this._url}`);
        });
      }
      
      return originalSend.apply(this, [data]);
    };
    
    return xhr;
  };
  
  // Function to analyze API calls
  window.analyzeAPICalls = function() {
    console.log('\n📊 API CALLS ANALYSIS:');
    console.log('='.repeat(50));
    
    const uniqueAPICalls = [...new Set(apiCalls.map(call => call.url))];
    
    console.log(`\n🔢 Total API Calls Made: ${uniqueAPICalls.length}`);
    console.log('\n📋 API Calls List:');
    uniqueAPICalls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
    
    // Group by endpoint
    const endpointGroups = {};
    uniqueAPICalls.forEach(url => {
      const endpoint = url.split('/api/')[1]?.split('?')[0] || 'unknown';
      if (!endpointGroups[endpoint]) {
        endpointGroups[endpoint] = [];
      }
      endpointGroups[endpoint].push(url);
    });
    
    console.log('\n📊 API Calls by Endpoint:');
    Object.entries(endpointGroups).forEach(([endpoint, calls]) => {
      console.log(`  ${endpoint}: ${calls.length} call(s)`);
    });
    
    // Check for duplicate calls
    const duplicates = {};
    apiCalls.forEach(call => {
      if (!duplicates[call.url]) {
        duplicates[call.url] = 0;
      }
      duplicates[call.url]++;
    });
    
    const duplicateCalls = Object.entries(duplicates).filter(([url, count]) => count > 1);
    if (duplicateCalls.length > 0) {
      console.log('\n🔄 Duplicate API Calls:');
      duplicateCalls.forEach(([url, count]) => {
        console.log(`  ${url}: ${count} times`);
      });
    }
    
    // Show timing analysis
    console.log('\n⏱️ Timing Analysis:');
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. [${call.timestamp}ms] ${call.method} ${call.url}`);
    });
    
    return {
      totalCalls: uniqueAPICalls.length,
      duplicateCalls: duplicateCalls.length,
      apiCalls: apiCalls,
      endpointGroups: endpointGroups,
      duplicates: duplicates
    };
  };
  
  // Function to reset monitoring
  window.resetAPIMonitor = function() {
    apiCalls.length = 0;
    console.log('🔄 API monitor reset');
  };
  
  // Function to export data
  window.exportAPIData = function() {
    const data = {
      timestamp: new Date().toISOString(),
      totalAPICalls: apiCalls.length,
      apiCalls: apiCalls,
      analysis: window.analyzeAPICalls()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-calls-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('💾 API data exported to api-calls-analysis.json');
  };
  
  console.log('✅ API Monitor installed!');
  console.log('📝 Commands available:');
  console.log('  - analyzeAPICalls() - Analyze current API calls');
  console.log('  - resetAPIMonitor() - Reset the monitor');
  console.log('  - exportAPIData() - Export data as JSON file');
  console.log('\n🌐 Now navigate to your app and login to see API calls...');
})();
