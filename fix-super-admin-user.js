const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('🔧 Super Admin User Fix Script');
console.log('==============================\n');

async function fixSuperAdminUser() {
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
    
    // Import User model
    const User = require('./dist/models/User').default;
    
    console.log('🔍 Checking if superadmin user exists...');
    
    // Check if superadmin user exists
    const existingUser = await User.findOne({ 
      email: 'superadmin@immigrationapp.com' 
    });
    
    if (existingUser) {
      console.log('✅ Superadmin user already exists');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Role:', existingUser.role);
      console.log('🟢 Active:', existingUser.isActive);
      console.log('📅 Created:', existingUser.createdAt);
    } else {
      console.log('❌ Superadmin user not found');
      console.log('🔧 Creating superadmin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
      
      // Create superadmin user
      const superAdminUser = new User({
        email: 'superadmin@immigrationapp.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true,
        emailVerified: true,
        lastLogin: null,
        loginAttempts: 0,
        lockUntil: null
      });
      
      await superAdminUser.save();
      console.log('✅ Superadmin user created successfully');
      console.log('📧 Email: superadmin@immigrationapp.com');
      console.log('🔒 Password: SuperAdmin123!');
      console.log('👤 Role: super_admin');
    }
    
    // Check database indexes
    console.log('\n🔍 Checking database indexes...');
    const indexes = await User.collection.getIndexes();
    console.log('📊 Current indexes:', Object.keys(indexes));
    
    // Ensure email index exists
    try {
      await User.collection.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Email index created/verified');
    } catch (error) {
      if (error.code === 85) { // Index already exists
        console.log('✅ Email index already exists');
      } else {
        console.log('⚠️ Email index creation failed:', error.message);
      }
    }
    
    // Test user lookup
    console.log('\n🧪 Testing user lookup...');
    const testUser = await User.findOne({ 
      email: 'superadmin@immigrationapp.com' 
    }).select('+password');
    
    if (testUser) {
      console.log('✅ User lookup successful');
      console.log('📧 Found user:', testUser.email);
      
      // Test password verification
      const passwordMatch = await bcrypt.compare('SuperAdmin123!', testUser.password);
      console.log('🔐 Password verification:', passwordMatch ? '✅ Success' : '❌ Failed');
    } else {
      console.log('❌ User lookup failed');
    }
    
    console.log('\n🎯 Fix completed successfully!');
    console.log('You can now try logging in with:');
    console.log('📧 Email: superadmin@immigrationapp.com');
    console.log('🔒 Password: SuperAdmin123!');
    
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
fixSuperAdminUser().then(() => {
  console.log('\n🎉 Super admin user fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fix failed:', error);
  process.exit(1);
});
