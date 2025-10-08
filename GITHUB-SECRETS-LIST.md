# GitHub Secrets Required for Deployment

## **🔐 Current Secrets (Already Set)**
These secrets are already configured in your GitHub repository:

- `EC2_HOST` - Your EC2 instance IP address
- `EC2_USER` - SSH username (usually `ubuntu`)
- `EC2_SSH_KEY` - Private SSH key for EC2 access
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `FRONTEND_URL` - Frontend URL
- `NEW_RELIC_LICENSE_KEY` - New Relic license key
- `NEW_RELIC_APP_NAME` - New Relic application name
- `NEW_RELIC_ENABLED` - New Relic enabled flag

## **🆕 New Secrets to Add**

You need to add these new secrets to your GitHub repository:

### **Application Configuration**
- `TENANT_DOMAIN_PREFIX` - `immigration-portal`
- `JWT_EXPIRES_IN` - `7d`
- `APP_NAME` - `Immigration Portal`
- `ALLOW_START_WITHOUT_DB` - `false`

### **Rate Limiting Configuration**
- `RATE_LIMIT_WINDOW_MS` - `900000`
- `RATE_LIMIT_MAX_REQUESTS` - `1000`

### **Redis Configuration**
- `REDIS_ENABLED` - `true`
- `REDIS_URL` - `redis://localhost:6379`
- `REDIS_PASSWORD` - `Qwsaqwsa!@34`

### **Sentry Configuration**
- `SENTRY_DSN` - `https://1fed6693d06ca399d6d51b27adb20797@o4510120878145536.ingest.us.sentry.io/4510120957050880`
- `SENTRY_RELEASE` - `1.0.0`
- `SENTRY_TRACES_SAMPLE_RATE` - `0.1`
- `SENTRY_PROFILES_SAMPLE_RATE` - `0.1`

### **Cloudflare Configuration**
- `CLOUDFLARE_API_TOKEN` - `FGY_I4SS6_A3uGlVSDXqHg0DWPWoCtGaCenkfBLS`
- `CLOUDFLARE_ZONE_ID` - `bdc93396cd264113ca7153928eb5edec`
- `CLOUDFLARE_ACCOUNT_ID` - `ca3ee75e77d3484f27e24473b3100230`

### **EC2 Configuration**
- `EC2_PUBLIC_IP` - `52.15.148.97`
- `EC2_PRIVATE_IP` - `172.31.40.28`
- `EC2_PUBLIC_DNS` - `ec2-52-15-148-97.us-east-2.compute.amazonaws.com`

### **Domain Configuration**
- `SUPER_ADMIN_DOMAIN` - `ibuyscrap.ca`
- `MAIN_DOMAIN` - `ibuyscrap.ca`

### **API Configuration**
- `API_BASE_URL` - `ibuyscrap.ca`
- `TENANT_API_BASE_URL` - `https://{domain}/immigration-portal`
- `TENANT_API_VERSION` - `v1`

## **📝 How to Add Secrets**

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret name and value from the list above

## **📊 Summary**
- **Total Secrets:** 28 (including 4 new Sentry secrets)

## **🔧 Updated GitHub Actions Workflow**

The workflow will need to be updated to include these new secrets in the environment file creation.
