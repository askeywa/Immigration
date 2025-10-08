# GitHub Actions Secrets and Variables - Complete Values

## **🔐 Go to: https://github.com/askeywa/Immigration/settings/secrets/actions**

**Update these secrets with the following values:**

---

## **🌐 EC2 Connection Secrets**

| Secret Name | Value |
|-------------|-------|
| `EC2_HOST` | `18.220.224.109` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | `[Your existing SSH private key]` |

---

## **🗄️ Database Secrets**

| Secret Name | Value |
|-------------|-------|
| `MONGODB_URI` | `mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/?retryWrites=true&w=majority&appName=RCICDB` |

---

## **🔐 Authentication Secrets**

| Secret Name | Value |
|-------------|-------|
| `JWT_SECRET` | `3fc9908663650cc993389d8b02330b90dbe6d977966266ea34482690fdac889556936a69507fe97554e3824b1e60eb92a6a448bbda9c1bf1119bfb9e1a779b03` |
| `JWT_REFRESH_SECRET` | `35009599e94ff03ade8fdc7349914f3261f45c27ab872fcc5923846f2f458a67b93e146e4d059ed41f36faa6cb01071edfd989c7d8664f249720779c7f472547` |

---

## **🌐 Frontend Secrets**

| Secret Name | Value |
|-------------|-------|
| `FRONTEND_URL` | `https://ibuyscrap.ca` |

---

## **📊 Monitoring Secrets**

| Secret Name | Value |
|-------------|-------|
| `NEW_RELIC_LICENSE_KEY` | `e2144a7161536cb2269f19949e3aac45FFFFNRAL` |
| `NEW_RELIC_APP_NAME` | `Immigration portal` |

---

## **🌐 Domain Configuration Secrets**

| Secret Name | Value |
|-------------|-------|
| `SUPER_ADMIN_DOMAIN` | `ibuyscrap.ca` |
| `API_BASE_URL` | `ibuyscrap.ca` |
| `EC2_PUBLIC_IP` | `18.220.224.109` |
| `EC2_PRIVATE_IP` | `172.31.40.28` |
| `EC2_PUBLIC_DNS` | `ec2-18-220-224-109.us-east-2.compute.amazonaws.com` |

---

## **☁️ Cloudflare Secrets**

| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | `FGY_I4SS6_A3uGlVSDXqHg0DWPWoCtGaCenkfBLS` |
| `CLOUDFLARE_ZONE_ID` | `bdc93396cd264113ca7153928eb5edec` |
| `CLOUDFLARE_ACCOUNT_ID` | `ca3ee75e77d3484f27e24473b3100230` |
| `MAIN_DOMAIN` | `ibuyscrap.ca` |

---

## **🔧 Application Configuration Secrets**

| Secret Name | Value |
|-------------|-------|
| `TENANT_DOMAIN_PREFIX` | `immigration-portal` |
| `JWT_EXPIRES_IN` | `7d` |
| `APP_NAME` | `Immigration Portal` |
| `ALLOW_START_WITHOUT_DB` | `false` |

---

## **⚡ Rate Limiting Secrets**

| Secret Name | Value |
|-------------|-------|
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `1000` |

---

## **🗄️ Redis Configuration Secrets**

| Secret Name | Value |
|-------------|-------|
| `REDIS_ENABLED` | `true` |
| `REDIS_URL` | `redis://localhost:6379` |
| `REDIS_PASSWORD` | `Qwsaqwsa!@34` |

---

## **📊 Sentry Configuration Secrets**

| Secret Name | Value |
|-------------|-------|
| `SENTRY_DSN` | `https://1fed6693d06ca399d6d51b27adb20797@o4510120878145536.ingest.us.sentry.io/4510120957050880` |
| `SENTRY_RELEASE` | `1.0.0` |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` |
| `SENTRY_PROFILES_SAMPLE_RATE` | `0.1` |

---

## **📋 Summary**

- **Total Secrets:** 28
- **Last Updated:** October 2, 2025
- **Source:** Local .env files synchronized with production requirements

## **✅ Instructions**

1. Go to: https://github.com/askeywa/Immigration/settings/secrets/actions
2. Click "New repository secret" for each secret above
3. Use the exact values provided
4. Save each secret
5. Verify all 28 secrets are created

## **🚨 Important Notes**

- **DO NOT DELETE** any existing secrets without checking if they're used
- **DO NOT SHARE** these values publicly
- **KEEP BACKUP** of these values in a secure location
- These values are extracted from your current local .env files
- Perfect synchronization between local development and production deployment

---

**Generated on:** October 2, 2025  
**Project:** Immigration Portal  
**Environment:** Production EC2 Deployment
