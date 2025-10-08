# Redis Configuration Fix - Complete Solution

## Problem Analysis
Your Redis connection issue occurs because:
1. **Local development**: `NODE_ENV=development` → connects to single Redis instance
2. **Production deployment**: `NODE_ENV=production` → tries to connect to Redis cluster nodes that don't exist

## Solution: Update Your Configuration

### 1. Update Your Local .env File
Your local `.env` file is already correct with `NODE_ENV=development`, but ensure these Redis settings:

```env
NODE_ENV=development
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=Qwsaqwsa!@34
```

### 2. Update GitHub Secrets
You need to add these secrets to your GitHub repository:

**Go to: GitHub Repository → Settings → Secrets and variables → Actions**

Add these new secrets:
- `NODE_ENV` = `development` (for EC2 production environment)
- `REDIS_CLUSTER_MODE` = `false` (to force single instance mode)

### 3. Update GitHub Actions Workflow
Update your `.github/workflows/deploy.yml` file:

```yaml
# In the "Create Production Environment File" section, add:
NODE_ENV: ${{ secrets.NODE_ENV || 'development' }}
REDIS_CLUSTER_MODE: ${{ secrets.REDIS_CLUSTER_MODE || 'false' }}

# In the env.production file creation, add:
NODE_ENV=${{ secrets.NODE_ENV || 'development' }}
REDIS_CLUSTER_MODE=${{ secrets.REDIS_CLUSTER_MODE || 'false' }}
```

### 4. Update Redis Configuration Code
Modify `backend/src/config/redis-cluster.ts` to be more flexible:

```typescript
// Replace the getClusterConfig method with:
getClusterConfig(): RedisClusterConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const clusterMode = process.env.REDIS_CLUSTER_MODE === 'true';
  
  // Force single instance mode if REDIS_CLUSTER_MODE is false
  if (!clusterMode) {
    return {
      nodes: [{ host: 'localhost', port: 6379 }],
      options: {
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
          connectTimeout: 5000,
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          keepAlive: 30000,
          family: 4,
          db: 0
        },
        enableOfflineQueue: false
      }
    };
  }

  // Original cluster logic for when cluster mode is enabled
  if (isProduction && clusterMode) {
    // ... existing cluster configuration
  } else {
    // ... existing development configuration
  }
}
```

## Quick Fix (Immediate Solution)

### Option 1: Update GitHub Secrets (Recommended)
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add new secret: `NODE_ENV` = `development`
4. This will make your EC2 instance use development mode for Redis

### Option 2: Update Deploy Script
Add this line to your GitHub Actions deploy script before starting PM2:

```bash
# Force development mode for Redis
echo "NODE_ENV=development" >> /var/www/immigration-portal/backend/.env
```

## Verification Steps

After implementing the fix:

1. **Check Redis Status**:
   ```bash
   ssh -i "your-key.pem" ubuntu@your-ec2 "redis-cli -a 'Qwsaqwsa!@34' ping"
   ```

2. **Check Application Logs**:
   ```bash
   ssh -i "your-key.pem" ubuntu@your-ec2 "pm2 logs immigration-portal --lines 50"
   ```

3. **Test Performance Dashboard**:
   - Visit your Performance Dashboard
   - Redis should show "✅ Connected" instead of "❌ Disconnected"

## Why This Happens

The issue occurs because:
- Your local development uses `NODE_ENV=development` → single Redis instance
- Your production deployment uses `NODE_ENV=production` → tries Redis cluster
- Your EC2 instance only has a single Redis instance, not a cluster
- The Redis cluster configuration tries to connect to non-existent cluster nodes

## Prevention

This fix ensures:
1. **Consistent behavior** between local and production
2. **No more Redis connection issues** after deployments
3. **Proper Redis configuration** for your single-instance setup
4. **Future deployments** will work automatically

## Next Steps

1. Update your GitHub secrets with `NODE_ENV=development`
2. Push your code to trigger a new deployment
3. Verify Redis is working in the Performance Dashboard
4. No more manual Redis fixes needed!
