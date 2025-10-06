const mongoose = require('mongoose');
require('dotenv').config();

// Connect to PRODUCTION database (not localDB)
const PRODUCTION_MONGODB_URI = 'mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/productionDB?retryWrites=true&w=majority&appName=RCICDB';

async function getProductionSuperAdmin() {
  try {
    console.log('🔗 Connecting to PRODUCTION database...');
    
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('✅ Connected to PRODUCTION database');

    // Get the User model
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      role: String,
      firstName: String,
      lastName: String,
      isActive: Boolean,
      createdAt: Date
    }));

    console.log('\n🔍 Searching for super admin in PRODUCTION database...');
    
    // Find the super admin user in PRODUCTION database
    const superAdmin = await User.findOne({ 
      email: 'superadmin@immigrationapp.com',
      role: 'super_admin',
      isActive: true 
    }).select('email password role firstName lastName isActive createdAt');

    if (!superAdmin) {
      console.log('❌ Super admin user not found in PRODUCTION database');
      
      // Check what users exist in productionDB
      const allUsers = await User.find({}).select('email role firstName lastName');
      console.log('\n📋 All users in PRODUCTION database:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.firstName} ${user.lastName}`);
      });
      
      return;
    }

    console.log('\n✅ SUPER ADMIN FOUND IN PRODUCTION DATABASE:');
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`👤 Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log(`🔑 Role: ${superAdmin.role}`);
    console.log(`✅ Active: ${superAdmin.isActive}`);
    console.log(`📅 Created: ${superAdmin.createdAt}`);
    console.log(`🔒 Password Hash: ${superAdmin.password}`);

    // Check if password looks like bcrypt hash
    if (superAdmin.password && superAdmin.password.startsWith('$2')) {
      console.log('✅ Password is properly hashed with bcrypt');
    } else {
      console.log('⚠️  Password might not be properly hashed');
    }

    console.log('\n🎯 TO TEST LOGIN:');
    console.log(`Email: ${superAdmin.email}`);
    console.log('Password: [Check your records - this is the hashed version]');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔒 Disconnected from PRODUCTION database');
  }
}

getProductionSuperAdmin().catch(console.error);
