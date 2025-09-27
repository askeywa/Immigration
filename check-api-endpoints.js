// Simple script to check API endpoints and their usage
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing API endpoint usage in your codebase...\n');

// Function to find all files with API calls
function findAPICalls(directory) {
  const apiCalls = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Find API calls
          const apiPatterns = [
            /fetch\(['"`]([^'"`]+)['"`]/g,
            /api\.get\(['"`]([^'"`]+)['"`]/g,
            /api\.post\(['"`]([^'"`]+)['"`]/g,
            /api\.put\(['"`]([^'"`]+)['"`]/g,
            /api\.delete\(['"`]([^'"`]+)['"`]/g,
            /axios\.get\(['"`]([^'"`]+)['"`]/g,
            /axios\.post\(['"`]([^'"`]+)['"`]/g,
            /axios\.put\(['"`]([^'"`]+)['"`]/g,
            /axios\.delete\(['"`]([^'"`]+)['"`]/g
          ];
          
          apiPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
              apiCalls.push({
                file: filePath,
                endpoint: match[1],
                line: content.substring(0, match.index).split('\n').length
              });
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
  }
  
  scanDirectory(directory);
  return apiCalls;
}

// Analyze frontend
console.log('📁 Scanning frontend directory...');
const frontendAPICalls = findAPICalls('./frontend/src');

// Group by endpoint
const endpointUsage = {};
frontendAPICalls.forEach(call => {
  const endpoint = call.endpoint;
  if (!endpointUsage[endpoint]) {
    endpointUsage[endpoint] = [];
  }
  endpointUsage[endpoint].push(call);
});

console.log('\n📊 API ENDPOINT USAGE ANALYSIS:');
console.log('='.repeat(50));

console.log(`\n🔢 Total API Calls Found: ${frontendAPICalls.length}`);
console.log(`🔢 Unique Endpoints: ${Object.keys(endpointUsage).length}`);

console.log('\n📋 API Endpoints and Usage:');
Object.entries(endpointUsage)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([endpoint, calls]) => {
    console.log(`\n📍 ${endpoint} (${calls.length} usage(s)):`);
    calls.forEach(call => {
      const relativePath = call.file.replace(process.cwd(), '');
      console.log(`  - ${relativePath}:${call.line}`);
    });
  });

// Find potential duplicates
console.log('\n🔄 POTENTIAL DUPLICATE API CALLS:');
const duplicateEndpoints = Object.entries(endpointUsage)
  .filter(([endpoint, calls]) => calls.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

if (duplicateEndpoints.length > 0) {
  duplicateEndpoints.forEach(([endpoint, calls]) => {
    console.log(`\n⚠️  ${endpoint} - Used ${calls.length} times:`);
    calls.forEach(call => {
      const relativePath = call.file.replace(process.cwd(), '');
      console.log(`  - ${relativePath}:${call.line}`);
    });
  });
} else {
  console.log('✅ No duplicate API calls found');
}

// Dashboard-specific analysis
console.log('\n🏠 DASHBOARD-SPECIFIC API CALLS:');
const dashboardFiles = frontendAPICalls.filter(call => 
  call.file.includes('UserDashboard') || 
  call.file.includes('TenantContext') ||
  call.file.includes('domainResolution')
);

if (dashboardFiles.length > 0) {
  dashboardFiles.forEach(call => {
    const relativePath = call.file.replace(process.cwd(), '');
    console.log(`  - ${relativePath}:${call.line} -> ${call.endpoint}`);
  });
} else {
  console.log('  No dashboard-specific API calls found');
}

console.log('\n💡 RECOMMENDATIONS:');
console.log('1. Use the browser console monitoring script to see real API calls');
console.log('2. Look for endpoints used multiple times in different files');
console.log('3. Consider batching related API calls');
console.log('4. Implement proper caching for frequently called endpoints');

console.log('\n✅ Analysis complete!');
