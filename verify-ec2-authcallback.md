# Verify AuthCallback Build on EC2

## 🔍 Critical Check: Does the deployed bundle have window.location.replace?

Run this on your EC2 instance:

```bash
cd /var/www/immigration-portal/frontend/dist/assets

# Find the AuthCallback bundle
ls -la AuthCallback*.js

# Check if it contains window.location.replace
grep "window.location.replace" AuthCallback*.js

# Also check for navigate (old code)
grep "navigate" AuthCallback*.js | head -5
```

---

## Expected Results

### ✅ If Fixed Correctly:
```bash
# Should find window.location.replace
AuthCallback-rqqCSWkI.js:...window.location.replace(e)...
```

### ❌ If Still Old Code:
```bash
# Will only find navigate(), no window.location.replace
```

---

## If Old Code is Still There:

The issue is that the **source code in `/var/www/immigration-portal/frontend/src/pages/auth/AuthCallback.tsx`** doesn't have the fix.

### Check Source File:
```bash
cd /var/www/immigration-portal/frontend
grep -A3 "setTimeout" src/pages/auth/AuthCallback.tsx | grep -A2 "window.location"
```

Should show:
```typescript
setTimeout(() => {
  window.location.replace(redirectPath);
}, 1500);
```

### If Source is Missing the Fix:

The Git repository code wasn't properly pulled. Run:

```bash
cd /var/www/immigration-portal
git status
git log --oneline -5

# Check last commit date
git log -1 --format="%ai %s"
```

Should show commit from **Oct 4, 19:16**: "CRITICAL FIX: Resolve /login redirect issue..."

### If Git Commit is Missing:

Pull the latest code:

```bash
cd /var/www/immigration-portal
git fetch origin
git pull origin main

# Verify the fix is in the source
grep "window.location.replace" frontend/src/pages/auth/AuthCallback.tsx
```

### Then Rebuild:

```bash
cd /var/www/immigration-portal/frontend
rm -rf dist/
npm run build

# Verify the built file
grep "window.location.replace" dist/assets/AuthCallback*.js

cd /var/www/immigration-portal/backend
pm2 restart immigration-portal
```

---

## Alternative: Check What Git Has

```bash
cd /var/www/immigration-portal
git show HEAD:frontend/src/pages/auth/AuthCallback.tsx | grep -A3 "setTimeout"
```

Should output:
```typescript
setTimeout(() => {
  window.location.replace(redirectPath);
}, 1500);
```

---

**Please run these verification commands and share the output!**

