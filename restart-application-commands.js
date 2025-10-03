console.log('🔄 Application Restart Commands');
console.log('===============================\n');

console.log('📋 Commands to restart the application on your EC2 server:');
console.log('=========================================================\n');

console.log('1. SSH into your EC2 server:');
console.log('   ssh -i your-key.pem ubuntu@18.220.224.109\n');

console.log('2. Navigate to the application directory:');
console.log('   cd /var/www/immigration-portal/backend\n');

console.log('3. Check PM2 status:');
console.log('   pm2 status\n');

console.log('4. Stop the current application:');
console.log('   pm2 stop immigration-portal\n');

console.log('5. Delete the PM2 process:');
console.log('   pm2 delete immigration-portal\n');

console.log('6. Kill PM2 daemon:');
console.log('   pm2 kill\n');

console.log('7. Verify the new code is deployed:');
console.log('   ls -la dist/server.js\n');
console.log('   head -20 dist/server.js | grep -i "authservice" || echo "No authService found in server.js"\n');

console.log('8. Start the application with PM2:');
console.log('   pm2 start ecosystem.config.js --env production\n');

console.log('9. Check PM2 status:');
console.log('   pm2 status\n');

console.log('10. Check PM2 logs:');
console.log('    pm2 logs immigration-portal --lines 20\n');

console.log('11. Test the application:');
console.log('    curl -f http://localhost:5000/api/health\n');

console.log('12. If health check works, test authentication:');
console.log('    curl -X POST https://ibuyscrap.ca/api/auth/login \\');
console.log('      -H "Content-Type: application/json" \\');
console.log('      -d \'{"email":"superadmin@immigrationapp.com","password":"SuperAdmin123!"}\'\n');

console.log('🎯 After these steps, the application should be running with the latest code!');
console.log('🚀 Then you can test tenant creation and all other features.');

console.log('\n📝 Alternative: Quick restart command:');
console.log('=====================================');
console.log('pm2 restart immigration-portal --update-env');
console.log('# OR');
console.log('pm2 reload immigration-portal --update-env');

console.log('\n⚠️  If restart doesn\'t work, try:');
console.log('================================');
console.log('pm2 delete all');
console.log('pm2 kill');
console.log('pm2 start ecosystem.config.js --env production');
