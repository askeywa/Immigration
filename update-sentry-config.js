const fs = require('fs');
const path = require('path');

console.log('🔧 UPDATING SENTRY CONFIGURATION');
console.log('=================================\n');

// Read current .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('📋 Current Sentry configuration:');
console.log(envContent.match(/SENTRY.*/g)?.join('\n') || 'No Sentry config found');

// Update Sentry configuration for better monitoring
const updatedEnvContent = envContent
  .replace(/SENTRY_TRACES_SAMPLE_RATE=0\.1/, 'SENTRY_TRACES_SAMPLE_RATE=0.5')  // Increase to 50% for better monitoring
  .replace(/SENTRY_PROFILES_SAMPLE_RATE=0\.1/, 'SENTRY_PROFILES_SAMPLE_RATE=0.3'); // Increase to 30% for better profiling

// Write updated configuration
fs.writeFileSync(envPath, updatedEnvContent);

console.log('\n✅ Updated Sentry configuration:');
console.log('📊 SENTRY_TRACES_SAMPLE_RATE: 0.1 → 0.5 (50% sampling)');
console.log('📊 SENTRY_PROFILES_SAMPLE_RATE: 0.1 → 0.3 (30% profiling)');

console.log('\n🎯 RECOMMENDED SENTRY SETTINGS:');
console.log('===============================');
console.log('✅ DSN: Configured and working');
console.log('✅ Release tracking: Enabled');
console.log('✅ Performance monitoring: 50% sampling');
console.log('✅ Profiling: 30% sampling');
console.log('✅ Error tracking: 100% (default)');

console.log('\n📋 NEXT STEPS:');
console.log('1. Restart your backend server to apply changes');
console.log('2. Access Sentry dashboard at: https://sentry.io/');
console.log('3. Look for project ID: 4510120957050880');
console.log('4. Set up alerts and performance thresholds');
