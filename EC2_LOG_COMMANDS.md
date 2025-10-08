# 🔍 EC2 LOG CHECKING COMMANDS

## Step 1: SSH into EC2 Instance

```bash
ssh -i "C:\Main_Data\AI\_Keys\node-key.pem" ubuntu@ec2-3-17-203-194.us-east-2.compute.amazonaws.com
```

## Step 2: Check PM2 Logs (Real-time)

```bash
cd /var/www/immigration-portal/backend
pm2 logs --lines 50
```

**Leave this running and try the login again from honeynwild.com**

## Step 3: Check for Tenant Resolution Debug Logs

```bash
pm2 logs | grep "Resolving tenant by domain"
```

## Step 4: Check for Login Debug Logs

```bash
pm2 logs | grep "LOGIN DEBUG"
```

## Step 5: Check if Enhanced Tenant Resolution is Being Used

```bash
cd /var/www/immigration-portal/backend/dist/routes
cat authRoutes.js | grep "enhancedTenantResolution"
```

## Step 6: Check the Actual Deployed Code

```bash
cd /var/www/immigration-portal/backend/dist/middleware
ls -la | grep "tenant"
```

Should show both:
- `tenantResolution.js` (old)
- `enhancedTenantResolution.js` (new)

## Step 7: Check Which Module is Being Imported

```bash
cd /var/www/immigration-portal/backend/dist/routes
cat authRoutes.js | head -20
```

Look for the import statement for tenant resolution.

---

## 🚀 Quick Commands (Copy-Paste)

```bash
# Connect
ssh -i "C:\Main_Data\AI\_Keys\node-key.pem" ubuntu@ec2-3-17-203-194.us-east-2.compute.amazonaws.com

# View real-time logs
cd /var/www/immigration-portal/backend && pm2 logs --lines 100

# Search for tenant resolution
pm2 logs --nostream --lines 200 | grep -i "tenant"

# Check deployed code
cat /var/www/immigration-portal/backend/dist/routes/authRoutes.js | grep -A 5 "enhancedTenantResolution"
```

---

## ⚡ **For Speed Issue:**

The 400 error is happening QUICKLY, but the page shows "Login failed: Validation Error" and then just sits there. 

The delay you're seeing is probably:
1. The error message is displayed
2. But the form doesn't reset or show any further action

This is a UX issue in the HTML page - it needs better error handling and faster feedback.

