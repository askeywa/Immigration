I'll analyze your multi-tenant cross-domain authentication system and identify the core issues.
Core Problems Identified
After reviewing your architecture, here are the fundamental issues:
1. Missing Domain Trust System
Your biggest problem is that you have no formal system to register and trust client domains. When honeynwild.com tries to authenticate, your backend rejects it because:

config.ts only lists ibuyscrap.ca and localhost as trusted domains
securityHardening.ts CORS middleware has hardcoded allowed origins
tenantResolution.ts only checks against config.allowedSuperAdminDomains

2. Tenant Resolution Logic Flaw
Your tenantResolution.ts middleware:
typescriptconst isSuperAdminDomain = config.allowedSuperAdminDomains.some(...)
if (isSuperAdminDomain) {
  // Returns early - this is correct
}

// Then tries to find tenant by domain
const tenant = await resolveTenantByDomain(domain);
The problem: When honeynwild.com sends a request with X-Tenant-Domain: honeynwild.com header, the middleware tries to find a tenant with domain: "honeynwild.com" in your database. But your Tenant.ts model only stores ONE domain per tenant, and you likely registered this tenant with a subdomain format instead.
3. Database Schema Limitation
Your Tenant.ts model has:
typescriptdomain: {
  type: String,
  required: true,
  unique: true,
  // Only ONE domain per tenant
}
But you need to support MULTIPLE domains per tenant (their subdomain + their custom domain).
Recommended Solution Architecture
Here's a complete, production-ready workflow:
Phase 1: Database Schema UpdatesEnhanced Tenant Model with Multi-Domain SupportCode // backend/src/models/Tenant.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  domain: string; // Primary subdomain (e.g., "honeynwild.ibuyscrap.ca")
  customDomains: string[]; //Phase 2: Enhanced Tenant Resolution MiddlewareEnhanced Tenant Resolution with Domain TrustCode // backend/src/middleware/enhancedTenantResolution.ts
import { Request, Response, NextFunction } from 'express';
import { Tenant, ITenant } from '../models/Tenant';
import { ValidationError } from '../utils/errors';
import { config } from '../config/Phase 3: Dynamic CORS ConfigurationDynamic CORS with Tenant Domain TrustCode // backend/src/middleware/dynamicCorsSecur

ity.ts
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Tenant } from '../models/Tenant';
import { log } from '../utils/logger';

// Cache for trusted domains (rePhase 4: API Route Configuration Updates
Now update your server to use these new middlewares:
typescript// backend/src/server.ts

// Replace old CORS with dynamic CORS
import { dynamicCorsSecurity } from './middleware/dynamicCorsSecurity';
app.use(dynamicCorsSecurity());

// Replace old tenant resolution with enhanced version
import { resolveTenantEnhanced } from './middleware/enhancedTenantResolution';
app.use(resolveTenantEnhanced);

// Rest of your server configuration...
Phase 5: Tenant Admin Interface for Domain Management
Create an admin interface where tenants can request custom domain approval:Tenant Domain Management API RoutesCode // backend/src/routes/tenantDomainRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { resolveTenantEnhanced } from '../middleware/enhancedTenantResolution';
import { Tenant } from '../models/Tenant'Complete Workflow Summary
Step-by-Step Implementation

Update Database Schema

Add customDomains array to Tenant model
Add domainApprovals array for approval workflow


Replace Middleware

Replace tenantResolution.ts with enhancedTenantResolution.ts
Replace static CORS with dynamicCorsSecurity.ts


Register Honeynwild Domain

bash   # In MongoDB or via API
   db.tenants.updateOne(
     { name: "Honey & Wild" },
     { 
       $addToSet: { 
         customDomains: "honeynwild.com" 
       } 
     }
   )

Update Server Configuration

