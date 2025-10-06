const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    // Connect to the correct production database
    const mongoUri = 'mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/productionDB?retryWrites=true&w=majority&appName=RCICDB';
    
    console.log('🔗 Connecting to productionDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to productionDB');
    
    // Define the User schema
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      firstName: String,
      lastName: String,
      role: String,
      tenantId: mongoose.Schema.Types.ObjectId,
      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date,
      lastLogin: Date
    }));
    
    // Find the user
    const user = await User.findOne({ email: 'admin@honeynwild.com' });
    
    if (!user) {
      console.log('❌ User not found with email: admin@honeynwild.com');
      return;
    }
    
    console.log('👤 Found user:', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    });
    
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Admin@123!', saltRounds);
    
    // Update the password
    user.password = hashedPassword;
    user.isActive = true; // Ensure user is active
    user.updatedAt = new Date();
    await user.save();
    
    console.log('✅ Password successfully reset for admin@honeynwild.com');
    console.log('🔑 New password: Admin@123!');
    console.log('🌐 Login URL: https://honeynwild.com/immigration-portal/login');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

resetPassword();
