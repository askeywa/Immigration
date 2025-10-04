/**
 * Monitor Deployment Progress
 * Checks GitHub Actions and server status every 30 seconds
 */

const https = require('https');

let checkCount = 0;
const MAX_CHECKS = 20; // 10 minutes

console.log('🚀 Monitoring Deployment Progress\n');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📝 Changes deployed:');
console.log('   - Commit: 69befb0');
console.log('   - Fix: Clear build cache before rebuilding');
console.log('   - Expected: New AuthCallback with hasProcessed guard');
console.log('\n═══════════════════════════════════════════════════════════\n');

async function checkServerStatus() {
    return new Promise((resolve) => {
        https.get('https://ibuyscrap.ca/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const health = JSON.parse(data);
                    resolve({
                        status: 'online',
                        timestamp: health.timestamp,
                        database: health.database?.name
                    });
                } catch (e) {
                    resolve({ status: 'error', error: e.message });
                }
            });
        }).on('error', () => {
            resolve({ status: 'offline' });
        });
    });
}

async function monitorDeployment() {
    checkCount++;
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n⏰ Check ${checkCount}/${MAX_CHECKS} at ${timestamp}`);
    console.log('─────────────────────────────────────────────────────────');
    
    const serverStatus = await checkServerStatus();
    
    if (serverStatus.status === 'online') {
        console.log('   ✅ Server: Online');
        console.log('   📊 Database:', serverStatus.database);
        console.log('   🕐 Server Time:', serverStatus.timestamp);
    } else {
        console.log('   ❌ Server:', serverStatus.status);
    }
    
    console.log('\n   💡 Tips:');
    console.log('   - Check GitHub Actions: https://github.com/askeywa/Immigration/actions');
    console.log('   - Look for workflow: "Fix deploy.yml: Clear build cache..."');
    console.log('   - Deployment usually takes 2-5 minutes');
    
    if (checkCount >= MAX_CHECKS) {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('\n⏰ Monitoring timeout reached (10 minutes)');
        console.log('\n📝 Manual check recommended:');
        console.log('   1. Verify GitHub Actions workflow completed');
        console.log('   2. Run: node test-tenant-flow-no-cache.js');
        console.log('   3. Look for "Skip Guard Triggered: ✅ YES"');
        console.log('\n═══════════════════════════════════════════════════════════\n');
        process.exit(0);
    }
    
    // Check again in 30 seconds
    setTimeout(monitorDeployment, 30000);
}

console.log('🔍 Starting monitoring...');
console.log('   Checking server every 30 seconds');
console.log('   Press Ctrl+C to stop\n');

monitorDeployment();

