console.log('🔍 How to Extract Key Error Information from GitHub Logs');
console.log('======================================================\n');

console.log('📋 Step-by-Step Guide:');
console.log('======================\n');

console.log('1. 🌐 Go to GitHub Actions:');
console.log('   https://github.com/askeywa/Immigration/actions/runs/18204722727\n');

console.log('2. 🖱️ Click on the "deploy" job (red/failed one)\n');

console.log('3. 🔍 Click on "Deploy to EC2" step (the failed step)\n');

console.log('4. 📜 Look for these key error patterns:');
console.log('   • Lines starting with "Error:"');
console.log('   • Lines starting with "Failed:"');
console.log('   • Lines containing "Permission denied"');
console.log('   • Lines containing "No such file"');
console.log('   • Lines containing "Command not found"');
console.log('   • Lines containing "PM2" or "pm2"');
console.log('   • Lines containing "port" or "already in use"');
console.log('   • Lines containing "npm" or "node" errors');
console.log('   • Lines containing "curl" or "health" errors\n');

console.log('5. 📋 Copy these specific sections:');
console.log('   • The last 10-15 lines of the log');
console.log('   • Any error messages (usually in red)');
console.log('   • Any "FAILED" or "ERROR" lines');
console.log('   • PM2 status output (if any)');
console.log('   • Health check results\n');

console.log('6. 💡 Common Error Locations:');
console.log('   • After "Building backend..."');
console.log('   • After "Building frontend..."');
console.log('   • After "Installing dependencies..."');
console.log('   • After "PM2 status..."');
console.log('   • After "Health check..."');
console.log('   • After "curl" commands\n');

console.log('📝 What to Copy:');
console.log('================');
console.log('Just copy the ERROR MESSAGE part, like:');
console.log('• "Error: Process completed with exit code 255"');
console.log('• "Permission denied (publickey)"');
console.log('• "pm2: command not found"');
console.log('• "Port 5000 is already in use"');
console.log('• "Failed to start application"');
console.log('• Any red error text\n');

console.log('🚀 Quick Actions:');
console.log('================');
console.log('• Press Ctrl+F and search for: "Error", "Failed", "Permission"');
console.log('• Scroll to the very bottom of the log');
console.log('• Look for the last red/highlighted text');
console.log('• Copy just that error message\n');

console.log('💡 Pro Tip:');
console.log('===========');
console.log('The error is usually in the last 20 lines of the log!');
console.log('Focus on the bottom part where it says "FAILED" or "ERROR".');
