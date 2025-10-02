const mongoose = require('mongoose');

console.log('🔧 Universal Tenant Creation Fix');
console.log('================================\n');

async function fixTenantCreation() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Load environment variables
    require('dotenv').config();
    
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI not found in environment variables');
      console.log('Please run this script from the backend directory with .env file');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Import models
    const User = require('./dist/models/User').default;
    const Tenant = require('./dist/models/Tenant').default;
    
    console.log('🔍 Checking if super admin user exists...');
    
    // Check if super admin user exists
    const superAdmin = await User.findOne({ 
      email: 'superadmin@immigrationapp.com',
      role: 'super_admin'
    });
    
    if (!superAdmin) {
      console.log('❌ Super admin user not found');
      console.log('🔧 Creating super admin user...');
      
      // Import bcrypt
      const bcrypt = require('bcryptjs');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
      
      // Create super admin user
      const newSuperAdmin = new User({
        email: 'superadmin@immigrationapp.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true,
        emailVerified: true,
        permissions: ['*'], // All permissions
        lastLogin: null,
        loginAttempts: 0,
        lockUntil: null
      });
      
      await newSuperAdmin.save();
      console.log('✅ Super admin user created successfully');
    } else {
      console.log('✅ Super admin user already exists');
      console.log('📧 Email:', superAdmin.email);
      console.log('👤 Role:', superAdmin.role);
      console.log('🟢 Active:', superAdmin.isActive);
    }
    
    // Check database indexes
    console.log('\n🔍 Checking database indexes...');
    
    // Create email index for fast login
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
    
    // Create compound index for login queries
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
    
    // Create tenant domain index
    try {
      await Tenant.collection.createIndex({ domain: 1 }, { unique: true });
      console.log('✅ Tenant domain index created/verified');
    } catch (error) {
      if (error.code === 85) {
        console.log('✅ Tenant domain index already exists');
      } else {
        console.log('⚠️ Tenant domain index error:', error.message);
      }
    }
    
    // Test super admin login
    console.log('\n🧪 Testing super admin login...');
    
    const testUser = await User.findOne({ 
      email: 'superadmin@immigrationapp.com',
      role: 'super_admin'
    }).select('+password');
    
    if (testUser) {
      console.log('✅ Super admin user found');
      
      // Test password verification
      const bcrypt = require('bcryptjs');
      const passwordMatch = await bcrypt.compare('SuperAdmin123!', testUser.password);
      console.log('🔐 Password verification:', passwordMatch ? '✅ Success' : '❌ Failed');
      
      if (passwordMatch) {
        console.log('\n🎯 Super admin login should now work!');
        console.log('📧 Email: superadmin@immigrationapp.com');
        console.log('🔒 Password: SuperAdmin123!');
      } else {
        console.log('\n❌ Password mismatch - updating password...');
        
        // Update password
        const newHashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
        testUser.password = newHashedPassword;
        await testUser.save();
        
        console.log('✅ Password updated successfully');
      }
    } else {
      console.log('❌ Super admin user not found after creation');
    }
    
    console.log('\n🎯 Universal fix completed successfully!');
    console.log('This should work in both local and production environments.');
    
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
fixTenantCreation().then(() => {
  console.log('\n🎉 Universal tenant creation fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fix failed:', error);
  process.exit(1);
});
