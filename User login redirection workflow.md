explain me how my user login works, who is created or registered under honey & wild Tenant and login using same domain path which is used by tenant to login

Great question! Let me explain how a **regular user** (not tenant admin) registers and logs in under the Honey & Wild tenant.

[3 tools called]

Perfect! Now let me check the frontend registration form:

[1 tool called]

Perfect! Now I have the complete picture. Let me explain:

---

# 👤 **Regular User Registration & Login Under Honey & Wild Tenant**

## **The Complete Flow:**

---

## **Scenario: New User Wants to Use Honey & Wild's Immigration Portal**

### **Step 1: User Visits Registration Page** 📝

```
https://honeynwild.com/immigration-portal/login
```

The same page has **two tabs**:
- ✅ **Login** (for existing users)
- ✅ **Register** (for new users)

**User clicks "Register" tab** and sees form fields:
- First Name
- Last Name  
- Email
- Password

---

### **Step 2: User Fills Registration Form** ✍️

**Example:**
```
First Name: John
Last Name: Doe
Email: john.doe@example.com
Password: SecurePass123!
```

User clicks **"Create Account"** button

---

### **Step 3: JavaScript Sends Registration Request** 📡

**File:** `frontend/public/tenant-login.html` (Lines 170-198)

```javascript
registerFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('register-firstName').value;
    const lastName = document.getElementById('register-lastName').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    // Call tenant registration API
    const response = await fetch(`${apiBaseUrl}/tenant/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password })
    });
});
```

**API Call:**
```http
POST https://honeynwild.com/api/v1/tenant/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Note:** No `tenantId` is sent! The domain identifies the tenant.

---

### **Step 4: Nginx Intercepts & Adds Tenant Context** 🚦

```nginx
# Nginx for honeynwild.com
server {
    server_name honeynwild.com;
    
    location /api/v1/tenant/ {
        proxy_pass http://localhost:5000/api/v1/tenant/;
        
        # THIS IS KEY: Nginx adds tenant domain header
        proxy_set_header X-Tenant-Domain honeynwild.com;
        proxy_set_header Host $host;
    }
}
```

**Request forwarded to backend with header:**
```http
X-Tenant-Domain: honeynwild.com
```

---

### **Step 5: Backend Processes Registration** 🔧

**File:** `backend/src/controllers/tenantApiController.ts` (Lines 288-338)

```typescript
static async tenantRegister(req: Request, res: Response) {
    const { email, password, firstName, lastName } = req.body;
    
    // Step 5a: Extract domain from Nginx header
    const domain = req.get('x-tenant-domain') || req.get('host');
    // domain = "honeynwild.com"
    
    log.info('Tenant registration attempt', { email, domain });
    
    // Step 5b: Find the Honey & Wild tenant by domain
    const tenant = await TenantService.getTenantByDomain(domain);
    // tenant = { _id: "abc123", name: "Honey & Wild", domain: "honeynwild.com" }
    
    if (!tenant) {
        throw new AppError('Tenant not found', 404);
    }
    
    // Step 5c: Register user WITH tenant association
    const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role: 'user',  // Regular user role
        tenantId: tenant._id.toString()  // KEY: Links user to Honey & Wild
    });
    
    // Step 5d: Return success with token
    res.status(201).json({
        success: true,
        data: {
            user: result.user,
            token: result.token,
            frontendUrl: config.getFrontendUrl(domain)
        }
    });
}
```

---

### **Step 6: Database Entry Created** 💾

**User Document in MongoDB:**

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  password: "$2b$10$hashed_password_here",
  role: "user",  // Regular user, not admin
  tenantId: ObjectId("507f191e810c19729de860ea"),  // ← Links to Honey & Wild
  isActive: true,
  isEmailVerified: false,
  permissions: [
    'profile.read',
    'profile.update',
    'draw.view',
    'notification.view'
  ],
  createdAt: 2025-10-07T20:00:00.000Z,
  updatedAt: 2025-10-07T20:00:00.000Z
}
```

**Key Points:**
- ✅ `tenantId` points to Honey & Wild tenant
- ✅ `role: 'user'` (not admin)
- ✅ Limited permissions (can't manage other users)

---

### **Step 7: Frontend Redirects User** 🔄

**File:** `frontend/public/tenant-login.html` (Lines 186-191)

```javascript
if (result.success) {
    showMessage('Registration successful!', 'success');
    
    // Redirect to dashboard (still on honeynwild.com!)
    setTimeout(() => {
        window.location.href = `https://${hostname}/immigration-portal/dashboard`;
        // Redirects to: https://honeynwild.com/immigration-portal/dashboard
    }, 1000);
}
```

---

## **Step 8: User Logs In (Future Sessions)** 🔑

When John wants to log in again:

### **Login Flow:**

```
1. Visit: https://honeynwild.com/immigration-portal/login
2. Enter: john.doe@example.com + password
3. JavaScript calls: POST /api/v1/tenant/auth/login
4. Nginx adds: X-Tenant-Domain: honeynwild.com
5. Backend validates:
   - User exists ✅
   - Password matches ✅
   - User belongs to Honey & Wild tenant ✅
   - Tenant is active ✅
