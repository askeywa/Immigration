// Script to diagnose and fix production database connection
const axios = require('axios');

async function diagnoseProductionDatabase() {
    console.log('🔍 Diagnosing Production Database Connection...');
    console.log('==============================================');
    
    try {
        // Test 1: Check current health
        console.log('\n1️⃣ Current Production Health:');
        const healthResponse = await axios.get('https://ibuyscrap.ca/api/health', {
            timeout: 15000
        });
        
        console.log('✅ Health Response:');
        console.log('Database Connected:', healthResponse.data.database.connected);
        console.log('Database Name:', healthResponse.data.database.name);
        console.log('Database State:', healthResponse.data.database.readyState);
        console.log('Environment:', healthResponse.data.environment);
        
        if (!healthResponse.data.database.connected) {
            console.log('\n❌ ISSUE IDENTIFIED:');
            console.log('Database is not connected in production!');
            console.log('Database name is still "test" instead of "productionDB"');
            
            console.log('\n🔧 SOLUTION REQUIRED:');
            console.log('1. Update GitHub Secret MONGODB_URI to include "productionDB"');
            console.log('2. Redeploy the application');
            console.log('3. Create super admin user in productionDB');
            
            console.log('\n📋 Current MONGODB_URI (from logs):');
            console.log('mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/test?retryWrites=true&w=majority&appName=RCICDB');
            
            console.log('\n✅ Correct MONGODB_URI should be:');
            console.log('mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/productionDB?retryWrites=true&w=majority&appName=RCICDB');
            
            console.log('\n🚀 Next Steps:');
            console.log('1. Go to GitHub Repository Settings > Secrets and Variables > Actions');
            console.log('2. Update MONGODB_URI secret with the correct database name');
            console.log('3. Trigger a new deployment');
            console.log('4. Create super admin user in productionDB');
        }
        
    } catch (error) {
        console.log('❌ Failed to check production health:', error.message);
    }
}

diagnoseProductionDatabase().catch(console.error);
