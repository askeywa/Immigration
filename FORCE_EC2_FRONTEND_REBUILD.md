# Force Frontend Rebuild on EC2

## 🚨 CRITICAL ISSUE IDENTIFIED

The `window.location.replace()` fix **IS** in the Git repository (commit `62d3aeb` from Oct 4, 19:16), but the EC2 deployment is **NOT** serving the updated frontend.

**Evidence:**
- Browser console shows: `🔄 AuthCallback: Redirecting to: /tenant/dashboard`
- But user ends up at: `/login`
- This means `navigate()` is still being used, not `window.location.replace()`

---

## 📋 Manual Fix Steps

### Step 1: SSH into EC2
```bash
ssh -i "C:\Main_Data\AI\_Keys\node-key.pem" ubuntu@54.175.174.228
```

### Step 2: Check Current Frontend Build Date
```bash
cd /var/www/immigration-portal/frontend
ls -la dist/index.html
ls -la dist/assets/*.js | head -5
```

**Look for the modification date** - should be recent (Oct 5).

### Step 3: Force Complete Frontend Rebuild
```bash
cd /var/www/immigration-portal/frontend

# Step 3a: Remove ALL caches and old builds
rm -rf dist/
rm -rf node_modules/.cache/
rm -rf .vite/
rm -rf .turbo/

# Step 3b: Clear npm cache
npm cache clean --force

# Step 3c: Rebuild from scratch
npm run build
```

### Step 4: Verify Build Completed
```bash
# Check if dist folder exists and has recent files
ls -la dist/
ls -la dist/assets/ | head -10

# Verify index.html was created
cat dist/index.html | head -20
```

### Step 5: Restart PM2 to Pick Up New Static Files
```bash
cd /var/www/immigration-portal/backend
pm2 restart immigration-portal
pm2 logs immigration-portal --lines 50
```

### Step 6: Test API Health
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": ...,
  "database": "connected"
}
```

---

## 🔍 Troubleshooting

### If Build Fails with TypeScript Errors
```bash
cd /var/www/immigration-portal/frontend

# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# Try cleaning node_modules entirely
rm -rf node_modules/
npm install
npm run build
```

### If PM2 Doesn't Pick Up New Files
```bash
# Nuclear option: Stop all processes and start fresh
pm2 stop all
pm2 delete all
sudo pkill -9 node

# Start backend fresh
cd /var/www/immigration-portal/backend
pm2 start dist/server.js --name immigration-portal
pm2 save
pm2 logs immigration-portal
```

### If Static Files Still Not Served
Check the backend's static file serving configuration:

```bash
cd /var/www/immigration-portal/backend
# Check if server.js has static file serving
grep -A10 "static" dist/server.js
```

Should show:
```javascript
app.use(express.static(frontendDistPath, { ... }));
```

---

## ✅ Verification Commands

### Test 1: Check if Frontend Files Exist
```bash
curl -I http://localhost:5000/
# Should return 200 OK with text/html
```

### Test 2: Check if AuthCallback Route Exists
```bash
curl -I http://localhost:5000/auth-callback
# Should return 200 OK with text/html (SPA fallback)
```

### Test 3: Test Login API
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Original-Host: honeynwild.com" \
  -H "X-Tenant-Domain: honeynwild.com" \
  -d '{"email":"admin@honeynwild.com","password":"Admin123!"}'
```

### Test 4: Check PM2 Status
```bash
pm2 status
pm2 logs immigration-portal --lines 100
```

---

## 📊 Expected Results After Fix

1. **Frontend dist/ folder:** Modified today (Oct 5)
2. **PM2 status:** `online` with no errors
3. **Browser test:** Redirects to `/tenant/dashboard` (NOT `/login`)
4. **Tenant dashboard:** Loads with proper tenant info

---

## 🚀 Alternative: Use GitHub Actions to Force Rebuild

If manual steps don't work, we can add a deployment step that explicitly forces frontend rebuild:

### Option A: Trigger Manual Workflow
Go to: https://github.com/askeywa/Immigration/actions
Click: "Run workflow" on the `deploy.yml` workflow

### Option B: Push a Dummy Change
```bash
# On local machine:
cd c:\Main_Data\AI\immigration-appV1
echo "Force rebuild $(date)" > .force-rebuild-$(date +%s).txt
git add .
git commit -m "FORCE: Trigger frontend rebuild on EC2"
git push origin main
```

---

## 📝 Post-Fix Test

**After completing the manual rebuild, run this test on your local machine:**

```bash
cd c:\Main_Data\AI\immigration-appV1
node test-production-login-now.js
```

**Expected output:**
```
📍 Final URL: https://ibuyscrap.ca/tenant/dashboard
✅ SUCCESS! Reached tenant dashboard!
```

---

*Document created: 2025-10-05 05:50 UTC*
*Issue: Frontend not rebuilding properly on EC2 despite code being in Git*
*Solution: Manual forced rebuild with complete cache clearing*

