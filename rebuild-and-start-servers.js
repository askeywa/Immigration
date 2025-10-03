const { execSync } = require('child_process');

console.log('🔨 REBUILDING AND STARTING SERVERS');
console.log('===================================\n');

try {
  // Step 1: Confirm all servers are stopped
  console.log('🔍 Confirming all servers are stopped...');
  try {
    const remainingProcesses = execSync('tasklist /FI "IMAGENAME eq node.exe"', { encoding: 'utf8' });
    if (remainingProcesses.includes('node.exe')) {
      console.log('❌ Some Node.js processes still running:');
      console.log(remainingProcesses);
      console.log('Please stop all servers manually before proceeding.');
      process.exit(1);
    } else {
      console.log('✅ Confirmed: No Node.js processes running');
    }
  } catch (error) {
    console.log('✅ Confirmed: No Node.js processes found');
  }
  
  // Step 2: Clean and rebuild backend
  console.log('\n📦 Building backend...');
  try {
    execSync('cd backend && npm run clean', { stdio: 'inherit' });
    execSync('cd backend && npm run build', { stdio: 'inherit' });
    console.log('✅ Backend built successfully');
  } catch (error) {
    console.log('❌ Backend build failed:', error.message);
    process.exit(1);
  }
  
  // Step 3: Clean and rebuild frontend
  console.log('\n📦 Building frontend...');
  try {
    execSync('cd frontend && npm run build', { stdio: 'inherit' });
    console.log('✅ Frontend built successfully');
  } catch (error) {
    console.log('❌ Frontend build failed:', error.message);
    process.exit(1);
  }
  
  // Step 4: Start backend server
  console.log('\n🚀 Starting backend server...');
  try {
    // Start backend in a new window
    execSync('start cmd /k "cd backend && npm run dev"', { stdio: 'inherit' });
    console.log('✅ Backend server starting in new window');
  } catch (error) {
    console.log('❌ Failed to start backend server:', error.message);
  }
  
  // Wait a moment for backend to start
  console.log('\n⏳ Waiting 5 seconds for backend to start...');
  setTimeout(() => {
    // Step 5: Start frontend server
    console.log('\n🚀 Starting frontend server...');
    try {
      // Start frontend in a new window
      execSync('start cmd /k "cd frontend && npm run dev"', { stdio: 'inherit' });
      console.log('✅ Frontend server starting in new window');
    } catch (error) {
      console.log('❌ Failed to start frontend server:', error.message);
    }
    
    console.log('\n🎯 SERVERS STARTED SUCCESSFULLY!');
    console.log('================================');
    console.log('✅ Backend: http://localhost:5000');
    console.log('✅ Frontend: http://localhost:3000');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Wait for both servers to fully start');
    console.log('2. Test super admin login at http://localhost:3000/login');
    console.log('3. Monitor backend terminal for any errors');
    console.log('4. Check if cron job blocking issues are resolved');
    console.log('\n🔍 MONITORING:');
    console.log('- Watch backend terminal for "missed execution" warnings');
    console.log('- Check memory usage stays stable');
    console.log('- Verify MongoDB connections are stable');
    
  }, 5000);
  
} catch (error) {
  console.error('💥 Rebuild and start failed:', error.message);
  process.exit(1);
}
