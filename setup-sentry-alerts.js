const puppeteer = require('puppeteer');

console.log('🚨 SETTING UP SENTRY PERFORMANCE MONITORING');
console.log('============================================\n');

async function setupSentryAlerts() {
  let browser;
  
  try {
    console.log('🚀 Opening Sentry dashboard...');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to Sentry
    console.log('🌐 Navigating to Sentry dashboard...');
    await page.goto('https://sentry.io/', { waitUntil: 'networkidle2' });
    
    console.log('📋 MANUAL STEPS TO COMPLETE:');
    console.log('============================');
    console.log('1. Login to your Sentry account');
    console.log('2. Navigate to your project (ID: 4510120957050880)');
    console.log('3. Go to Settings > Alerts > Create Alert Rule');
    console.log('4. Set up the following alert rules:');
    console.log('');
    console.log('🚨 ALERT RULE 1: High Error Rate');
    console.log('   - Condition: Error rate > 5%');
    console.log('   - Time window: 5 minutes');
    console.log('   - Action: Email/Slack notification');
    console.log('');
    console.log('🚨 ALERT RULE 2: Slow Response Times');
    console.log('   - Condition: P95 response time > 2 seconds');
    console.log('   - Time window: 5 minutes');
    console.log('   - Action: Email/Slack notification');
    console.log('');
    console.log('🚨 ALERT RULE 3: High Memory Usage');
    console.log('   - Condition: Memory usage > 1GB');
    console.log('   - Time window: 2 minutes');
    console.log('   - Action: Email/Slack notification');
    console.log('');
    console.log('🚨 ALERT RULE 4: Database Connection Issues');
    console.log('   - Condition: Database errors > 10/minute');
    console.log('   - Time window: 2 minutes');
    console.log('   - Action: Email/Slack notification');
    console.log('');
    console.log('🚨 ALERT RULE 5: Cron Job Failures');
    console.log('   - Condition: "missed execution" errors');
    console.log('   - Time window: 1 minute');
    console.log('   - Action: Email/Slack notification');
    
    console.log('\n⏳ Browser will remain open for you to complete setup...');
    console.log('Press Ctrl+C when done to close browser.');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the setup
setupSentryAlerts().then(() => {
  console.log('\n🎯 Sentry alerts setup completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Setup process failed:', error);
  process.exit(1);
});
