const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('🔧 Fix Production Authentication');
console.log('================================\n');

async function fixProductionAuth() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Load environment variables
    require('dotenv').config();
    
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Import User model
    const { User } = require('./dist/models/User');
    
    console.log('🔧 Creating/Updating super admin user...');
    
    // Delete existing super admin if it exists
    await User.deleteMany({ 
      email: 'superadmin@immigrationapp.com',
      role: 'super_admin'
    });
    console.log('🗑️ Removed existing super admin user');
    
    // Create new super admin user (password will be hashed by pre-save hook)
    const superAdminUser = new User({
      email: 'superadmin@immigrationapp.com',
      password: 'SuperAdmin123!',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isActive: true,
      emailVerified: true,
      permissions: [
        'user.create', 'user.read', 'user.update', 'user.delete',
        'tenant.create', 'tenant.read', 'tenant.update', 'tenant.delete',
        'subscription.create', 'subscription.read', 'subscription.update', 'subscription.delete',
        'profile.create', 'profile.read', 'profile.update', 'profile.delete'
      ],
      lastLogin: null,
      loginAttempts: 0,
      lockUntil: null,
      tenantId: null, // Super admin doesn't belong to a specific tenant
    });
    
    await superAdminUser.save();
    console.log('✅ Super admin user created successfully');
    console.log('📧 Email: superadmin@immigrationapp.com');
    console.log('🔒 Password: SuperAdmin123!');
    console.log('👤 Role: super_admin');
    
    // Verify the user was created correctly
    const verifyUser = await User.findOne({ 
      email: 'superadmin@immigrationapp.com',
      role: 'super_admin'
    }).select('+password');
    
    if (verifyUser) {
      console.log('\n🧪 Verifying user creation...');
      console.log('✅ User found in database');
      console.log('📧 Email:', verifyUser.email);
      console.log('👤 Role:', verifyUser.role);
      console.log('🟢 Active:', verifyUser.isActive);
      
      // Test password
      const passwordMatch = await bcrypt.compare('SuperAdmin123!', verifyUser.password);
      console.log('🔐 Password verification:', passwordMatch ? '✅ Success' : '❌ Failed');
      
      if (passwordMatch && verifyUser.isActive) {
        console.log('\n🎯 Super admin authentication is ready!');
        console.log('📧 Email: superadmin@immigrationapp.com');
        console.log('🔒 Password: SuperAdmin123!');
      } else {
        console.log('\n❌ Authentication setup failed');
      }
    } else {
      console.log('❌ User verification failed');
    }
    
    // Ensure database indexes exist
    console.log('\n🔍 Ensuring database indexes exist...');
    
    try {
      await User.collection.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Email index created/verified');
    } catch (error) {
      if (error.code === 85) {
        console.log('✅ Email index already exists');
      } else {
        console.log('⚠️ Email index error:', error.message);
      }
    }
    
    try {
      await User.collection.createIndex({ email: 1, isActive: 1 });
      console.log('✅ Email + isActive index created/verified');
    } catch (error) {
      if (error.code === 85) {
        console.log('✅ Email + isActive index already exists');
      } else {
        console.log('⚠️ Email + isActive index error:', error.message);
      }
    }
    
    console.log('\n🎯 Production authentication fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixProductionAuth().then(() => {
  console.log('\n🎉 Production authentication fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fix failed:', error);
  process.exit(1);
});
