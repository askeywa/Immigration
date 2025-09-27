# API Call Testing Instructions

## Method 1: Browser Console Monitoring (Recommended)

1. **Open your browser** and navigate to your frontend app (http://localhost:5174)

2. **Open Developer Tools** (F12 or right-click -> Inspect)

3. **Go to Console tab**

4. **Copy and paste** the entire content of `browser-api-monitor.js` into the console and press Enter

5. **Navigate to login page** and login with your credentials

6. **After login completes**, run this command in the console:
   ```javascript
   analyzeAPICalls()
   ```

7. **Export the data** (optional):
   ```javascript
   exportAPIData()
   ```

## Method 2: Network Tab Monitoring

1. **Open Developer Tools** (F12)
2. **Go to Network tab**
3. **Filter by "XHR" or "Fetch"** to see only API calls
4. **Clear the network log** (click the clear button)
5. **Login to your app**
6. **Count and analyze** the API calls in the Network tab

## Method 3: Backend Logging

1. **Check your backend console** for incoming requests
2. **Look for patterns** in the request logs
3. **Note the timing** of requests

## Expected Results

Based on my analysis, you should see approximately **6-8 API calls** during login and dashboard load:

### Login Process:
- `/api/auth/login` - User authentication
- `/api/users/me` - Get user profile
- `/api/tenants/current` - Get current tenant info

### Dashboard Load:
- `/api/profiles/progress` - Get profile completion progress
- `/api/profiles` - Get user profile data
- `/api/users/me` - Get user data (duplicate)
- `/api/tenants/resolve/subdomain/{subdomain}` - Resolve tenant from domain
- `/api/tenants/{tenantId}` - Get tenant details

## Files That Need Improvement

After running the test, these files need optimization:

1. **`frontend/src/pages/user/UserDashboard.tsx`** - Remove duplicate user API call
2. **`frontend/src/contexts/TenantContext.tsx`** - Add better caching
3. **`frontend/src/services/domainResolutionService.ts`** - Cache domain resolution
4. **`frontend/src/store/authStore.ts`** - Optimize permission loading

## Next Steps

1. Run the test using Method 1 (Browser Console)
2. Share the results with me
3. I'll provide specific optimization recommendations
4. Implement the fixes to reduce API calls from 6-8 to 1-2
