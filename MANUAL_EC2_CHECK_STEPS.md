# 📋 MANUAL EC2 CHECK - STEP BY STEP

## 🎯 **Goal:** Find out why tenant resolution is failing

---

## **STEP 1: Connect to EC2**

Open **PowerShell** or **Command Prompt** and run:

```powershell
ssh -i "C:\Main_Data\AI\_Keys\node-key.pem" ubuntu@ec2-3-17-203-194.us-east-2.compute.amazonaws.com
```

If you get "Permission denied", run this first:
```powershell
icacls "C:\Main_Data\AI\_Keys\node-key.pem" /reset
icacls "C:\Main_Data\AI\_Keys\node-key.pem" /grant:r "deepa:(R)"
icacls "C:\Main_Data\AI\_Keys\node-key.pem" /inheritance:r
```

---

## **STEP 2: Check PM2 Logs (IMPORTANT!)**

Once connected, run:
```bash
cd /var/www/immigration-portal/backend
pm2 logs --lines 100
```

**NOW, go to honeynwild.com/immigration-portal/login and click "Sign In"**

Watch the logs in real-time. You should see:
- `🔍 LOGIN DEBUG - Request received:` ← Shows request body
- `🔍 Resolving tenant by domain:` ← Shows tenant resolution
- `❌ No valid domain pattern found:` ← If tenant not found

**Copy and paste the last 50 lines here!**

---

## **STEP 3: Check Deployed Code**

Still in SSH, run:
```bash
cat /var/www/immigration-portal/backend/dist/routes/authRoutes.js | grep "enhancedTenantResolution"
```

**Expected output:**
```javascript
var enhancedTenantResolution_1 = require("../middleware/enhancedTenantResolution");
```

**If you see this instead, it's WRONG:**
```javascript
var tenantResolution_1 = require("../middleware/tenantResolution");
```

---

## **STEP 4: Check if Enhanced Middleware Exists**

```bash
ls -la /var/www/immigration-portal/backend/dist/middleware/ | grep "tenant"
```

**Expected output:**
```
-rw-r--r-- 1 ubuntu ubuntu  xxxxx date enhancedTenantResolution.js
-rw-r--r-- 1 ubuntu ubuntu  xxxxx date tenantResolution.js
```

Both files should exist.

---

## **STEP 5: Check MongoDB Connection**

```bash
curl http://localhost:3000/api/health
```

Should show database connected with `productionDB`.

---

## **STEP 6: Test Direct API Call from EC2**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Original-Host: honeynwild.com" \
  -H "X-Tenant-Domain: honeynwild.com" \
  -d '{"email":"admin@honeynwild.com","password":"Admin123!"}'
```

**Copy the response here!**

---

## **ALTERNATIVE: View Logs from GitHub Actions**

If SSH doesn't work, we can view deployment logs from GitHub Actions:
1. Go to: https://github.com/askeywa/Immigration/actions
2. Click the latest "Deploy to EC2" workflow
3. Expand the "Build and Deploy" step
4. Look for the build output

---

## 🚨 **CRITICAL FINDING FROM YOUR SCREENSHOT:**

The error shows:
- **"Login failed: Validation Error"**
- **"Error: Validation Error"**
- **"Response status: Unknown"**

This means:
1. ✅ Form IS submitting
2. ✅ API IS being called
3. ❌ API returns 400 Validation Error
4. ❌ Backend tenant resolution is FAILING

**We MUST see the server logs to know WHY tenant resolution is failing!**

---

## ⚡ **For the Speed Issue:**

The "long wait" you're seeing is because:
1. The error shows immediately (`400` returns fast)
2. **BUT** the HTML page doesn't have a loading spinner or proper error recovery
3. It just shows the error and sits there

**We need to:**
1. ✅ Fix the `400` error first (tenant resolution)
2. ✅ Then add loading spinner and better UX

**First priority: See the EC2 logs!**

