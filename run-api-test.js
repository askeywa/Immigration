// Simple test runner for API call testing
const { exec } = require('child_process');
const path = require('path');

console.log('🧪 API Call Testing Suite');
console.log('='.repeat(40));

// Check if frontend is running
function checkFrontend() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get('http://localhost:5174', (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Check if backend is running
function checkBackend() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get('http://localhost:5000', (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🔍 Checking if services are running...');
  
  const frontendRunning = await checkFrontend();
  const backendRunning = await checkBackend();
  
  console.log(`Frontend (localhost:5174): ${frontendRunning ? '✅ Running' : '❌ Not running'}`);
  console.log(`Backend (localhost:5000): ${backendRunning ? '✅ Running' : '❌ Not running'}`);
  
  if (!frontendRunning || !backendRunning) {
    console.log('\n⚠️  Please start your services before running the test:');
    console.log('   Frontend: cd frontend && npm run dev');
    console.log('   Backend: cd backend && npm run dev');
    return;
  }
  
  console.log('\n🚀 Starting API call test...');
  console.log('📝 Note: Update test credentials in test-api-calls.js before running');
  
  // Run the test
  exec('node test-api-calls.js', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Test execution failed:', error.message);
      return;
    }
    
    if (stderr) {
      console.error('⚠️ Test warnings:', stderr);
    }
    
    console.log(stdout);
  });
}

runTests();
