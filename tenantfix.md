Solution: Fix BrowserRouter vs Hash-Based URL Mismatch
The Problem
Your React app uses BrowserRouter (clean URLs like /auth-callback), but your login page is generating hash-based URLs (#/auth-callback). The browser interprets https://ibuyscrap.ca/#/auth-callback?data=... as:

Path: / (root)
Hash: #/auth-callback?data=...

React Router never sees the route because the hash prevents it from parsing the path.
The Solution
Change the redirect URL to use a clean path instead of hash-based routing.

Files to Modify
1. immigration-portal-login-production.html (Lines 208-248)
Replace the redirect section with this:
javascript// OPTION 1: URL-Based Token Transfer (Cross-Origin Solution)
try {
    console.log('Preparing auth data for URL transfer...');
    
    // Prepare auth data for URL transfer
    const authData = {
        user: result.data.user,
        tenant: result.data.tenant,
        token: result.data.token,
        subscription: result.data.subscription || null
    };
    
    // Encode auth data for URL
    const encodedData = encodeURIComponent(JSON.stringify(authData));
    
    console.log('Auth data encoded for URL transfer');
    console.log('Encoded data length:', encodedData.length);
    console.log('User email:', authData.user.email);
    console.log('Tenant name:', authData.tenant.name);
    
    // CRITICAL FIX: Use clean URL path, not hash-based
    const redirectUrl = `https://ibuyscrap.ca/auth-callback?data=${encodedData}`;
    console.log('Redirecting to:', redirectUrl);
    
    updateDebugInfo(`Auth data prepared successfully!\nRedirecting to: ${redirectUrl.substring(0, 80)}...`);
    
    // Immediate redirect
    window.location.href = redirectUrl;
    
} catch (urlError) {
    console.error('URL transfer preparation failed:', urlError);
    showError('Login successful but redirect preparation failed. Please try again.');
}
Change: Remove the #/ from the URL. Change from:
javascriptconst redirectUrl = `https://ibuyscrap.ca/#/auth-callback?data=${encodedData}`;
To:
javascriptconst redirectUrl = `https://ibuyscrap.ca/auth-callback?data=${encodedData}`;

2. Backend Route Configuration Check
Verify your backend serves the React app for all routes. Check your server.ts or Express configuration.
You need a catch-all route that serves index.html for client-side routing:
typescript// AFTER all API routes, add this catch-all for React Router
app.get('*', (req, res) => {
  // Only serve React app for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }
});
Check if this exists in your server.ts. If not, add it after all your API route definitions but before the error handler.

3. AuthCallback.tsx - Minor Enhancement
Your current implementation looks good, but add this safety check at the top:
typescriptuseEffect(() => {
  const processAuthCallback = async () => {
    try {
      console.log('AuthCallback: Starting auth data processing...');
      console.log('Full URL:', window.location.href);
      console.log('Pathname:', window.location.pathname);
      console.log('Search:', window.location.search);
      console.log('Hash:', window.location.hash);
      
      setDebugInfo('Starting authentication data processing...');
      
      // Get encoded auth data from URL
      const encodedData = searchParams.get('data');
      
      // ... rest of your existing code
This helps debug any remaining routing issues.

Testing Steps

Clear browser cache and sessionStorage:

javascript// Run in browser console before testing
sessionStorage.clear();
localStorage.clear();
location.reload();

Test the flow:

bash# Navigate to login page
https://honeynwild.com/immigration-portal/login

# Click Sign In
# Expected redirect URL:
https://ibuyscrap.ca/auth-callback?data=eyJ1c2VyIjp7...

# Should see AuthCallback component
# Should redirect to dashboard

Monitor console logs:

✓ Login successful
✓ Auth data encoded for URL transfer
✓ Redirecting to: https://ibuyscrap.ca/auth-callback?data=...
✓ AuthCallback: Starting auth data processing...
✓ AuthCallback: Found encoded data in URL
✓ AuthCallback: Successfully decoded auth data
✓ AuthCallback: Auth data stored successfully
✓ Redirecting to dashboard

Potential Issues & Solutions
Issue 1: 404 Error on /auth-callback
Symptom: Browser shows "Cannot GET /auth-callback"
Cause: Backend not configured to serve React app for all routes
Solution: Add catch-all route in server.ts:
typescript// Import path at the top
import path from 'path';

// After all API routes, before error handler:
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});
Issue 2: Data Too Long for URL
Symptom: URL exceeds browser limits (>2000 characters)
Solution: Use POST request instead. Create a temporary session endpoint:
Backend - Add to authController.ts:
typescriptstatic async createTempSession(req: Request, res: Response): Promise<void> {
  try {
    const { user, tenant, token, subscription } = req.body;
    
    // Generate temporary session ID
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    // Store in Redis/memory with 5-minute expiry
    await redis.setex(`temp_session:${sessionId}`, 300, JSON.stringify({
      user, tenant, token, subscription
    }));
    
    res.json({ success: true, sessionId });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
}
Frontend - Modify login page:
javascript// Instead of URL encoding, create temp session
const sessionResponse = await fetch(`${API_BASE_URL}/auth/temp-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        user: result.data.user,
        tenant: result.data.tenant,
        token: result.data.token,
        subscription: result.data.subscription
    })
});

const { sessionId } = await sessionResponse.json();
window.location.href = `https://ibuyscrap.ca/auth-callback?session=${sessionId}`;
AuthCallback - Retrieve session:
typescriptconst sessionId = searchParams.get('session');
if (sessionId) {
    const response = await fetch(`${API_BASE_URL}/auth/temp-session/${sessionId}`);
    const authData = await response.json();
    // ... store in Zustand
}

Quick Win: Simplify for Now
If you want the quickest fix without backend changes:
Just change this one line in immigration-portal-login-production.html:
Line ~230:
javascript// OLD (with hash):
const redirectUrl = `https://ibuyscrap.ca/#/auth-callback?data=${encodedData}`;

// NEW (clean URL):
const redirectUrl = `https://ibuyscrap.ca/auth-callback?data=${encodedData}`;
Then ensure your backend serves the React app for the /auth-callback route.

Files You Should Upload
To give you the most accurate solution, upload:

backend/src/server.ts - To verify static file serving configuration
frontend/package.json - To check React Router version
frontend/src/main.tsx - To verify router setup

Without seeing these, I'm making assumptions about your configuration. The core fix is simple (remove the #/), but we need to ensure your backend is configured to handle client-side routing properly.RetryClaude does not have the ability to run the code it generates yet.server.ts608 linestspackage.json50 linesjsonmain.tsx53 linestsxDhere are the requested files attachedEditComplete Solution: Fix Backend Static File Serving
Critical Issue Identified
Your server.ts does not serve the React frontend at all. It only has API routes and a 404 handler. When someone navigates to https://ibuyscrap.ca/auth-callback, the backend returns a 404 JSON response instead of serving the React app's index.html.
This is why the auth callback never loads - the React app never gets served for that route.
Solution: Add Frontend Static File Serving
Add this code to server.ts BEFORE the 404 handler (around line 235, before app.use('*', ...)):
typescript// Import path module at the top with other imports
import path from 'path';
import { fileURLToPath } from 'url';

// Add after all your API routes but BEFORE the 404 handler:

// Serve static files from React build
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

// Serve static assets
app.use(express.static(frontendDistPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Critical: Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res, next) => {
  // Skip if it's an API route
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Serve index.html for all other routes
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to load application'
      });
    }
  });
});
Complete Modified server.ts Section
Replace lines 230-238 in your server.ts with:
typescript// Tenant-specific API routes (for tenant website integration)
import tenantApiRoutes from './routes/tenantApiRoutes';
app.use('/api/v1', tenantApiRoutes);

