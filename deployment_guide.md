# 🚀 Immigration Portal - Deployment Guide

## 📋 Table of Contents
- [Deployment Strategy](#deployment-strategy)
- [GitHub Secrets Setup](#github-secrets-setup)
- [Automated Deployment](#automated-deployment)
- [Manual Deployment](#manual-deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Deployment Strategy

### **Hybrid Approach (Recommended)**

#### **Primary: Automated GitHub Actions Deployment**
- ✅ **Automatic** on push to `main` branch
- ✅ **Testing included** before deployment
- ✅ **Secure** environment variable management
- ✅ **Rollback capability** built-in
- ✅ **Team collaboration** friendly

#### **Backup: Manual Deployment Script**
- ✅ **Emergency deployments** when needed
- ✅ **Feature testing** before merging
- ✅ **Manual control** for debugging
- ✅ **Local testing** capabilities

---

## 🔐 GitHub Secrets Setup

### **Required Secrets (23 total)**

Go to: **https://github.com/askeywa/Immigration/settings/secrets/actions**

#### **🌐 EC2 Connection Secrets**
| Secret Name | Value |
|-------------|-------|
| `EC2_HOST` | `52.15.148.97` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | `[Your existing SSH private key]` |

#### **🗄️ Database Secrets**
| Secret Name | Value |
|-------------|-------|
| `MONGODB_URI` | `mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/?retryWrites=true&w=majority&appName=RCICDB` |

#### **🔐 Authentication Secrets**
| Secret Name | Value |
|-------------|-------|
| `JWT_SECRET` | `3fc9908663650cc993389d8b02330b90dbe6d977966266ea34482690fdac889556936a69507fe97554e3824b1e60eb92a6a448bbda9c1bf1119bfb9e1a779b03` |
| `JWT_REFRESH_SECRET` | `35009599e94ff03ade8fdc7349914f3261f45c27ab872fcc5923846f2f458a67b93e146e4d059ed41f36faa6cb01071edfd989c7d8664f249720779c7f472547` |
| `JWT_EXPIRES_IN` | `7d` |

#### **🌐 Frontend Secrets**
| Secret Name | Value |
|-------------|-------|
| `FRONTEND_URL` | `https://ibuyscrap.ca` |

#### **📊 Monitoring Secrets**
| Secret Name | Value |
|-------------|-------|
| `NEW_RELIC_LICENSE_KEY` | `e2144a7161536cb2269f19949e3aac45FFFFNRAL` |
| `NEW_RELIC_APP_NAME` | `Immigration portal` |

#### **🌐 Domain Configuration Secrets**
| Secret Name | Value |
|-------------|-------|
| `SUPER_ADMIN_DOMAIN` | `ibuyscrap.ca` |
| `API_BASE_URL` | `ibuyscrap.ca` |
| `EC2_PUBLIC_IP` | `52.15.148.97` |
| `EC2_PRIVATE_IP` | `172.31.40.28` |
| `EC2_PUBLIC_DNS` | `ec2-52-15-148-97.us-east-2.compute.amazonaws.com` |

#### **☁️ Cloudflare Secrets**
| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | `FGY_I4SS6_A3uGlVSDXqHg0DWPWoCtGaCenkfBLS` |
| `CLOUDFLARE_ZONE_ID` | `bdc93396cd264113ca7153928eb5edec` |
| `CLOUDFLARE_ACCOUNT_ID` | `ca3ee75e77d3484f27e24473b3100230` |
| `MAIN_DOMAIN` | `ibuyscrap.ca` |

#### **🔧 Application Configuration Secrets**
| Secret Name | Value |
|-------------|-------|
| `TENANT_DOMAIN_PREFIX` | `immigration-portal` |
| `APP_NAME` | `Immigration Portal` |
| `ALLOW_START_WITHOUT_DB` | `false` |

#### **⚡ Rate Limiting Secrets**
| Secret Name | Value |
|-------------|-------|
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `1000` |

#### **🗄️ Redis Configuration Secrets**
| Secret Name | Value |
|-------------|-------|
| `REDIS_ENABLED` | `true` |
| `REDIS_URL` | `redis://localhost:6379` |

### **How to Add Secrets**
1. Go to GitHub repository settings
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret name and value from the tables above
5. Save each secret

---

## 🤖 Automated Deployment

### **How It Works**
1. **Push to main branch** → Triggers deployment
2. **Tests run** → Builds and tests both frontend and backend
3. **Deploy job** → Only runs if tests pass
4. **Environment setup** → Creates production .env from secrets
5. **Deployment** → Copies files and restarts services

### **Deployment Process**
```bash
# 1. Tests run automatically
npm ci (backend)
npm ci (frontend)
npm run build (backend)
npm run build (frontend)

# 2. If tests pass, deployment begins
# 3. Environment file created from GitHub secrets
# 4. Files copied to EC2 server
# 5. Services restarted with PM2
```

### **Monitoring Deployment**
- **GitHub Actions tab** → View deployment progress
- **EC2 server logs** → Monitor application startup
- **Application health** → Check endpoints

---

## 🛠️ Manual Deployment

### **When to Use Manual Deployment**
- 🔧 **Emergency fixes** - Deploy immediately
- 🧪 **Feature testing** - Test before merging
- 🐛 **Debugging** - Manual control needed
- 🔄 **Rollback** - Revert to previous version

### **Manual Deployment Commands**
```bash
# Run deployment script
./deploy.sh

# Or with specific options
./deploy.sh --backup --restart

# Check deployment status
pm2 status

# View logs
pm2 logs immigration-portal
```

### **Manual Deployment Features**
- ✅ **Backup creation** - Automatic backup before deployment
- ✅ **Rollback capability** - Easy revert to previous version
- ✅ **Service management** - PM2 process management
- ✅ **Health checks** - Verify deployment success

---

## 🔧 Deployment Files Structure

```
.github/workflows/
├── deploy.yml              # Active automated deployment
└── deploy-backup.yml       # Backup of previous workflow

deploy.sh                   # Manual deployment script
env.production.template     # Template for production environment
ecosystem.config.js         # PM2 configuration
```

---

## 🚨 Troubleshooting

### **Common Issues**

#### **1. GitHub Actions Deployment Fails**
**Problem:** Tests fail or deployment errors
**Solution:**
```bash
# Check GitHub Actions logs
# Verify all secrets are set correctly
# Test locally first
npm run build
```

#### **2. Manual Deployment Issues**
**Problem:** deploy.sh script fails
**Solution:**
```bash
# Check SSH connection
ssh ubuntu@52.15.148.97

# Verify file permissions
chmod +x deploy.sh

# Check EC2 disk space
df -h
```

#### **3. Application Won't Start**
**Problem:** PM2 fails to start application
**Solution:**
```bash
# Check PM2 logs
pm2 logs immigration-portal

# Restart PM2
pm2 restart immigration-portal

# Check environment variables
cat /home/ubuntu/app/backend/.env
```

#### **4. Database Connection Issues**
**Problem:** MongoDB connection fails
**Solution:**
```bash
# Check MongoDB URI in .env
# Verify network connectivity
# Check MongoDB Atlas whitelist
```

### **Emergency Procedures**

#### **Quick Rollback**
```bash
# Manual rollback using deploy.sh
./deploy.sh --rollback

# Or restore from backup
sudo cp -r /var/backups/immigration-portal-YYYYMMDD_HHMMSS/* /home/ubuntu/app/
pm2 restart immigration-portal
```

#### **Health Check**
```bash
# Check application health
curl https://ibuyscrap.ca/api/health

# Check tenant access
curl https://honeynwild.com/immigration-portal/api/v1/health
```

---

## 📊 Deployment Monitoring

### **Success Indicators**
- ✅ **GitHub Actions** - Green checkmark
- ✅ **Application logs** - No errors
- ✅ **Health endpoints** - Returning 200 OK
- ✅ **Tenant access** - Login working
- ✅ **Super admin access** - Dashboard accessible

### **Monitoring Tools**
- **GitHub Actions** - Deployment status
- **PM2** - Process monitoring
- **New Relic** - Application performance
- **MongoDB Atlas** - Database monitoring

---

## 🎯 Best Practices

### **Before Deployment**
1. ✅ **Test locally** - Ensure everything works
2. ✅ **Update secrets** - Add any new environment variables
3. ✅ **Check dependencies** - Verify package versions
4. ✅ **Review changes** - Understand what's being deployed

### **After Deployment**
1. ✅ **Verify health** - Check all endpoints
2. ✅ **Test functionality** - Login and basic operations
3. ✅ **Monitor logs** - Watch for errors
4. ✅ **Update documentation** - Record any changes

### **Team Collaboration**
1. ✅ **Use feature branches** - Don't deploy directly to main
2. ✅ **Code reviews** - Review changes before merging
3. ✅ **Test environments** - Use staging for testing
4. ✅ **Documentation** - Keep deployment docs updated

---

## 🎉 Deployment Complete!

Your Immigration Portal now has:
- ✅ **Automated deployments** via GitHub Actions
- ✅ **Manual deployment** capability for emergencies
- ✅ **Secure secret management** via GitHub
- ✅ **Professional CI/CD pipeline**
- ✅ **Rollback and monitoring** capabilities

**Ready for production!** 🚀