# 🔧 FORCE REBUILD ON EC2 SERVER

## ❌ **PROBLEM IDENTIFIED:**

The deployment completed successfully, but the **NEW frontend code is NOT running**. The test shows:
- ❌ AuthCallback runs 6 times (should be 1)
- ❌ No "already processed, skipping" message
- ❌ User redirected to `/login` instead of dashboard

This means the **old JavaScript is still being served**.

---

## ✅ **SOLUTION: Force Rebuild on EC2**

### **Option 1: SSH to EC2 and Rebuild Manually**

```bash
# 1. Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. Navigate to frontend
cd /var/www/immigration-portal/frontend

# 3. Verify the code is up-to-date
git log -1 --oneline
# Should show: f1fb8f4 Fix: Prevent infinite redirect loop...

# 4. Check if AuthCallback has the new code
grep "hasProcessed" src/pages/auth/AuthCallback.tsx
# Should show: const [hasProcessed, setHasProcessed] = useState<boolean>(false);

# 5. If code is correct, force rebuild
rm -rf dist/
rm -rf node_modules/.cache/
npm run build

# 6. Verify build contains new code
ls -la dist/assets/AuthCallback-*.js
# Should see a NEW filename (hash changed)

# 7. Restart backend (to clear any cached routes)
cd /var/www/immigration-portal/backend
pm2 restart immigration-portal

# 8. Test the health endpoint
curl http://localhost:5000/api/health

# 9. Exit SSH
exit
```

---

### **Option 2: Trigger a New Deployment**

If you can't SSH, make a dummy commit to trigger a new deployment:

```bash
# On your local machine
cd c:\Main_Data\AI\immigration-appV1

# Create a dummy file
echo "Force rebuild" > .rebuild-trigger

# Commit and push
git add .rebuild-trigger
git commit -m "Force rebuild: Clear build cache"
git push origin main
```

Then wait 5 minutes for GitHub Actions to deploy.

---

### **Option 3: Clear Browser Cache**

If the code IS correct on the server but your browser has cached it:

1. Open DevTools (F12)
2. Right-click the Refresh button
3. Select "Empty Cache and Hard Reload"
4. Or press: `Ctrl+Shift+Delete` → Clear "Cached images and files"

---

## 🔍 **VERIFY THE FIX:**

After rebuilding, you should see:

```
📋 🔄 AuthCallback: Starting auth data processing...  ← Only ONCE
📋 ⏭️  AuthCallback already processed, skipping...     ← This message!
```

Not this:
```
📋 🔄 AuthCallback: Starting auth data processing...  ← Multiple times
📋 🔄 AuthCallback: Starting auth data processing...
📋 🔄 AuthCallback: Starting auth data processing...
```

---

## ❓ **WHICH OPTION DO YOU PREFER?**

- **Option 1**: Direct SSH (fastest, 2 minutes)
- **Option 2**: New deployment (slower, 5-7 minutes)
- **Option 3**: Just clear browser cache (if server is actually correct)

