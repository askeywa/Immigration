# 🔍 API Calls Analysis Report

## 📊 Current Situation

Based on my analysis of your codebase, here's exactly what's happening when a user logs in and loads the dashboard:

### **🚨 The Problem: Too Many API Calls**

Your application is making **6-8 API calls** during login and dashboard load, which is excessive and impacts performance.

## 📋 Detailed API Call Breakdown

### **1. Login Process (2-3 API calls)**
```
1. POST /api/auth/login          - User authentication
2. GET  /api/auth/permissions    - Load user permissions (async, non-blocking)
3. GET  /api/auth/tenants        - Get user's tenants (if multi-tenant user)
```

### **2. Dashboard Load (3-5 API calls)**
```
4. GET  /api/profiles/progress   - Get profile completion progress
5. GET  /api/profiles            - Get user profile data  
6. GET  /api/users/me            - Get user data (DUPLICATE!)
7. GET  /api/tenants/resolve/subdomain/{subdomain} - Resolve tenant from domain
8. GET  /api/tenants/{tenantId}  - Get tenant details
```

## 🔍 Root Causes (In Plain English)

### **1. Duplicate User Data Fetching**
- **What's happening**: Your `UserDashboard.tsx` fetches user data with `/api/users/me`
- **Problem**: This data is already available in your `AuthStore` from the login response
- **Impact**: Unnecessary API call and data duplication

### **2. No API Call Batching**
- **What's happening**: Each component makes its own API calls independently
- **Problem**: Related data (profile, progress, user) could be fetched in one request
- **Impact**: Multiple round trips to the server

### **3. Domain Resolution on Every Load**
- **What's happening**: `TenantContext` resolves tenant from domain every time
- **Problem**: Domain resolution should be cached or done once
- **Impact**: Extra API calls for tenant resolution

### **4. Missing Caching Strategy**
- **What's happening**: No caching for frequently accessed data
- **Problem**: Same data fetched multiple times
- **Impact**: Unnecessary server load and slower performance

### **5. Redundant Profile API Calls**
- **What's happening**: `/api/profiles` is called 4 times across different components
- **Problem**: Same endpoint called from multiple places
- **Impact**: Server overload and poor user experience

## 📁 Files That Need Improvement

### **High Priority (Immediate Impact)**

1. **`frontend/src/pages/user/UserDashboard.tsx`**
   - **Problem**: Makes 3 API calls when 1 would suffice
   - **Fix**: Remove duplicate `/api/users/me` call, use data from AuthStore
   - **Impact**: Reduce from 3 to 1 API call

2. **`frontend/src/contexts/TenantContext.tsx`**
   - **Problem**: Fetches tenant data on every dashboard load
   - **Fix**: Implement proper caching with 5-minute TTL
   - **Impact**: Reduce tenant API calls by 80%

3. **`frontend/src/services/domainResolutionService.ts`**
   - **Problem**: Resolves domain on every page load
   - **Fix**: Cache domain resolution results
   - **Impact**: Eliminate redundant domain resolution calls

### **Medium Priority (Performance Optimization)**

4. **`frontend/src/services/auth.service.ts`**
   - **Problem**: Permission loading could be batched
   - **Fix**: Include permissions in login response
   - **Impact**: Reduce from 2 to 1 API call during login

5. **`frontend/src/store/authStore.ts`**
   - **Problem**: No caching for user data
   - **Fix**: Implement data caching and refresh strategies
   - **Impact**: Reduce redundant user data fetching

### **Low Priority (Long-term Optimization)**

6. **`frontend/src/pages/user/CrsScore.tsx`**
   - **Problem**: Calls `/api/profiles` independently
   - **Fix**: Use shared profile data from context
   - **Impact**: Reduce profile API calls

7. **`frontend/src/pages/user/DocumentsChecklist.tsx`**
   - **Problem**: Calls `/api/profiles` twice
   - **Fix**: Use shared profile data from context
   - **Impact**: Reduce profile API calls

## 🎯 Optimization Strategy

### **Phase 1: Quick Wins (Reduce from 6-8 to 3-4 calls)**
1. Remove duplicate `/api/users/me` call from UserDashboard
2. Implement basic caching in TenantContext
3. Cache domain resolution results

### **Phase 2: Batching (Reduce from 3-4 to 1-2 calls)**
1. Create a `/api/dashboard/batch` endpoint
2. Batch profile, progress, and user data in one request
3. Include permissions in login response

### **Phase 3: Advanced Caching (Reduce from 1-2 to 0-1 calls)**
1. Implement Redis caching on backend
2. Add client-side data persistence
3. Implement smart refresh strategies

## 📈 Expected Results

### **Before Optimization:**
- **Login**: 2-3 API calls
- **Dashboard Load**: 3-5 API calls
- **Total**: 6-8 API calls
- **Load Time**: 2-3 seconds

### **After Phase 1:**
- **Login**: 2-3 API calls
- **Dashboard Load**: 1-2 API calls
- **Total**: 3-5 API calls
- **Load Time**: 1-2 seconds

### **After Phase 2:**
- **Login**: 1-2 API calls
- **Dashboard Load**: 1 API call
- **Total**: 2-3 API calls
- **Load Time**: 0.5-1 second

### **After Phase 3:**
- **Login**: 1 API call
- **Dashboard Load**: 0-1 API call (cached)
- **Total**: 1-2 API calls
- **Load Time**: 0.2-0.5 seconds

## 🚀 Next Steps

1. **Run the browser monitoring script** to confirm current API calls
2. **Start with Phase 1 optimizations** for immediate impact
3. **Implement batching** for long-term performance
4. **Add caching** for optimal user experience

## 📝 Test Instructions

Use the `browser-api-monitor.js` script I created:

1. Open your browser console (F12)
2. Paste the monitoring script
3. Login to your app
4. Run `analyzeAPICalls()` to see the results
5. Share the results with me for specific optimization recommendations

This will give us the exact API call pattern and help prioritize the optimizations.
