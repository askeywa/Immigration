# 🚀 Immigration Portal - Multi-Tenant SaaS Platform

## 📋 Table of Contents
- [System Overview](#system-overview)
- [Architecture](#architecture)
- [User Roles & Access](#user-roles--access)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Tenant Management](#tenant-management)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Team Workflows](#team-workflows)

---

## 🎯 System Overview

The Immigration Portal is a **multi-tenant SaaS platform** that allows multiple organizations to manage their immigration applications independently while sharing the same infrastructure.

### Key Features
- ✅ **Multi-tenant Architecture** - Complete tenant isolation
- ✅ **Domain-based Authentication** - Each tenant has their own domain
- ✅ **Super Admin Dashboard** - Centralized tenant management
- ✅ **Tenant Dashboards** - Individual tenant management
- ✅ **User Management** - Role-based access control
- ✅ **Secure Authentication** - JWT-based security
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Dark Mode Support** - Theme switching capability

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Super Admin UI  │  │ Tenant UI       │  │ Shared UI    │ │
│  │ localhost:5174  │  │ tenant.com/     │  │ Components   │ │
│  │ /super-admin    │  │ immigration-    │  │              │ │
│  │                 │  │ portal/         │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js + Express)                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Tenant          │  │ Super Admin     │  │ Auth         │ │
│  │ Resolution      │  │ Routes          │  │ Service      │ │
│  │ Middleware      │  │ /api/super-     │  │ JWT Tokens   │ │
│  │                 │  │ admin/*         │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (MongoDB Atlas)                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Tenants         │  │ Users           │  │ Sessions     │ │
│  │ Collection      │  │ Collection      │  │ Collection   │ │
│  │                 │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Domain Structure

#### Development Environment
```
Super Admin Access:
├── http://localhost:5174/login
├── http://localhost:5174/super-admin/dashboard
├── http://localhost:5174/super-admin/tenants
└── http://localhost:5174/super-admin/users

Tenant Access (after hosts file setup):
├── http://honeynwild.com:5174/immigration-portal/login
├── http://honeynwild.com:5174/immigration-portal/dashboard
└── http://tenantdomain.com:5174/immigration-portal/*
```

#### Production Environment
```
Super Admin Access:
├── https://ibuyscrap.ca/login
├── https://ibuyscrap.ca/super-admin/dashboard
├── https://ibuyscrap.ca/super-admin/tenants
└── https://ibuyscrap.ca/super-admin/users

Tenant Access:
├── https://honeynwild.com/immigration-portal/login
├── https://honeynwild.com/immigration-portal/dashboard
└── https://tenantdomain.com/immigration-portal/*
```

---

## 👥 User Roles & Access

### 1. Super Admin
**Access:** `localhost:5174` (dev) / `ibuyscrap.ca` (prod)
**Credentials:** `superadmin@immigrationapp.com` / `ImmigrationDB2024`

**Capabilities:**
- ✅ Create/Edit/Delete tenants
- ✅ View all tenant data
- ✅ Manage tenant users
- ✅ System analytics and reports
- ✅ Tenant status management (activate/suspend)
- ✅ Subscription plan management

### 2. Tenant Admin
**Access:** `tenantdomain.com/immigration-portal/login`
**Created by:** Super Admin during tenant creation

**Capabilities:**
- ✅ Manage tenant users
- ✅ View tenant dashboard
- ✅ Access tenant-specific reports
- ✅ Configure tenant settings

### 3. Tenant User
**Access:** `tenantdomain.com/immigration-portal/login`
**Created by:** Tenant Admin

**Capabilities:**
- ✅ Access tenant dashboard
- ✅ View assigned applications
- ✅ Limited tenant-specific features

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd immigration-appV1
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment template
cp ../env.development.template .env

# Edit .env with your MongoDB connection string
# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Development Testing Setup

#### For Tenant Testing (Windows)
1. Open `C:\Windows\System32\drivers\etc\hosts` as Administrator
2. Add these lines:
```
127.0.0.1    honeynwild.com
127.0.0.1    testtenant.com
127.0.0.1    demotenant.com
```
3. Save the file

#### For Tenant Testing (Mac/Linux)
1. Open `/etc/hosts` with sudo
2. Add these lines:
```
127.0.0.1    honeynwild.com
127.0.0.1    testtenant.com
127.0.0.1    demotenant.com
```

### 5. Access Points
```
Super Admin: http://localhost:5174/login
Tenant Login: http://honeynwild.com:5174/immigration-portal/login
API: http://localhost:5000/api/
```

---

## 🚀 Production Deployment

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/production
JWT_SECRET=your-super-secret-jwt-key
SUPER_ADMIN_DOMAIN=ibuyscrap.ca
TENANT_DOMAIN_PREFIX=immigration-portal
EC2_PUBLIC_IP=your-ec2-ip
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-domain.com/api
VITE_MAIN_DOMAIN=ibuyscrap.ca
```

### Deployment Process
1. **Build Applications:**
   ```bash
   # Backend
   cd backend && npm run build
   
   # Frontend
   cd frontend && npm run build
   ```

2. **Deploy to EC2:**
   ```bash
   # Use deployment scripts
   ./deploy.sh
   ```

3. **Configure Nginx:**
   - Update nginx configuration for new tenants
   - Add SSL certificates
   - Configure domain routing

---

## 🏢 Tenant Management

### Creating a New Tenant

#### Via Super Admin Dashboard
1. Login to Super Admin: `localhost:5174/login`
2. Navigate to: **Tenants** → **Add Tenant**
3. Fill the form:
   ```
   Company Name: Honey N Wild Night Club
   Domain: honeynwild.com                    ← Just the domain!
   Description: Night club management system
   
   Admin User:
   - Full Name: Test User
   - Email: testuser@honeynwild.com
   - Password: TestPassword123!
   ```
4. Click **Create Tenant**

#### Tenant Access URLs
After creation, tenant can access:
- **Login:** `https://honeynwild.com/immigration-portal/login`
- **Dashboard:** `https://honeynwild.com/immigration-portal/dashboard`

### Tenant Status Management
- **Active:** Tenant can login and use the system
- **Trial:** 7-day trial period
- **Suspended:** Tenant access is blocked
- **Cancelled:** Tenant is soft-deleted

---

## 📡 API Documentation

### Authentication Endpoints

#### Super Admin Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "superadmin@immigrationapp.com",
  "password": "ImmigrationDB2024"
}
```

#### Tenant Login
```http
POST /api/auth/login
Host: tenantdomain.com
Content-Type: application/json

{
  "email": "tenantuser@tenantdomain.com",
  "password": "password123"
}
```

### Super Admin Endpoints

#### Get All Tenants
```http
GET /api/super-admin/tenants?page=1&limit=10
Authorization: Bearer <super-admin-token>
```

#### Create Tenant
```http
POST /api/tenants
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "name": "Tenant Name",
  "domain": "tenantdomain.com",
  "description": "Tenant description",
  "adminUser": {
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@tenantdomain.com",
    "password": "password123"
  }
}
```

#### Update Tenant
```http
PUT /api/super-admin/tenants/:tenantId
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "status": "active",
  "subscription": {
    "planName": "Gold",
    "status": "active"
  }
}
```

#### Delete Tenant
```http
DELETE /api/super-admin/tenants/:tenantId
Authorization: Bearer <super-admin-token>
```

### Tenant Endpoints

#### Get Tenant Dashboard Data
```http
GET /api/tenant/dashboard
Authorization: Bearer <tenant-token>
Host: tenantdomain.com
```

#### Get Tenant Users
```http
GET /api/tenant/users
Authorization: Bearer <tenant-token>
Host: tenantdomain.com
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Tenant Login Fails
**Problem:** "Invalid credentials" error when logging in as tenant
**Solution:** 
- Ensure you're accessing via tenant domain, not localhost
- Check hosts file configuration
- Verify tenant exists and is active

#### 2. Super Admin Cannot Create Tenants
**Problem:** 500 error during tenant creation
**Solution:**
- Check MongoDB connection
- Verify environment variables
- Check backend logs for validation errors

#### 3. Domain Resolution Issues
**Problem:** Tenant not found for domain
**Solution:**
- Verify domain is correctly stored in database
- Check tenant resolution middleware logs
- Ensure domain format is correct (no http/https prefix)

#### 4. CORS Errors
**Problem:** Frontend cannot connect to backend
**Solution:**
- Check CORS configuration in backend
- Verify API base URL in frontend
- Ensure both servers are running

### Debug Commands

#### Check Running Processes
```bash
# Check if servers are running
netstat -ano | findstr :5000  # Backend
netstat -ano | findstr :5174  # Frontend
```

#### Kill All Node Processes
```bash
taskkill /F /IM node.exe
```

#### Check Database Connection
```bash
cd backend
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"
```

---

## 👥 Team Workflows

### Development Workflow
1. **Create Feature Branch:** `git checkout -b feature/tenant-management`
2. **Make Changes:** Implement feature with tests
3. **Test Locally:** Ensure all functionality works
4. **Create Pull Request:** Submit for code review
5. **Deploy to Staging:** Test in staging environment
6. **Deploy to Production:** After approval

### Code Review Checklist
- [ ] Multi-tenant security maintained
- [ ] Domain resolution works correctly
- [ ] API endpoints properly authenticated
- [ ] Frontend components responsive
- [ ] Error handling implemented
- [ ] Database queries optimized

### Testing Checklist
- [ ] Super admin functionality works
- [ ] Tenant creation/deletion works
- [ ] Tenant login works via correct domain
- [ ] Cross-tenant isolation maintained
- [ ] Mobile responsiveness verified
- [ ] Dark mode functionality works

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates updated
- [ ] Nginx configuration updated
- [ ] Health checks passing
- [ ] Monitoring alerts configured

---

## 📚 Additional Resources

### Key Files to Understand
- `backend/src/middleware/tenantResolution.ts` - Domain-based tenant resolution
- `frontend/src/contexts/TenantContext.tsx` - Tenant context management
- `backend/src/config/config.ts` - System configuration
- `nginx-multi-tenant.conf` - Production routing configuration

### Useful Commands
```bash
# Reset super admin password
node reset-super-admin-password.js

# Check tenant data
node check-tenant-exists.js

# Test tenant login
node test-tenant-login-simple.js

# Build and deploy
npm run build && ./deploy.sh
```

### Support Contacts
- **Technical Lead:** [Your Name]
- **DevOps:** [DevOps Team]
- **Database Admin:** [DB Admin]

---

## 🎉 Welcome to the Team!

This multi-tenant system is designed for scalability, security, and ease of use. Each tenant operates independently while sharing the same robust infrastructure. 

**Key Principles:**
- 🔒 **Security First** - Complete tenant isolation
- 🚀 **Performance** - Optimized for multiple tenants
- 🛠️ **Maintainability** - Clean, documented code
- 📈 **Scalability** - Ready for growth

Happy coding! 🚀
