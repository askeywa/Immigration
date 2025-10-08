# 🎯 MULTI-DOMAIN TENANT AUTHENTICATION - IMPLEMENTATION GUIDE

## ✅ COMPLETED STEPS

### 1. Tenant Model Updated (✅ DONE)
- Added `customDomains: string[]` field
- Added `domainApprovals` array for approval workflow
- Added indexes for domain lookups
- Added `getAllTrustedDomains()` method
- Added `hasDomainAccess(domain)` method
- Added `trustedDomains` virtual property

**File**: `backend/src/models/Tenant.ts`

---

## 🚀 REMAINING IMPLEMENTATION STEPS

### 2. Create Enhanced Tenant Resolution Middleware

**Create New File**: `backend/src/middleware/enhancedTenantResolution.ts`

**Source**: Copy from `tenant_Login_Fixes/enhancedTenantResolution.ts`

**Key Features**:
- Multi-domain support (checks both `domain` and `customDomains`)
- In-memory cache for performance (5-minute TTL)
- Proper header priority: `x-tenant-domain` > `x-original-host` > `host`
- Debug logging for troubleshooting
- Cache management (auto-cleanup)

---

### 3. Create Dynamic CORS Middleware

**Create New File**: `backend/src/middleware/dynamicCorsSecurity.ts`

**Source**: Copy from `tenant_Login_Fixes/dynamicCorsSecurity.ts`

**Key Features**:
- Fetches trusted domains from database
- Caches trusted domains (5-minute TTL)
- Includes both HTTP and HTTPS variants
- Includes localhost for development
- Auto-refreshes cache
- Exposes custom headers (`X-Tenant-Domain`, `X-Domain-Match-Type`, etc.)

---

### 4. Update Server Configuration

**File**: `backend/src/server.ts`

**Changes Needed**:

```typescript
// REMOVE old imports:
// import { corsSecurity } from './middleware/securityHardening';
// import { resolveTenant } from './middleware/tenantResolution';

// ADD new imports:
import { dynamicCorsSecurity } from './middleware/dynamicCorsSecurity';
import { resolveTenantEnhanced } from './middleware/enhancedTenantResolution';

// REPLACE:
// app.use(corsSecurity());
// WITH:
app.use(dynamicCorsSecurity()); // Must be FIRST middleware

// DO NOT use app.use(resolveTenantEnhanced) globally
// It's already applied in individual routes that need it
```

---

### 5. Update Route Files

**Files to Update**:
- `backend/src/routes/authRoutes.ts`
- `backend/src/routes/tenantApiRoutes.ts`

**Change**:
```typescript
// OLD:
import { resolveTenant } from '../middleware/tenantResolution';

// NEW:
import { resolveTenantEnhanced as resolveTenant } from '../middleware/enhancedTenantResolution';

// Routes stay the same - just using new middleware
```

---

### 6. Create Database Migration Script

**Create New File**: `backend/src/scripts/migrate-tenant-domains.ts`

```typescript
import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function migrateTenantDomains() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || '';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Add customDomains and domainApprovals fields to all tenants
    const result = await Tenant.updateMany(
      {
        customDomains: { $exists: false }
      },
      {
        $set: {
          customDomains: [],
          domainApprovals: []
        }
      }
    );

    console.log(`✅ Migration complete: ${result.modifiedCount} tenants updated`);

    // For Honey & Wild specifically, add their custom domain
    const honeynwild = await Tenant.findOne({ 
      $or: [
        { domain: /honeynwild/i },
        { name: /honey.*wild/i }
      ]
    });
    
    if (honeynwild) {
      // Check if honeynwild.com is already in customDomains
      if (!honeynwild.customDomains.includes('honeynwild.com')) {
        honeynwild.customDomains.push('honeynwild.com');
      }
      
      // Check if approval already exists
      const approvalExists = honeynwild.domainApprovals.some(
        (approval: any) => approval.domain === 'honeynwild.com'
      );
      
      if (!approvalExists) {
        honeynwild.domainApprovals.push({
          domain: 'honeynwild.com',
          status: 'approved',
          requestedAt: new Date(),
          approvedAt: new Date(),
        });
      }
      
      await honeynwild.save();
      console.log('✅ Honey & Wild domain approved:', {
        _id: honeynwild._id,
        name: honeynwild.name,
        domain: honeynwild.domain,
        customDomains: honeynwild.customDomains
      });
    } else {
      console.log('⚠️  Honey & Wild tenant not found in database');
    }

    await mongoose.disconnect();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateTenantDomains();
```

**Run this script**:
```bash
cd backend
npx tsx src/scripts/migrate-tenant-domains.ts
```

---

## 🔧 DEPLOYMENT STEPS

### Step 1: Build Backend
```bash
cd backend
npm run build
```

### Step 2: Run Migration
```bash
npx tsx src/scripts/migrate-tenant-domains.ts
```

### Step 3: Deploy & Restart
```bash
git add .
git commit -m "Implement multi-domain tenant authentication system"
git push origin main

# Backend will auto-deploy via GitHub Actions
# Monitor deployment logs
```

### Step 4: Verify
```bash
# Test 1: Super admin login
curl https://ibuyscrap.ca/api/health

# Test 2: Tenant domain resolution  
curl -H "X-Tenant-Domain: honeynwild.com" \
     https://ibuyscrap.ca/api/v1/tenant/info

# Test 3: Login from client domain
# Open https://honeynwild.com/immigration-portal/login
# Click Sign In
# Should redirect to https://ibuyscrap.ca/auth-callback?data=...
```

---

## 🎯 EXPECTED RESULTS

### Before Implementation:
❌ honeynwild.com login fails with "Validation Error"
❌ Backend rejects requests from honeynwild.com
❌ CORS blocks honeynwild.com requests

### After Implementation:
✅ honeynwild.com login succeeds
✅ Backend resolves honeynwild.com to Honey & Wild tenant
✅ CORS allows honeynwild.com requests
✅ Auth data transfers via URL
✅ Redirects to tenant dashboard with proper context

---

## 🐛 TROUBLESHOOTING

### Issue 1: "Tenant not found for domain"
**Cause**: Domain not in `customDomains` array
**Fix**: Run migration script again or manually add:
```javascript
db.tenants.updateOne(
  { name: "Honey & Wild" },
  { $addToSet: { customDomains: "honeynwild.com" } }
)
```

### Issue 2: CORS errors
**Cause**: Domain cache not refreshed
**Solution**: Wait 5 minutes for auto-refresh or restart backend

### Issue 3: Still getting validation errors
**Cause**: Old middleware still in use
**Fix**: Verify imports in `authRoutes.ts` and `tenantApiRoutes.ts` use `resolveTenantEnhanced`

---

## 📝 NEXT STEPS AFTER TESTING

1. ✅ Verify super admin login still works
2. ✅ Test honeynwild.com tenant login
3. ✅ Check browser console for errors
4. ✅ Verify tenant dashboard shows correct context
5. 🚀 Add more client domains as needed

---

## 🔐 SECURITY NOTES

- All domains must be explicitly added to `customDomains` array
- Domain approval workflow is in place but not enforced (all approved by default in migration)
- CORS cache refreshes every 5 minutes
- Tenant cache refreshes every 5 minutes
- Only active/trial tenants can authenticate

---

## 📞 SUPPORT

If you encounter issues:
1. Check backend logs: `pm2 logs immigration-portal`
2. Check browser console
3. Test with curl commands provided above
4. Verify database has correct `customDomains` array


