# DNS Configuration Instructions for Multi-Tenant Immigration Portal

## 🌐 DNS Records Required

### For Super Admin Domain (ibuyscrap.ca)
```
Type: A
Name: @ (or ibuyscrap.ca)
Value: 52.15.148.97
TTL: 3600

Type: A
Name: www
Value: 52.15.148.97
TTL: 3600
```

### For Tenant Domain (honeynwild.com)
```
Type: A
Name: @ (or honeynwild.com)
Value: 52.15.148.97
TTL: 3600

Type: A
Name: www
Value: 52.15.148.97
TTL: 3600
```

## 📋 Step-by-Step DNS Configuration

### Step 1: Access cPanel
1. Login to your cPanel account for `ibuyscrap.ca`
2. Login to your cPanel account for `honeynwild.com`

### Step 2: Navigate to DNS Management
1. In cPanel, look for **"DNS Zone Editor"** or **"DNS Management"**
2. Click on it to access DNS settings

### Step 3: Add A Records for Super Admin Domain (ibuyscrap.ca)
1. Click **"Add Record"** or **"Add A Record"**
2. Fill in the following:
   - **Type**: A
   - **Name**: @ (this represents the root domain)
   - **Value**: 52.15.148.97
   - **TTL**: 3600
3. Click **"Add Record"**
4. Add another A record:
   - **Type**: A
   - **Name**: www
   - **Value**: 52.15.148.97
   - **TTL**: 3600
4. Click **"Add Record"**

### Step 4: Add A Records for Tenant Domain (honeynwild.com)
1. Repeat the same process for `honeynwild.com`:
   - **Type**: A
   - **Name**: @
   - **Value**: 52.15.148.97
   - **TTL**: 3600
2. Add www subdomain:
   - **Type**: A
   - **Name**: www
   - **Value**: 52.15.148.97
   - **TTL**: 3600

### Step 5: Verify DNS Propagation
After adding the records, it may take 5-60 minutes for DNS changes to propagate globally. You can check propagation using:

```bash
# Check if DNS is working
nslookup ibuyscrap.ca
nslookup honeynwild.com

# Or use online tools:
# - https://dnschecker.org/
# - https://whatsmydns.net/
```

## 🔧 Optional: CNAME Records for API Subdomains

If you want to create dedicated API subdomains:

### For Super Admin API
```
Type: CNAME
Name: api.ibuyscrap.ca
Value: ibuyscrap.ca
TTL: 3600
```

### For Tenant API
```
Type: CNAME
Name: api.honeynwild.com
Value: honeynwild.com
TTL: 3600
```

## ✅ Verification Steps

### 1. Check DNS Resolution
```bash
# Test DNS resolution
dig ibuyscrap.ca
dig honeynwild.com
```

### 2. Test HTTP Access
```bash
# Test super admin access
curl -I http://ibuyscrap.ca

# Test tenant access
curl -I http://honeynwild.com
```

### 3. Test API Endpoints
```bash
# Test super admin API
curl http://ibuyscrap.ca/api/health

# Test tenant API
curl http://honeynwild.com/immigration-portal/api/v1/tenant/info
```

## 🚨 Troubleshooting

### DNS Not Propagating
- **Wait**: DNS changes can take up to 48 hours to propagate globally
- **Check TTL**: Lower TTL values (300-600) make changes propagate faster
- **Clear Cache**: Clear your browser DNS cache or use incognito mode

### Domain Not Resolving
- **Verify Records**: Double-check the A records are correct
- **Check Spelling**: Ensure domain names are spelled correctly
- **Contact Support**: If issues persist, contact your domain registrar

### SSL Certificate Issues
- **Wait for DNS**: Ensure DNS is fully propagated before getting SSL certificates
- **Use Let's Encrypt**: Free SSL certificates via Certbot
- **Check Domain**: Ensure the domain is pointing to the correct IP

## 📞 Support

If you encounter issues:
1. **Check DNS propagation**: Use online DNS checker tools
2. **Verify A records**: Ensure they point to 52.15.148.97
3. **Wait for propagation**: DNS changes can take time
4. **Contact your domain registrar**: If DNS issues persist

## 🎯 Expected Results

After DNS configuration:
- ✅ `ibuyscrap.ca` → Super Admin Dashboard
- ✅ `honeynwild.com/immigration-portal/login` → Tenant Login Page
- ✅ `honeynwild.com/immigration-portal/dashboard` → Tenant Dashboard
- ✅ API endpoints working on both domains
- ✅ SSL certificates working (after setup)