// ==================== FRONTEND SERVING ====================
// Import path module
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to frontend build
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

console.log('Frontend dist path:', frontendDistPath);

// Serve static files from React build (CSS, JS, images, etc.)
app.use(express.static(frontendDistPath, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true,
  index: false // Don't auto-serve index.html for directory requests
}));

// SPA fallback: Serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip if it's an API route
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  console.log(`Serving React app for route: ${req.path}`);
  
  // Serve index.html for client-side routing
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to load application',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });
});
// ==================== END FRONTEND SERVING ====================

// Error tracking middleware (before error handler)
app.use(errorTrackingMiddleware);

// Global error handler (must be last)
app.use(errorHandler);
Also Update immigration-portal-login-production.html
Change line 230 from:
javascriptconst redirectUrl = `https://ibuyscrap.ca/#/auth-callback?data=${encodedData}`;
To:
javascriptconst redirectUrl = `https://ibuyscrap.ca/auth-callback?data=${encodedData}`;
Remove the #/ from the URL.
Why This Fixes Everything

Current problem: Request to /auth-callback hits the 404 handler, returns JSON error
After fix: Request to /auth-callback gets index.html, React Router handles the route
Flow becomes:

Login at honeynwild.com → Redirect to ibuyscrap.ca/auth-callback?data=...
Backend serves index.html for /auth-callback
React app loads, React Router sees /auth-callback route
AuthCallback.tsx component processes the data
Redirects to dashboard



Verification Steps
After deployment:

Test static file serving:

bashcurl https://ibuyscrap.ca/
# Should return HTML, not JSON

Test auth-callback route:

bashcurl https://ibuyscrap.ca/auth-callback
# Should return HTML (index.html), not 404 JSON

Test API routes still work:

bashcurl https://ibuyscrap.ca/api/health
# Should return JSON health check

Test full login flow:

Go to honeynwild.com/immigration-portal/login
Click Sign In
Should redirect to ibuyscrap.ca/auth-callback?data=...
Should see the AuthCallback component (animated processing screen)
Should redirect to dashboard



Build and Deploy Commands
bash# In frontend directory
cd frontend
npm run build

# Verify build output
ls -la dist/
# Should see: index.html, assets/, etc.

# In backend directory
cd ../backend
npm run build

# Deploy
pm2 restart immigration-portal
# or
npm start
Critical Notes

The 404 handler must come AFTER the SPA fallback - otherwise it intercepts all routes
Static file serving must come BEFORE the SPA fallback - so CSS/JS files are served directly
API routes must be checked FIRST - to avoid serving HTML for API requests
ES modules require fileURLToPath - because __dirname isn't available in ES modules

This is the root cause of your issue. Your backend isn't configured to serve the frontend at all.