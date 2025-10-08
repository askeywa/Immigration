# Cloudflare Setup Guide for Multi-Tenant Immigration Portal

This guide will help you configure Cloudflare for automatic DNS management of tenant domains.

## **🎯 Overview**

With Cloudflare integration, when you create a new tenant (e.g., `honeynwild.com`), the system will automatically:
1. Create DNS records pointing to your EC2 instance
2. Configure SSL certificates
3. Set up caching and security rules
4. Enable tenant-specific routing

## **📋 Prerequisites**

- Cloudflare account with a domain (e.g., `ibuyscrap.ca`)
- EC2 instance with public IP: `52.15.148.97`
- Access to Cloudflare API

## **🔧 Step 1: Get Cloudflare API Credentials**

### **1.1 Get API Token**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Set permissions:
   - **Zone**: `Zone:Read`, `Zone:Edit`, `DNS:Edit`
   - **Account**: `Account:Read`
5. Zone Resources: Include specific zone (your domain)
6. Click "Continue to summary" → "Create Token"
7. **Copy the token** (you won't see it again!)

### **1.2 Get Zone ID**
1. Go to your domain in Cloudflare Dashboard
2. Scroll down to "API" section
3. Copy the "Zone ID"

### **1.3 Get Account ID**
1. In Cloudflare Dashboard, look at the right sidebar
2. Copy your "Account ID"

## **🔧 Step 2: Update Environment Variables**

Add these to your `backend/.env` file:

```env
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_actual_api_token_here
CLOUDFLARE_ZONE_ID=your_actual_zone_id_here
CLOUDFLARE_ACCOUNT_ID=your_actual_account_id_here
MAIN_DOMAIN=ibuyscrap.ca
```

## **🔧 Step 3: Test Cloudflare Connection**

Create a test script to verify your Cloudflare setup:

```javascript
// test-cloudflare-connection.js
const CloudflareService = require('./backend/src/services/cloudflareService').default;

async function testCloudflare() {
    console.log('🧪 Testing Cloudflare connection...');
    
    const cloudflare = CloudflareService.getInstance();
    
    try {
        const isConnected = await cloudflare.testConnection();
        if (isConnected) {
            console.log('✅ Cloudflare connection successful!');
            
            // Test creating a DNS record
            const testRecord = await cloudflare.createDNSRecord({
                type: 'A',
                name: 'test-subdomain',
                content: '52.15.148.97',
                proxied: true,
                ttl: 1
            });
            
            console.log('✅ DNS record creation test successful!');
            console.log('Record ID:', testRecord.id);
            
            // Clean up test record
            await cloudflare.deleteDNSRecord(testRecord.id);
            console.log('✅ Test record cleaned up');
            
        } else {
            console.log('❌ Cloudflare connection failed');
        }
    } catch (error) {
        console.error('❌ Cloudflare test failed:', error.message);
    }
}

testCloudflare();
```

Run the test:
```bash
node test-cloudflare-connection.js
```

## **🔧 Step 4: Configure Your Main Domain**

### **4.1 DNS Records for Main Domain**
Ensure your main domain (`ibuyscrap.ca`) has these DNS records in Cloudflare:

```
Type    Name                Content
A       @                   52.15.148.97
A       www                 52.15.148.97
CNAME   api                 ec2-52-15-148-97.us-east-2.compute.amazonaws.com
```

### **4.2 SSL Configuration**
1. In Cloudflare Dashboard → SSL/TLS → Overview
2. Set encryption mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "HTTP Strict Transport Security (HSTS)"

## **🔧 Step 5: Tenant Domain Setup**

### **5.1 For Tenant Domains (e.g., honeynwild.com)**

When you create a tenant with domain `honeynwild.com`, the system will:

1. **Create DNS Records**:
   ```
   Type    Name                Content
   CNAME   @                   ec2-52-15-148-97.us-east-2.compute.amazonaws.com
   CNAME   www                 ec2-52-15-148-97.us-east-2.compute.amazonaws.com
   ```

2. **Configure SSL**: Automatic SSL certificate via Cloudflare

3. **Set up Caching**: Optimized caching rules for tenant content

### **5.2 Manual Setup (if automation fails)**

If automatic setup fails, manually add these DNS records in Cloudflare:

1. Go to Cloudflare Dashboard
2. Add the tenant domain as a new site
3. Add DNS records:
   - Type: `CNAME`
   - Name: `@`
   - Content: `ec2-52-15-148-97.us-east-2.compute.amazonaws.com`
   - Proxy: ✅ (Orange cloud)
   - TTL: Auto

## **🔧 Step 6: Test Multi-Tenant Setup**

### **6.1 Create a Test Tenant**
Use your Super Admin panel to create a tenant with a test domain.

### **6.2 Verify DNS Propagation**
```bash
# Check if DNS is working
nslookup your-tenant-domain.com
dig your-tenant-domain.com
```

### **6.3 Test Tenant Access**
1. Visit `https://your-tenant-domain.com/immigration-portal/login`
2. Should show the tenant login page
3. API calls should work: `https://your-tenant-domain.com/api/v1/tenant/info`

## **🔧 Step 7: Advanced Cloudflare Configuration**

### **7.1 Page Rules for Tenants**
Create page rules for better performance:

1. Go to Cloudflare Dashboard → Rules → Page Rules
2. Create rule: `your-tenant-domain.com/immigration-portal/*`
3. Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   - Browser Cache TTL: 1 month

### **7.2 Security Rules**
1. Go to Security → WAF
2. Create custom rules for tenant domains
3. Block malicious requests
4. Rate limiting per IP

### **7.3 Analytics**
1. Enable Cloudflare Analytics
2. Monitor tenant domain performance
3. Set up alerts for issues

## **🔧 Step 8: Troubleshooting**

### **Common Issues:**

#### **Issue 1: DNS Not Propagating**
- **Solution**: Wait 5-10 minutes, check with `dig` command
- **Check**: Ensure DNS records are set to "Proxied" (orange cloud)

#### **Issue 2: SSL Certificate Issues**
- **Solution**: Ensure domain is fully proxied through Cloudflare
- **Check**: SSL/TLS → Edge Certificates → Always Use HTTPS

#### **Issue 3: API Calls Failing**
- **Solution**: Check CORS settings and proxy headers
- **Check**: Ensure `/api/v1/` paths are correctly configured

#### **Issue 4: Tenant Login Not Working**
- **Solution**: Verify tenant domain is in database
- **Check**: Backend logs for tenant resolution errors

### **Debug Commands:**

```bash
# Check DNS resolution
dig your-tenant-domain.com
nslookup your-tenant-domain.com

# Check SSL certificate
curl -I https://your-tenant-domain.com

# Test API endpoint
curl https://your-tenant-domain.com/api/v1/tenant/info

# Check backend logs
pm2 logs immigration-backend
```

## **🔧 Step 9: Production Checklist**

- [ ] Cloudflare API credentials configured
- [ ] Main domain DNS records set
- [ ] SSL certificates active
- [ ] Tenant creation tested
- [ ] DNS propagation verified
- [ ] SSL/TLS settings optimized
- [ ] Caching rules configured
- [ ] Security rules active
- [ ] Analytics enabled
- [ ] Monitoring alerts set up

## **📞 Support**

If you encounter issues:

1. Check Cloudflare Dashboard for errors
2. Review backend logs: `pm2 logs immigration-backend`
3. Test DNS resolution with `dig` command
4. Verify SSL certificate status
5. Check Nginx configuration: `sudo nginx -t`

## **🎉 Success!**

Once configured, your multi-tenant system will automatically:
- Create DNS records for new tenants
- Set up SSL certificates
- Configure caching and security
- Enable tenant-specific routing

Your tenants can now access their portals at:
- `https://tenant-domain.com/immigration-portal/login`
- `https://tenant-domain.com/immigration-portal/dashboard`
