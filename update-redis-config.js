const fs = require('fs');
const path = require('path');

console.log('🔧 Updating Redis configuration...\n');

const envPath = path.join(__dirname, 'backend', '.env');

try {
    // Read the current .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Comment out the Redis password line
    envContent = envContent.replace(
        /^REDIS_PASSWORD=.*$/m,
        '# REDIS_PASSWORD=z3uXABbNVsRWe9DTDJuVRHLeXxj4KwU54SLjJkwG0QA='
    );
    
    // Write the updated content back
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Redis configuration updated successfully!');
    console.log('📋 Changes made:');
    console.log('  • Commented out REDIS_PASSWORD');
    console.log('  • Redis will now connect without password');
    console.log('\n🚀 You can now start your backend server with Redis enabled!');
    
} catch (error) {
    console.log('❌ Failed to update Redis configuration:', error.message);
    console.log('\n🔧 Manual steps:');
    console.log('  1. Open backend/.env file');
    console.log('  2. Comment out the REDIS_PASSWORD line:');
    console.log('     # REDIS_PASSWORD=z3uXABbNVsRWe9DTDJuVRHLeXxj4KwU54SLjJkwG0QA=');
    console.log('  3. Save the file');
}
