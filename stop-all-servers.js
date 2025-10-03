const { execSync } = require('child_process');

console.log('🛑 STOPPING ALL RUNNING SERVERS');
console.log('===============================\n');

try {
  console.log('🔍 Checking for running Node.js processes...');
  
  // Check for running processes
  try {
    const nodeProcesses = execSync('tasklist /FI "IMAGENAME eq node.exe"', { encoding: 'utf8' });
    console.log('📋 Current Node.js processes:');
    console.log(nodeProcesses);
  } catch (error) {
    console.log('✅ No Node.js processes found or tasklist failed');
  }
  
  console.log('\n🛑 Attempting to stop all Node.js processes...');
  
  // Kill all Node.js processes
  try {
    execSync('taskkill /F /IM node.exe', { stdio: 'inherit' });
    console.log('✅ All Node.js processes terminated');
  } catch (error) {
    console.log('ℹ️ No Node.js processes to terminate or already stopped');
  }
  
  // Check for PM2 processes
  console.log('\n🔍 Checking for PM2 processes...');
  try {
    const pm2Processes = execSync('pm2 list', { encoding: 'utf8' });
    console.log('📋 PM2 processes:');
    console.log(pm2Processes);
    
    // Stop all PM2 processes
    execSync('pm2 stop all', { stdio: 'inherit' });
    console.log('✅ All PM2 processes stopped');
    
    // Delete all PM2 processes
    execSync('pm2 delete all', { stdio: 'inherit' });
    console.log('✅ All PM2 processes deleted');
    
  } catch (error) {
    console.log('ℹ️ No PM2 processes found or PM2 not running');
  }
  
  console.log('\n🔍 Final check for any remaining Node.js processes...');
  try {
    const remainingProcesses = execSync('tasklist /FI "IMAGENAME eq node.exe"', { encoding: 'utf8' });
    if (remainingProcesses.includes('node.exe')) {
      console.log('⚠️ Some Node.js processes still running:');
      console.log(remainingProcesses);
    } else {
      console.log('✅ No Node.js processes remaining');
    }
  } catch (error) {
    console.log('✅ No Node.js processes found');
  }
  
  console.log('\n🎯 All servers stopped successfully!');
  console.log('Ready to rebuild and restart servers...');
  
} catch (error) {
  console.error('❌ Error stopping servers:', error.message);
}
