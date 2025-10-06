const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connect to PRODUCTION database
const PRODUCTION_MONGODB_URI = 'mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/productionDB?retryWrites=true&w=majority&appName=RCICDB';

async function resetProductionSuperAdmin() {
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
      createdAt: Date,
      updatedAt: Date
    }));

    console.log('\n🔍 Finding super admin in PRODUCTION database...');
    
    // Find the super admin user
    const superAdmin = await User.findOne({ 
      email: 'superadmin@immigrationapp.com',
      role: 'super_admin'
    });

    if (!superAdmin) {
      console.log('❌ Super admin user not found in PRODUCTION database');
      return;
    }

    console.log(`✅ Found super admin: ${superAdmin.email}`);

    // Set new password
    const newPassword = 'Admin@123';
    console.log(`\n🔐 Setting password to: ${newPassword}`);
    
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user's password
    superAdmin.password = hashedPassword;
    superAdmin.updatedAt = new Date();
    
    await superAdmin.save();
    
    console.log('✅ Super admin password updated in PRODUCTION database!');
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log(`🔒 New Hash: ${hashedPassword}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔒 Disconnected from PRODUCTION database');
  }
}

resetProductionSuperAdmin().catch(console.error);
