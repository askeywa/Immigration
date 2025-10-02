// Reset Super Admin Password Script
// This script resets the super admin password to a known value

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string (adjust if needed)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://immigration-portal:immigration-portal@ac-5ajo5ni-shard-00-00.npymiqt.mongodb.net/test?retryWrites=true&w=majority';

async function resetSuperAdminPassword() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define User schema (simplified version)
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      role: { type: String, enum: ['admin', 'user', 'super_admin'], default: 'user' },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', userSchema);

    // Find the super admin user
    console.log('🔍 Looking for super admin user...');
    const superAdmin = await User.findOne({ 
      email: 'superadmin@immigrationapp.com',
      role: 'super_admin' 
    });

    if (!superAdmin) {
      console.log('❌ Super admin user not found!');
      console.log('🏗️ Creating new super admin user...');
      
      // Create new super admin user
      const newPassword = 'ImmigrationDB2024';
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      const newSuperAdmin = new User({
        email: 'superadmin@immigrationapp.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true
      });

      await newSuperAdmin.save();
      console.log('✅ New super admin user created successfully!');
      console.log('📧 Email: superadmin@immigrationapp.com');
      console.log('🔑 Password: ImmigrationDB2024');
      
    } else {
      console.log('✅ Super admin user found!');
      console.log(`📧 Email: ${superAdmin.email}`);
      console.log(`👤 Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
      console.log(`🔐 Role: ${superAdmin.role}`);
      console.log(`✅ Active: ${superAdmin.isActive}`);
      
      // Reset password
      console.log('🔑 Resetting password...');
      const newPassword = 'ImmigrationDB2024';
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      superAdmin.password = hashedPassword;
      superAdmin.updatedAt = new Date();
      
      await superAdmin.save();
      console.log('✅ Password reset successfully!');
      console.log('🔑 New Password: ImmigrationDB2024');
    }

    // Test the password
    console.log('\n🧪 Testing the password...');
    const testUser = await User.findOne({ email: 'superadmin@immigrationapp.com' });
    const isPasswordValid = await bcrypt.compare('ImmigrationDB2024', testUser.password);
    
    if (isPasswordValid) {
      console.log('✅ Password test successful!');
    } else {
      console.log('❌ Password test failed!');
    }

    console.log('\n🎉 Super admin password reset complete!');
    console.log('📋 Login Credentials:');
    console.log('   Email: superadmin@immigrationapp.com');
    console.log('   Password: ImmigrationDB2024');
    console.log('\n🌐 You can now login at: http://localhost:5174/login');

  } catch (error) {
    console.error('❌ Error resetting super admin password:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
resetSuperAdminPassword();
