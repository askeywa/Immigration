const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connect to production database (the actual one used by the API)
const MONGODB_URI = 'mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/productionDB?retryWrites=true&w=majority&appName=RCICDB';

async function resetSuperAdminPassword() {
  try {
    console.log('🔗 Connecting to production database...');
    console.log('Database URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to production database');

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

    console.log('\n🔍 Finding super admin user...');
    
    // Find the super admin user
    const superAdmin = await User.findOne({ 
      email: 'superadmin@immigrationapp.com',
      role: 'super_admin'
    });

    if (!superAdmin) {
      console.log('❌ Super admin user not found');
      return;
    }

    console.log(`✅ Found super admin user: ${superAdmin.email}`);

    // Set new password
    const newPassword = 'Admin@123';
    console.log(`\n🔐 Setting new password: ${newPassword}`);
    
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user's password
    superAdmin.password = hashedPassword;
    superAdmin.updatedAt = new Date();
    
    await superAdmin.save();
    
    console.log('✅ Super admin password updated successfully!');
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log(`🔒 Hashed: ${hashedPassword}`);

  } catch (error) {
    console.error('❌ Error resetting super admin password:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔒 Disconnected from database');
  }
}

resetSuperAdminPassword().catch(console.error);
