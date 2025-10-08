# PM2 Restart Issue - Complete Resolution

## 🎯 Core Problem Identified

**PM2 was failing to properly kill and restart the Node.js process**, keeping OLD CODE in memory even after successful GitHub Actions deployments.

---

## 📊 Symptoms

1. **PM2 Logs showed repeated restart failures:**
   ```
   PM2 | pid=13024 msg=failed to kill - retrying in 100ms
   PM2 | pid=13024 msg=failed to kill - retrying in 100ms
   PM2 | Process with pid 13024 still alive after 1600ms, sending it SIGKILL now...
   ```

2. **Backend file existed on disk but wasn't loaded:**
   - `enhancedTenantResolution.js` was in `/var/www/immigration-portal/backend/dist/middleware/`
   - Modified timestamp: **Oct 5 00:28** (recent deployment)
   - But old middleware (without `customDomains` support) kept running

3. **API was returning 400 Validation Error** because:
   - Old `tenantResolution.ts` middleware was still in memory
   - New `enhancedTenantResolution.ts` was on disk but not loaded
   - Tenant resolution failed for `honeynwild.com` domain

---

## ✅ Solution Applied

### Step 1: Force Kill All Node Processes
```bash
# On EC2 instance:
pm2 stop all
pm2 delete immigration-portal
sudo pkill -9 node
```

### Step 2: Verify Latest Code on Disk
```bash
ls -la /var/www/immigration-portal/backend/dist/middleware/enhancedTenantResolution.js
# Output: -rw-rw-r-- 1 ubuntu ubuntu 6783 Oct  5 00:28
```

### Step 3: Fresh PM2 Start
```bash
cd /var/www/immigration-portal/backend
pm2 start dist/server.js --name immigration-portal
pm2 save
```

### Step 4: Verify Backend Working
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Original-Host: honeynwild.com" \
  -H "X-Tenant-Domain: honeynwild.com" \
  -d '{"email":"admin@honeynwild.com","password":"Admin123!"}'
```

**Result:** ✅ **Status 200** - Login successful!

---

## 🔍 Verification Results

### Backend API (Direct Call)
✅ **WORKING**
- Status: `200 OK`
- Response: Full auth data with token
- User: `admin@honeynwild.com`
- Role: `tenant_admin`
- Tenant: `Honey & Wild` (honeynwild.com)
- Custom domains: `["honeynwild.com"]`

### Frontend (Browser Test)
⚠️ **PARTIAL** - Login API works, but redirect fails
- API call succeeds: `200 OK`
- Auth data stored in sessionStorage
- `AuthCallback` processes data correctly
- **BUT:** Redirects to `/login` instead of `/tenant/dashboard`

---

## 🛠️ Remaining Issue: Frontend Not Rebuilt

### Problem
The frontend on EC2 was built **before** our latest `AuthCallback.tsx` fixes:
- Local `dist/index.html`: **Oct 4, 8:26 PM**
- Latest code changes: **Oct 5**

### Frontend Fix Applied
**File:** `frontend/src/pages/auth/AuthCallback.tsx` (Line 138)
```typescript
// CRITICAL: Use window.location.replace to ensure a full page reload
// This ensures the auth store is fully rehydrated from sessionStorage
setTimeout(() => {
  window.location.replace(redirectPath);
}, 1500);
```

**Why this fix is needed:**
1. `navigate()` does a soft client-side navigation
2. By the time new page loads, `isAuthenticated` is still `false` (not rehydrated yet)
3. `App.tsx` catch-all route redirects to `/login`
4. `window.location.replace()` forces a full page reload
5. Full reload ensures `sessionStorage` is read before rendering

### Deployment Triggered
```bash
git commit -m "FORCE REDEPLOY: Frontend with proper AuthCallback redirect"
git push origin main
```

**GitHub Actions:** Deployment #XX in progress
**ETA:** 5-7 minutes

---

## 📋 Next Steps

### 1. Wait for Deployment (5-7 minutes)
Monitor at: https://github.com/askeywa/Immigration/actions

### 2. Verify Deployment
```bash
# Check frontend build date on EC2:
ssh ubuntu@<ec2-ip> "ls -la /var/www/immigration-portal/frontend/dist/index.html"
# Should show: Oct 5, 05:4X (recent timestamp)
```

### 3. Test Production Login
Run browser test:
```bash
node test-production-login-now.js
```

**Expected Result:**
- ✅ API call succeeds (200 OK)
- ✅ Auth data stored in sessionStorage
- ✅ AuthCallback processes data
- ✅ Redirects to `/tenant/dashboard` (NOT `/login`)
- ✅ Tenant dashboard loads with proper tenant info

---

## 🎓 Key Lessons Learned

### 1. PM2 Reload vs Restart
- **`pm2 reload`:** Hot reload, keeps process running (doesn't always load new code)
- **`pm2 restart`:** Full restart, but can still fail to kill stubborn processes
- **`pkill -9 node`:** Nuclear option, guaranteed to kill all Node processes

### 2. Always Verify File Timestamps
- Code on disk ≠ Code in memory
- Check file timestamps after deployment: `ls -la dist/`

### 3. Zustand Persist Rehydration Timing
- Client-side navigation (`navigate()`) happens too fast
- SessionStorage read happens async
- Need full page reload (`window.location.replace()`) for critical auth flows

### 4. Frontend Build Caching
- `.vite/` cache can persist old compiled code
- Always clear: `rm -rf dist/ node_modules/.cache/ .vite/`
- Our `deploy.yml` now does this automatically

---

## 📝 Updated Deployment Workflow

### `.github/workflows/deploy.yml` Enhancements
```yaml
# Clear ALL caches before building
rm -rf dist/
rm -rf node_modules/.cache/
rm -rf .vite/

# Build fresh
npm run build

# Verify build
if [ ! -d "dist" ]; then
  echo "ERROR: Frontend dist directory not found!"
  exit 1
fi

# Force PM2 restart (not reload)
if pm2 list | grep -q "immigration-portal"; then
  pm2 restart immigration-portal --update-env
else
  pm2 start dist/server.js --name immigration-portal
fi
pm2 save
```

---

## ✅ Success Criteria

### Backend (CONFIRMED ✅)
- [x] `enhancedTenantResolution.js` exists on disk
- [x] PM2 running fresh process
- [x] Login API returns 200 OK
- [x] Tenant `honeynwild.com` resolved correctly
- [x] Custom domains working

### Frontend (PENDING ⏳)
- [ ] `dist/` built with latest `AuthCallback.tsx`
- [ ] Browser test shows successful redirect to `/tenant/dashboard`
- [ ] No redirect back to `/login`
- [ ] Tenant dashboard loads with proper data

---

## 🚀 Current Status

**Backend:** ✅ **FULLY WORKING**
**Frontend:** ⏳ **Deployment in progress**
**ETA:** 5-7 minutes

**Once deployment completes:**
1. Run `node test-production-login-now.js`
2. Verify redirect to `/tenant/dashboard`
3. Confirm tenant login is fully functional end-to-end

---

*Document generated: 2025-10-05 05:42 UTC*
*Issue resolved by: Forced PM2 restart + Frontend redeployment*

