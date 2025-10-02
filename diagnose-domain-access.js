console.log('🔍 Domain Access Diagnosis');
console.log('==========================\n');

console.log('📊 Current Status:');
console.log('==================');
console.log('✅ GitHub Actions: Successful deployment');
console.log('✅ Application: Running on EC2 (PM2 online)');
console.log('✅ Redis: Working and responding');
console.log('❌ Domain: Cloudflare 522 error (Connection timed out)\n');

console.log('🎯 Root Cause: Application not accessible externally');
console.log('====================================================\n');

console.log('🔍 Most Likely Issues:');
console.log('======================\n');

console.log('1. 🌐 Missing Nginx Reverse Proxy:');
console.log('   • Your app runs on port 5000 internally');
console.log('   • Web traffic comes on ports 80 (HTTP) and 443 (HTTPS)');
console.log('   • Need Nginx to proxy external requests to your app\n');

console.log('2. 🔒 Firewall/Security Group Issues:');
console.log('   • EC2 Security Group might block ports 80/443');
console.log('   • Ubuntu firewall (UFW) might be blocking traffic');
console.log('   • Application might be listening only on localhost\n');

console.log('3. 🔗 Application Binding Issues:');
console.log('   • App might be bound to 127.0.0.1 instead of 0.0.0.0');
console.log('   • Only accessible from within EC2, not externally\n');

console.log('📋 Diagnostic Commands (SSH into EC2):');
console.log('======================================');
console.log('ssh ubuntu@18.220.224.109');
console.log('');
console.log('# Check if Nginx is installed and running');
console.log('sudo systemctl status nginx');
console.log('nginx -v');
console.log('');
console.log('# Check what ports are listening');
console.log('sudo netstat -tlnp | grep :80');
console.log('sudo netstat -tlnp | grep :443');
console.log('sudo netstat -tlnp | grep :5000');
console.log('');
console.log('# Check application binding');
console.log('curl http://localhost:5000/api/health');
console.log('curl http://127.0.0.1:5000/api/health');
console.log('curl http://0.0.0.0:5000/api/health');
console.log('');
console.log('# Check firewall status');
console.log('sudo ufw status');
console.log('sudo iptables -L');
console.log('');
console.log('# Check PM2 logs for binding info');
console.log('pm2 logs immigration-portal --lines 20');

console.log('\n🛠️ Quick Fixes:');
console.log('===============\n');

console.log('1. Install and Configure Nginx:');
console.log('   sudo apt update');
console.log('   sudo apt install nginx -y');
console.log('   sudo systemctl start nginx');
console.log('   sudo systemctl enable nginx');
console.log('');
console.log('2. Create Nginx Configuration:');
console.log('   sudo nano /etc/nginx/sites-available/immigration-portal');
console.log('');
console.log('3. Add this configuration:');
console.log('   server {');
console.log('       listen 80;');
console.log('       server_name ibuyscrap.ca www.ibuyscrap.ca;');
console.log('       ');
console.log('       location / {');
console.log('           proxy_pass http://localhost:5000;');
console.log('           proxy_http_version 1.1;');
console.log('           proxy_set_header Upgrade $http_upgrade;');
console.log('           proxy_set_header Connection \'upgrade\';');
console.log('           proxy_set_header Host $host;');
console.log('           proxy_set_header X-Real-IP $remote_addr;');
console.log('           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
console.log('           proxy_set_header X-Forwarded-Proto $scheme;');
console.log('           proxy_cache_bypass $http_upgrade;');
console.log('       }');
console.log('   }');
console.log('');
console.log('4. Enable the site:');
console.log('   sudo ln -s /etc/nginx/sites-available/immigration-portal /etc/nginx/sites-enabled/');
console.log('   sudo nginx -t');
console.log('   sudo systemctl reload nginx');
console.log('');
console.log('5. Check AWS Security Group:');
console.log('   • Go to AWS EC2 Console');
console.log('   • Select your instance');
console.log('   • Check Security Group rules');
console.log('   • Ensure ports 80 and 443 are open from 0.0.0.0/0');

console.log('\n🎯 Expected Results After Fix:');
console.log('===============================');
console.log('• Domain should load your application');
console.log('• No more Cloudflare 522 errors');
console.log('• Application accessible from browser');

console.log('\n💡 Priority Order:');
console.log('==================');
console.log('1. Check if Nginx is installed/running');
console.log('2. Configure Nginx reverse proxy');
console.log('3. Check AWS Security Group settings');
console.log('4. Test domain access');