6. Backend returns: JWT token
7. Frontend redirects to: https://ibuyscrap.ca/tenant/dashboard
```

**Backend Login Logic:**

```typescript
// backend/src/services/authService.ts (Lines 133-141)
// For tenant users, validate tenant access
if (!user.tenantId) {
    throw new AuthenticationError('User account is not properly configured');
}

const tenant = user.tenantId as ITenant;

// If tenant domain is provided, validate it matches
if (tenantDomain && tenant.domain !== tenantDomain) {
    throw new AuthenticationError('User does not have access to this tenant');
}
```

---

## **Visual: Complete Registration & Login Flow**

```
┌─────────────────────────────────────────────────────────┐
│  USER JOURNEY                                           │
└─────────────────────────────────────────────────────────┘

REGISTRATION:
─────────────
User visits honeynwild.com/immigration-portal/login
    ↓
Clicks "Register" tab
    ↓
Fills: John Doe, john@example.com, password
    ↓
Clicks "Create Account"
    ↓
JavaScript → POST /api/v1/tenant/auth/register
    ↓
Nginx adds: X-Tenant-Domain: honeynwild.com
    ↓
Backend:
  1. Finds Honey & Wild tenant by domain
  2. Creates user with tenantId = Honey & Wild
  3. Assigns role: 'user'
  4. Returns JWT token
    ↓
User redirected to: honeynwild.com/immigration-portal/dashboard
    ↓
✅ REGISTERED & LOGGED IN


FUTURE LOGIN:
─────────────
User visits honeynwild.com/immigration-portal/login
    ↓
Enters: john@example.com + password
    ↓
JavaScript → POST /api/v1/tenant/auth/login
    ↓
Nginx adds: X-Tenant-Domain: honeynwild.com
    ↓
Backend:
  1. Finds user by email
  2. Validates password
  3. Checks user.tenantId matches Honey & Wild
  4. Validates tenant domain matches
  5. Returns JWT token
    ↓
User redirected to: ibuyscrap.ca/tenant/dashboard
    ↓
✅ LOGGED IN
```

---

## **Key Differences: Tenant Admin vs Regular User**

| Aspect | Tenant Admin | Regular User |
|--------|-------------|--------------|
| **Created By** | Super Admin via super admin panel | Self-registration on tenant domain |
| **Role** | `admin` or `tenant_admin` | `user` |
| **Permissions** | Can manage users, view analytics, manage tenant settings | Can only manage own profile, view draws |
| **Registration URL** | Created by super admin internally | `honeynwild.com/immigration-portal/login` |
| **Database** | `role: 'admin'`, `tenantId: honeynwild` | `role: 'user'`, `tenantId: honeynwild` |
| **Dashboard Access** | `/tenant/dashboard` (full control) | `/tenant/dashboard` (limited view) |

---

## **Multi-User Scenario Example:**

**Honey & Wild Tenant has:**

1. **Admin User** (Created by Super Admin)
   ```javascript
   {
     email: "admin@honeynwild.com",
     role: "admin",
     tenantId: "honeynwild_tenant_id",
     permissions: ["user.manage", "tenant.manage", ...]
   }
   ```

2. **Regular User #1** (Self-registered)
   ```javascript
   {
     email: "john.doe@example.com",
     role: "user",
     tenantId: "honeynwild_tenant_id",
     permissions: ["profile.read", "draw.view", ...]
   }
   ```

3. **Regular User #2** (Self-registered)
   ```javascript
   {
     email: "jane.smith@example.com",
     role: "user",
     tenantId: "honeynwild_tenant_id",
     permissions: ["profile.read", "draw.view", ...]
   }
   ```

**All three:**
- ✅ Belong to same tenant (Honey & Wild)
- ✅ Register/login via `honeynwild.com/immigration-portal/login`
- ✅ Stored with `tenantId` pointing to Honey & Wild
- ❌ Cannot see or access other tenants' data
- ❌ Regular users cannot manage other users

---

## **Data Isolation:**

When John logs in and views his profile:

```typescript
// Backend automatically filters by tenantId
const profiles = await Profile.find({
  userId: john._id,
  tenantId: honeynwild_tenant_id  // Automatic filtering
});

// John can ONLY see:
// - His own profile
// - His own applications
// - Draws for Honey & Wild tenant
// - Notifications for Honey & Wild tenant

// John CANNOT see:
// - Other tenants' data
// - Other users' profiles (unless admin)
```

---

Does this explanation clarify how regular users register and login under the Honey & Wild tenant using the same domain path? The key is that the **domain automatically determines which tenant** the user belongs to!