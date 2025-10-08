# 🚀 DEPLOYMENT COMMANDS - RUN THESE ON EC2

## Step 1: Connect to EC2
```bash
# Use your SSH key to connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
# OR if you're already connected, just proceed to Step 2
```

## Step 2: Navigate to Backend Directory
```bash
cd /var/www/immigration-portal/backend
pwd
# Should show: /var/www/immigration-portal/backend
```

## Step 3: Verify Deployment
```bash
# Check if new files exist
ls -la src/middleware/dynamicCorsSecurity.ts
ls -la src/middleware/enhancedTenantResolution.ts
ls -la src/scripts/migrate-tenant-domains.ts

# Check if they're compiled
ls -la dist/middleware/dynamicCorsSecurity.js
ls -la dist/middleware/enhancedTenantResolution.js
ls -la dist/scripts/migrate-tenant-domains.js
```

## Step 4: Run Migration Script
```bash
# This will add customDomains to all tenants and configure honeynwild.com
npx tsx src/scripts/migrate-tenant-domains.ts

# Expected Output:
# ✅ Connected to database: productionDB
# ✅ Migration complete: X tenants updated
# ✅ Found Honey & Wild tenant
# ✅ Added honeynwild.com to customDomains
# ✅ Added domain approval for honeynwild.com
```

## Step 5: Verify Migration Success
```bash
# Optional: Check the database to confirm
# You can skip this if migration output looks good
```

## Step 6: Restart Backend
```bash
# Restart PM2 process to load new code
pm2 restart immigration-portal

# Wait 5 seconds for restart
sleep 5

# Check logs for successful restart
pm2 logs immigration-portal --lines 50
```

## Step 7: Verify Backend is Running
```bash
# Look for these log messages:
# ✅ "Connected to MongoDB"
# ✅ "Trusted Domains Cache Updated"
# ✅ "Server started on port 5000"

# Check PM2 status
pm2 status
# Should show: immigration-portal | online | 0 restarts
```

## Step 8: Test API Endpoint
```bash
# Test health endpoint
curl https://ibuyscrap.ca/api/health

# Expected: {"status":"OK","database":{"connected":true}}
```

---

## 🎯 READY FOR TESTING

Once all steps complete successfully, notify the assistant to begin comprehensive testing!

