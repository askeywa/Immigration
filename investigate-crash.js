const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Immigration Portal - Crash Investigation');
console.log('===========================================\n');

const SSH_KEY = 'C:\\Main_Data\\AI\\_Keys\\node-key.pem';
const EC2_HOST = 'ubuntu@ec2-18-220-224-109.us-east-2.compute.amazonaws.com';

// Create log directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logDir = `crash-investigation-${timestamp}`;
fs.mkdirSync(logDir, { recursive: true });

console.log('📋 Fetching logs from EC2 instance...\n');

// Function to run SSH command
function getSSHLog(command, filename, description) {
    try {
        console.log(`⏳ ${description}...`);
        const fullCommand = `ssh -i "${SSH_KEY}" ${EC2_HOST} "${command}"`;
        const output = execSync(fullCommand, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
        fs.writeFileSync(path.join(logDir, filename), output);
        console.log(`✅ Saved to ${filename}\n`);
    } catch (error) {
        console.error(`❌ Error fetching ${filename}: ${error.message}\n`);
        fs.writeFileSync(path.join(logDir, filename), `Error: ${error.message}\n${error.stderr || ''}`);
    }
}

// Fetch all logs
getSSHLog('pm2 logs immigration-portal --lines 500 --nostream', 'pm2-logs.txt', '1️⃣  Fetching PM2 logs (last 500 lines)');
getSSHLog('pm2 logs immigration-portal --err --lines 500 --nostream', 'pm2-error-logs.txt', '2️⃣  Fetching PM2 error logs');
getSSHLog('pm2 status', 'pm2-status.txt', '3️⃣  Fetching PM2 process status');
getSSHLog('pm2 info immigration-portal', 'pm2-info.txt', '4️⃣  Fetching PM2 process info');
getSSHLog('free -h && echo "---" && df -h', 'system-memory.txt', '5️⃣  Fetching system memory usage');
getSSHLog('ss -tuln | grep 27017 || echo "No MongoDB local connection"', 'mongodb-status.txt', '6️⃣  Fetching MongoDB connection status');
getSSHLog('sudo tail -n 200 /var/log/nginx/error.log', 'nginx-error-logs.txt', '7️⃣  Fetching Nginx error logs');
getSSHLog('sudo journalctl -u node --since "24 hours ago" --no-pager', 'system-logs.txt', '8️⃣  Fetching system logs');
getSSHLog('sudo dmesg | grep -i "out of memory\\|killed process" | tail -n 50', 'oom-kills.txt', '9️⃣  Checking for Out Of Memory (OOM) kills');
getSSHLog('cat ~/.pm2/dump.pm2', 'pm2-dump.txt', '🔟  Fetching PM2 dump file');
getSSHLog('pm2 describe immigration-portal', 'pm2-describe.txt', '1️⃣1️⃣  Fetching PM2 process details');
getSSHLog('uptime', 'system-uptime.txt', '1️⃣2️⃣  Fetching system uptime');

console.log('\n✅ All logs fetched successfully!');
console.log(`📁 Logs saved to: ${logDir}/\n`);

// Analyze the logs
console.log('🔍 Analyzing logs...\n');

try {
    // Check PM2 info for restart count
    const pm2Info = fs.readFileSync(path.join(logDir, 'pm2-info.txt'), 'utf8');
    const restartMatch = pm2Info.match(/restart time\s*│\s*(\d+)/i);
    if (restartMatch) {
        const restarts = parseInt(restartMatch[1]);
        console.log(`📊 Restart Count: ${restarts}`);
        if (restarts > 10) {
            console.log('⚠️  HIGH RESTART COUNT! Application is crashing repeatedly.\n');
        }
    }

    // Check for OOM kills
    const oomKills = fs.readFileSync(path.join(logDir, 'oom-kills.txt'), 'utf8');
    if (oomKills.includes('Out of memory') || oomKills.includes('Killed process')) {
        console.log('🚨 OUT OF MEMORY KILL DETECTED!');
        console.log('   The system killed the Node.js process due to memory exhaustion.\n');
    } else {
        console.log('✅ No OOM kills detected\n');
    }

    // Check PM2 error logs for common issues
    const errorLogs = fs.readFileSync(path.join(logDir, 'pm2-error-logs.txt'), 'utf8');
    
    if (errorLogs.includes('ECONNREFUSED') || errorLogs.includes('connect ECONNREFUSED')) {
        console.log('🚨 DATABASE CONNECTION REFUSED!');
        console.log('   MongoDB connection failed. Check database availability.\n');
    }
    
    if (errorLogs.includes('MongoNetworkError') || errorLogs.includes('MongoServerError')) {
        console.log('🚨 MONGODB ERROR DETECTED!');
        console.log('   Database connection or query error.\n');
    }
    
    if (errorLogs.includes('EADDRINUSE')) {
        console.log('🚨 PORT ALREADY IN USE!');
        console.log('   Another process is using the application port.\n');
    }

    if (errorLogs.includes('UnhandledPromiseRejection')) {
        console.log('🚨 UNHANDLED PROMISE REJECTION!');
        console.log('   Application crashed due to uncaught promise error.\n');
    }

    // Check memory usage
    const memoryInfo = fs.readFileSync(path.join(logDir, 'system-memory.txt'), 'utf8');
    console.log('💾 Memory Status:');
    console.log(memoryInfo.split('\n').slice(0, 5).join('\n'));
    console.log('');

} catch (analyzeError) {
    console.error('⚠️  Error during analysis:', analyzeError.message);
}

console.log('\n📋 Next Steps:');
console.log('   1. Check pm2-error-logs.txt for application errors');
console.log('   2. Check oom-kills.txt for memory issues');
console.log('   3. Check pm2-info.txt for restart count');
console.log('   4. Share these files for detailed analysis\n');

console.log('📁 Log directory:', path.resolve(logDir));

