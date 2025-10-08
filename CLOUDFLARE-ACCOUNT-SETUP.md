# Cloudflare Account Setup Guide

## **🎯 Step 1: Create Free Cloudflare Account**

### **1.1 Sign Up for Cloudflare**
1. Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Enter your email address
3. Create a strong password
4. Click "Create Account"
5. Verify your email address

### **1.2 Add Your Domain to Cloudflare**
1. After logging in, click "Add a Site"
2. Enter your domain: `ibuyscrap.ca` (or your main domain)
3. Choose the **FREE** plan (no credit card required)
4. Click "Add Site"

### **1.3 Update Your Domain's Nameservers**
Cloudflare will provide you with nameservers like:
```
ns1.cloudflare.com
ns2.cloudflare.com
```

**You need to update these in your domain registrar (where you bought ibuyscrap.ca):**
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS/Nameserver settings
3. Replace existing nameservers with Cloudflare's nameservers
4. Save changes

**⚠️ Important**: This step is crucial! Your domain must use Cloudflare's nameservers.

### **1.4 Wait for DNS Propagation**
- This can take 5-30 minutes
- You can check status at [https://dnschecker.org](https://dnschecker.org)
- Enter your domain and check if it shows Cloudflare nameservers

## **🎯 Step 2: Get Cloudflare API Credentials**

### **2.1 Get API Token**
1. Go to [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Click "Custom token"
4. Fill in the form:
   - **Token name**: `Immigration Portal API`
   - **Permissions**: 
     - `Zone:Zone:Read`
     - `Zone:DNS:Edit`
     - `Zone:Page Rules:Edit`
   - **Zone Resources**: Include specific zone → Select your domain
   - **Account Resources**: Include specific account → Select your account
5. Click "Continue to summary"
6. Click "Create Token"
7. **⚠️ IMPORTANT**: Copy the token immediately (you won't see it again!)

### **2.2 Get Zone ID**
1. Go to your domain dashboard in Cloudflare
2. Scroll down to "API" section on the right sidebar
3. Copy the "Zone ID" (looks like: `abc123def456ghi789`)

### **2.3 Get Account ID**
1. In the same API section
2. Copy the "Account ID" (looks like: `1234567890abcdef`)

## **🎯 Step 3: Configure DNS Records**

### **3.1 Add Basic DNS Records**
In Cloudflare Dashboard → DNS → Records:

1. **A Record for Root Domain**:
   - Type: `A`
   - Name: `@`
   - IPv4 address: `52.15.148.97` (your EC2 IP)
   - Proxy status: ✅ (Orange cloud)
   - TTL: Auto

2. **A Record for WWW**:
   - Type: `A`
   - Name: `www`
   - IPv4 address: `52.15.148.97`
   - Proxy status: ✅ (Orange cloud)
   - TTL: Auto

3. **CNAME Record for API** (Optional):
   - Type: `CNAME`
   - Name: `api`
   - Target: `ec2-52-15-148-97.us-east-2.compute.amazonaws.com`
   - Proxy status: ✅ (Orange cloud)
   - TTL: Auto

### **3.2 Configure SSL/TLS**
1. Go to SSL/TLS → Overview
2. Set encryption mode to "Full (strict)"
3. Go to SSL/TLS → Edge Certificates
4. Enable "Always Use HTTPS"
5. Enable "HTTP Strict Transport Security (HSTS)"

## **🎯 Step 4: Test Your Setup**

### **4.1 Verify DNS Propagation**
```bash
# Check if your domain points to Cloudflare
dig ibuyscrap.ca
nslookup ibuyscrap.ca
```

### **4.2 Test SSL Certificate**
Visit: `https://ibuyscrap.ca` (should show Cloudflare SSL certificate)

### **4.3 Check Cloudflare Analytics**
Go to Analytics → Overview to see traffic data

## **🎯 Step 5: Environment Variables**

Add these to your `backend/.env`:

```env
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_actual_token_here
CLOUDFLARE_ZONE_ID=your_actual_zone_id_here
CLOUDFLARE_ACCOUNT_ID=your_actual_account_id_here
MAIN_DOMAIN=ibuyscrap.ca
```

## **🎯 Step 6: Test Cloudflare Integration**

Create a test script:

```javascript
// test-cloudflare.js
const CloudflareService = require('./backend/src/services/cloudflareService').default;

async function testCloudflare() {
    console.log('🧪 Testing Cloudflare connection...');
    
    const cloudflare = CloudflareService.getInstance();
    
    try {
        const isConnected = await cloudflare.testConnection();
        if (isConnected) {
            console.log('✅ Cloudflare connection successful!');
        } else {
            console.log('❌ Cloudflare connection failed');
        }
    } catch (error) {
        console.error('❌ Cloudflare test failed:', error.message);
    }
}

testCloudflare();
```

Run: `node test-cloudflare.js`

## **🎯 Troubleshooting**

### **Common Issues:**

1. **"Invalid API token"**
   - Check token permissions
   - Ensure token has Zone:Read and DNS:Edit permissions

2. **"Zone not found"**
   - Verify Zone ID is correct
   - Ensure domain is added to Cloudflare

3. **"DNS not propagating"**
   - Check nameservers are updated at domain registrar
   - Wait 5-30 minutes for propagation

4. **"SSL certificate issues"**
   - Ensure domain is fully proxied (orange cloud)
   - Check SSL/TLS settings

## **🎯 Next Steps**

Once Cloudflare is working:
1. Test tenant creation through your Super Admin panel
2. Verify DNS records are created automatically
3. Test tenant login at their custom domain
4. Monitor Cloudflare analytics for traffic

## **💡 Pro Tips**

- **Free Plan**: Cloudflare's free plan includes SSL, CDN, and basic security
- **DNS Management**: All DNS changes now happen in Cloudflare dashboard
- **Performance**: Your site will be faster due to Cloudflare's global CDN
- **Security**: Automatic DDoS protection and security features
- **Analytics**: Monitor traffic and performance in Cloudflare dashboard
