// Reset tenant admin password to a known value
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function resetTenantAdminPassword() {
    console.log('🔧 RESETTING TENANT ADMIN PASSWORD...');
    console.log('=====================================\n');

    try {
        // Connect to production database
        const mongoUri = 'mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/productionDB?retryWrites=true&w=majority&appName=RCICDB';
        
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to productionDB');

        // Define user schema
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.model('User', userSchema);

        // Find the tenant admin user
        const user = await User.findOne({ 
            email: 'admin@honeynwild.com'
        });

        if (user) {
            console.log('✅ Found tenant admin user:', user.email);
            
            // Set a new password
            const newPassword = 'Admin123!';
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            // Update the password
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { 
                    password: hashedPassword,
                    updatedAt: new Date()
                },
                { new: true }
            );

            console.log('✅ Password updated successfully!');
            console.log('📝 New Password: Admin123!');
            console.log('📝 User ID:', updatedUser._id);
            console.log('📝 Email:', updatedUser.email);
            console.log('📝 Role:', updatedUser.role);
            console.log('📝 Updated At:', updatedUser.updatedAt);
            
        } else {
            console.log('❌ Tenant admin user not found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    }
}

resetTenantAdminPassword().catch(console.error);