typescript   // server.ts
   import { dynamicCorsSecurity } from './middleware/dynamicCorsSecurity';
   import { resolveTenantEnhanced } from './middleware/enhancedTenantResolution';
   
   app.use(dynamicCorsSecurity()); // Before routes
   app.use(resolveTenRetryClaude does not have the ability to run the code it generates yet.DContinueEditContinuing Implementation Guide
Step 4: Update Server Configuration
typescript// backend/src/server.ts
import { dynamicCorsSecurity } from './middleware/dynamicCorsSecurity';
import { resolveTenantEnhanced } from './middleware/enhancedTenantResolution';
import tenantDomainRoutes from './routes/tenantDomainRoutes';

// Replace the old corsSecurity() call
app.use(dynamicCorsSecurity()); // This must be BEFORE other middleware

// Replace the old resolveTenant middleware with enhanced version
// Remove any existing app.use(resolveTenant) calls

// Add tenant domain management routes
app.use('/api/tenant/domains', tenantDomainRoutes);

// Your existing routes continue as normal
app.use('/api/auth', authRoutes);
// ... rest of your routes
Step 5: Database Migration Script
Create a migration script to add customDomains field to existing tenants:
typescript// backend/src/scripts/migrateTenantDomains.ts
import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant';
import { config } from '../config/config';

async function migrateTenantDomains() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to database');

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

    console.log(`Migration complete: ${result.modifiedCount} tenants updated`);

    // For Honey & Wild specifically, add their custom domain
    const honeynwild = await Tenant.findOne({ domain: /honeynwild/i });
    if (honeynwild) {
      honeynwild.customDomains.push('honeynwild.com');
      honeynwild.domainApprovals.push({
        domain: 'honeynwild.com',
        status: 'approved',
        requestedAt: new Date(),
        approvedAt: new Date(),
      });
      await honeynwild.save();
      console.log('Honey & Wild domain approved');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateTenantDomains();
Run this script:
bashnpx tsx backend/src/scripts/migrateTenantDomains.ts
Step 6: Update Client Login Page
Your immigration-portal-login-production.html needs one small fix. The current code is mostly correct, but ensure the headers are properly set:
javascript// In immigration-portal-login-production.html
const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Domain': TENANT_DOMAIN,  // This is critical
        'X-Original-Host': TENANT_DOMAIN   // Backup header
    },
    body: JSON.stringify({
        email: email,
        password: password
        // Remove tenantDomain from body - it's in headers now
    })
});
Testing Checklist
Phase 1: Super Admin Login (Already Working)
bash# Test at https://ibuyscrap.ca/login
# Credentials: your super admin email/password
# Expected: Should work as before
Phase 2: Tenant Domain Resolution
bash# Test domain resolution endpoint
curl -H "X-Tenant-Domain: honeynwild.com" \
     https://ibuyscrap.ca/api/v1/tenant/info

# Expected Response:
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Honey & Wild",
    "domain": "honeynwild.com",
    "status": "active"
  }
}
Phase 3: Tenant Login from Custom Domain
bash# From honeynwild.com login page
# Click "Sign In"
# Expected: 
# 1. Login request succeeds
# 2. Redirect to https://ibuyscrap.ca/auth-callback?data=...
# 3. AuthCallback processes data
# 4. Redirect to tenant dashboard
Common Issues & Fixes
Issue 1: "Tenant not found for domain"
Cause: Domain not in customDomains array
Fix:
javascript// Via MongoDB shell or API
db.tenants.updateOne(
  { name: "Honey & Wild" },
  { $addToSet: { customDomains: "honeynwild.com" } }
)
Issue 2: CORS errors from honeynwild.com
Cause: Domain not in trusted domains cache
Fix: Wait 5 minutes for cache refresh, OR manually refresh:
bash# Call this endpoint as super admin
POST https://ibuyscrap.ca/api/admin/refresh-cors-cache
Issue 3: Headers not reaching backend
Cause: Nginx/proxy stripping custom headers
Fix: Update Nginx config:
nginxlocation /api/ {
    proxy_pass http://localhost:5000;
    proxy_set_header X-Tenant-Domain $http_x_tenant_domain;
    proxy_set_header X-Original-Host $http_x_original_host;
    proxy_set_header Host $host;
}
Production Deployment Steps

Deploy Database Changes

bash   npm run migrate:tenant-domains

Deploy Backend Code

bash   git pull origin main
   npm install
   npm run build
   pm2 restart immigration-portal

Verify Logs

bash   pm2 logs immigration-portal --lines 100
   # Look for: "Enhanced Tenant Resolution Started"
   # Look for: "Tenant Resolved Successfully"

Test Each Domain

Test super admin: https://ibuyscrap.ca/login
Test tenant: https://honeynwild.com (with login page)
Check browser console for errors



Key Advantages of This Approach

Secure: Domains must be explicitly approved by super admin
Scalable: Cache prevents database overload
Flexible: Supports unlimited custom domains per tenant
Auditable: domainApprovals array tracks all requests
Fast: In-memory cache for tenant lookups
Clean: No hardcoded domain lists

Next Steps After Implementation

Create super admin UI for domain approval workflow
Add email notifications when domains are approved/rejected
Implement domain verification (DNS TXT record check)
Add SSL certificate automation for custom domains
Create tenant self-service domain request page

Would you like me to create any of these additional features, or do you need help with a specific error you're encountering during implementation?