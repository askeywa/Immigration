const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connect to LOCAL database
const LOCAL_MONGODB_URI = 'mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/localDB?retryWrites=true&w=majority&appName=RCICDB';

async function updateLocalSuperAdmin() {
  try {
    console.log('🔗 Connecting to LOCAL database...');
    
    await mongoose.connect(LOCAL_MONGODB_URI);
    console.log('✅ Connected to LOCAL database');

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

    console.log('\n🔍 Finding super admin in LOCAL database...');
    
    // Find the super admin user
    const superAdmin = await User.findOne({ 
      email: 'superadmin@immigrationapp.com',
      role: 'super_admin'
    });

    if (!superAdmin) {
      console.log('❌ Super admin user not found in LOCAL database');
      
      // Create new super admin user
      console.log('\n🆕 Creating new super admin user in LOCAL database...');
      const newSuperAdmin = new User({
        email: 'superadmin@immigrationapp.com',
        password: await bcrypt.hash('SuperAdmin123!', 12),
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newSuperAdmin.save();
      console.log('✅ New super admin user created successfully!');
      
    } else {
      console.log(`✅ Found existing super admin user: ${superAdmin.email}`);
      
      // Update password to match production
      const newPassword = 'SuperAdmin123!';
      console.log(`\n🔐 Updating password to: ${newPassword}`);
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update the user's password
      superAdmin.password = hashedPassword;
      superAdmin.updatedAt = new Date();
      
      await superAdmin.save();
      
      console.log('✅ Super admin password updated successfully!');
    }

    console.log('\n📊 LOCAL SUPER ADMIN CREDENTIALS:');
    console.log('📧 Email: superadmin@immigrationapp.com');
    console.log('🔑 Password: SuperAdmin123!');
    console.log('🔒 Role: super_admin');

  } catch (error) {
    console.error('❌ Error updating local super admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔒 Disconnected from LOCAL database');
  }
}

updateLocalSuperAdmin().catch(console.error);
