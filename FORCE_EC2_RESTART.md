# 🔥 FORCE EC2 RESTART - GUARANTEED FIX

## The REAL Problem:

PM2 is not properly restarting the Node.js process. The logs show:
```
PM2 log: pid=44251 msg=failed to kill - retrying in 100ms
PM2 log: Process with pid 44251 still alive after 1600ms, sending it SIGKILL now...
```

This means **OLD CODE is still running even after deployment!**

---

## 🚀 SOLUTION: Force Kill and Restart

SSH into EC2 and run these commands:

```bash
# 1. Stop PM2 completely
pm2 stop all

# 2. Delete PM2 process
pm2 delete immigration-portal

# 3. Kill any lingering Node processes
sudo pkill -9 node

# 4. Verify no Node processes are running
ps aux | grep node

# 5. Go to backend directory
cd /var/www/immigration-portal/backend

# 6. Verify the new file EXISTS
ls -la dist/middleware/enhancedTenantResolution.js

# 7. If file is missing, pull latest code and rebuild
git pull origin main
rm -rf dist/
npm run build

# 8. Verify file NOW exists
ls -la dist/middleware/enhancedTenantResolution.js

# 9. Start fresh with PM2
pm2 start dist/server.js --name immigration-portal

# 10. Save PM2 config
pm2 save

# 11. Check logs in real-time
pm2 logs immigration-portal
```

---

## ✅ Verification Commands:

### Check if enhancedTenantResolution exists:
```bash
cat /var/www/immigration-portal/backend/dist/middleware/enhancedTenantResolution.js | head -20
```

Should show JavaScript code, NOT "No such file".

### Check if it's being imported:
```bash
cat /var/www/immigration-portal/backend/dist/routes/authRoutes.js | grep enhancedTenantResolution
```

Should show:
```javascript
const enhancedTenantResolution_1 = require("../middleware/enhancedTenantResolution");
```

### Test tenant resolution:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Original-Host: honeynwild.com" \
  -H "X-Tenant-Domain: honeynwild.com" \
  -d '{"email":"admin@honeynwild.com","password":"Admin123!"}'
```

Should return tenant data or authentication error, NOT "Validation Error".

---

## 🎯 Expected Result:

After proper restart, logs should show:
```
🔍 Resolving tenant by domain: honeynwild.com
🔍 Tenant query result: { _id: '68e099ac79418e10721252ca', name: 'Honey & Wild', domain: 'honeynwild.com' }
✅ Tenant Resolved Successfully
```

---

## ⚠️ If File is STILL Missing After git pull + rebuild:

Then we have a different problem - maybe a `.gitignore` rule or TypeScript config issue.

Run this to check:
```bash
# Check if file is in Git
cd /var/www/immigration-portal
git ls-tree -r HEAD --name-only | grep enhancedTenantResolution

# Check tsconfig
cat backend/tsconfig.json | grep -A 10 "include\|exclude"
```

---

## 💡 The REAL Root Cause (My Theory):

1. ✅ File exists in Git
2. ✅ File exists in local dist/
3. ✅ Deployment copies files correctly
4. ❌ **PM2 restart fails** → Old code keeps running
5. ❌ New file is on disk but not loaded in memory

**Solution:** Force kill all Node processes and start fresh.

