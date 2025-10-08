# Immigration Portal - Comprehensive Project Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Multi-Tenant System](#multi-tenant-system)
5. [Authentication & Authorization](#authentication--authorization)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)
9. [Security Features](#security-features)
10. [Performance Optimizations](#performance-optimizations)
11. [Testing & Monitoring](#testing--monitoring)
12. [Deployment](#deployment)
13. [Development Workflow](#development-workflow)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

### **Immigration Portal - Multi-Tenant Immigration Management System**

The Immigration Portal is a comprehensive, enterprise-grade multi-tenant SaaS platform designed for immigration service providers. It enables immigration consultants and law firms to manage their clients' immigration journeys efficiently while maintaining complete data isolation and security.

### **Key Business Value**
- **Multi-Tenant Architecture**: Serve multiple immigration service providers from a single platform
- **Client Management**: Complete immigration profile and document management
- **CRS Score Calculation**: Automated Comprehensive Ranking System scoring for Express Entry
- **Compliance Tracking**: Visa history, document verification, and audit trails
- **Analytics & Reporting**: Business intelligence for immigration service providers

### **Target Users**
- **Immigration Consultants**: Manage client profiles and applications
- **Immigration Law Firms**: Handle complex immigration cases
- **Super Administrators**: Platform oversight and tenant management
- **End Clients**: Track their immigration journey progress

---

## 🏗️ Architecture

### **System Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                     │
├─────────────────────────────────────────────────────────────┤
│  • Super Admin Dashboard    • Tenant Admin Dashboard        │
│  • User Dashboard          • Authentication System          │
│  • Multi-tenant UI         • Real-time Updates              │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/API Calls
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend API (Node.js/Express)               │
├─────────────────────────────────────────────────────────────┤
│  • RESTful APIs            • Authentication & Authorization │
│  • Multi-tenant Middleware • Data Isolation Layer          │
│  • Business Logic          • File Management                │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ Database Queries
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (MongoDB)                 │
├─────────────────────────────────────────────────────────────┤
│  • Multi-tenant Collections • Indexed Queries              │
│  • Data Isolation          • Audit Logging                 │
│  • Backup & Recovery       • Performance Optimization      │
└─────────────────────────────────────────────────────────────┘
```

### **Domain Architecture**

```
Super Admin Domain:     www.sehwagimmigration.com
Tenant Portals:         portal.{tenantname}.com
API Domain:             api.sehwagimmigration.com
```

### **Component Architecture**

#### **Frontend Architecture**
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── tenant/         # Tenant-specific components
│   ├── ui/             # Base UI components
│   └── crs/            # CRS calculation components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── pages/              # Route-based page components
│   ├── auth/           # Authentication pages
│   ├── super-admin/    # Super admin pages
│   ├── tenant/         # Tenant admin pages
│   └── user/           # User dashboard pages
├── services/           # API service layers
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

#### **Backend Architecture**
```
src/
├── config/             # Configuration management
├── controllers/        # Request handlers
├── middleware/         # Express middleware
├── models/             # MongoDB schemas
├── routes/             # API route definitions
├── services/           # Business logic services
├── utils/              # Utility functions
└── server.ts           # Application entry point
```

---

## 🛠️ Technology Stack

### **Frontend Technologies**

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **TypeScript** | 5.0.2 | Type safety |
| **Vite** | 7.1.7 | Build tool and dev server |
| **React Router** | 6.15.0 | Client-side routing |
| **Zustand** | 4.4.1 | State management |
| **React Query** | 4.32.0 | Server state management |
| **Tailwind CSS** | 3.3.3 | Utility-first CSS |
| **Headless UI** | 1.7.17 | Accessible UI components |
| **Framer Motion** | 10.16.1 | Animation library |
| **Axios** | 1.12.2 | HTTP client |
| **Recharts** | 3.2.0 | Data visualization |

### **Backend Technologies**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | ≥18.0.0 | Runtime environment |
| **Express.js** | 4.18.2 | Web framework |
| **TypeScript** | 5.3.3 | Type safety |
| **MongoDB** | Latest | Primary database |
| **Mongoose** | 8.0.3 | MongoDB ODM |
| **JWT** | 9.0.2 | Authentication tokens |
| **bcryptjs** | 2.4.3 | Password hashing |
| **Winston** | 3.17.0 | Logging framework |
| **Helmet** | 7.2.0 | Security middleware |
| **CORS** | 2.8.5 | Cross-origin resource sharing |
| **Morgan** | 1.10.0 | HTTP request logger |

### **Development & Testing Tools**

| Tool | Version | Purpose |
|------|---------|---------|
| **Playwright** | 1.55.0 | End-to-end testing |
| **Jest** | 29.7.0 | Unit testing |
| **ESLint** | 8.55.0 | Code linting |
| **Prettier** | 3.1.0 | Code formatting |
| **Nodemon** | 3.0.2 | Development server |
| **Husky** | 8.0.3 | Git hooks |

### **Monitoring & Observability**

| Tool | Purpose |
|------|---------|
| **Sentry** | Error tracking and performance monitoring |
| **New Relic** | Application performance monitoring |
| **Winston** | Structured logging |
| **Custom Monitoring** | API call tracking and performance metrics |

---

## 🏢 Multi-Tenant System

### **Tenant Architecture**

The system implements a sophisticated multi-tenant architecture with complete data isolation:

#### **Tenant Types**
1. **Super Admin Tenant**: System-wide control and management
2. **Immigration Service Providers**: Individual tenant organizations
3. **API Tenant**: Centralized API access for integrations

#### **Domain-Based Tenant Resolution**

```typescript
// Domain patterns
Super Admin:    www.sehwagimmigration.com
Tenant Portal:  portal.{tenantname}.com
API Access:     api.sehwagimmigration.com
```

#### **Data Isolation Strategy**

```typescript
// Every database record includes tenantId
interface BaseDocument {
  tenantId: ObjectId;
  // ... other fields
}

// Automatic tenant filtering in queries
const profiles = await Profile.find({ 
  tenantId: req.tenantId,
  // ... other filters
});
```

### **Tenant Resolution Middleware**

```typescript
// Automatic tenant detection from domain
export const resolveTenant = async (req, res, next) => {
  const host = req.get('host');
  const { tenantDomain, isSuperAdmin } = parseDomain(host);
  
  if (isSuperAdmin) {
    req.isSuperAdmin = true;
    return next();
  }
  
  if (tenantDomain) {
    const tenant = await Tenant.findOne({ domain: tenantDomain });
    req.tenant = tenant;
    req.tenantId = tenant?._id;
  }
  
  next();
};
```

### **Row-Level Security**

```typescript
// Bulletproof data isolation
export const bulletproofTenantIsolation = () => {
  return (req, res, next) => {
    const context = DataIsolationService.createTenantContext(req);
    
    // Validate tenant context
    if (!DataIsolationService.validateTenantContext(context, 'find')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tenant context'
      });
    }
    
    // Attach isolation helpers
    req.createTenantQuery = (baseQuery = {}) => 
      DataIsolationService.createTenantQuery(context, baseQuery);
    
    next();
  };
};
```

---

## 🔐 Authentication & Authorization

### **User Roles & Permissions**

#### **Role Hierarchy**
```
Super Admin (super_admin)
├── Full system access
├── Tenant management
├── User management across all tenants
└── System configuration

Tenant Admin (admin)
├── Tenant-specific user management
├── Tenant analytics and reporting
├── Tenant configuration
└── Client profile management

Tenant User (user)
├── Personal profile management
├── Document upload and management
├── CRS score calculation
└── Application tracking
```

#### **Permission System**

```typescript
interface User {
  role: 'admin' | 'user' | 'super_admin';
  permissions: string[];
  tenantId?: ObjectId;
}

// Permission examples
const permissions = [
  'users:read',
  'users:write',
  'profiles:read',
  'profiles:write',
  'documents:upload',
  'analytics:view',
  'settings:manage'
];
```

### **Authentication Flow**

#### **Login Process**
1. **User Authentication**: Email/password validation
2. **Tenant Resolution**: Domain-based tenant detection
3. **Role Validation**: Permission checking
4. **JWT Generation**: Secure token creation
5. **Session Management**: Secure session handling

#### **JWT Token Structure**

```typescript
interface JWTPayload {
  userId: string;
  tenantId?: string;
  role: string;
  iat: number;
  exp: number;
}
```

#### **Authentication Middleware**

```typescript
export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Validate user status
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};
```

### **Authorization Middleware**

```typescript
export const authorize = (roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Usage
router.get('/admin-only', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  adminController
);
```

---

## 🗄️ Database Schema

### **Core Models**

#### **User Model**

```typescript
interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'super_admin';
  tenantId?: ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  profile?: {
    avatar?: string;
    phoneNumber?: string;
    timezone?: string;
    language?: string;
  };
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Tenant Model**

```typescript
interface ITenant extends Document {
  name: string;
  domain: string;
  subdomain: string;
  isActive: boolean;
  settings: {
    theme?: string;
    logo?: string;
    customCSS?: string;
    features: string[];
  };
  subscription?: {
    planId: ObjectId;
    status: 'active' | 'inactive' | 'suspended';
    expiresAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Profile Model**

```typescript
interface IProfile extends Document {
  userId: ObjectId;
  tenantId: ObjectId;
  personalDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string;
    nationality: string;
    passportNumber: string;
    phoneNumber: string;
    email: string;
    currentAddress: string;
  };
  educationalDetails: {
    highestEducation: string;
    institution: string;
    fieldOfStudy: string;
    graduationYear: string;
    eca?: {
      hasECA: boolean;
      organization?: string;
      date?: string;
      equivalency?: string;
    };
  };
  employmentDetails: {
    currentEmployer: string;
    jobTitle: string;
    startDate: string;
    endDate: string;
    workHistory: Array<{
      jobTitle: string;
      nocCode: string;
      country: string;
      startDate: string;
      endDate: string;
      isCanadian: boolean;
    }>;
  };
  travelHistory: {
    internationalVisits: Array<{
      country: string;
      purpose: string;
      startDate: string;
      endDate: string;
      visaType: string;
    }>;
  };
  visaHistory?: {
    canada?: {
      hasAppliedBefore: boolean;
      entries: Array<{
        visaType: string;
        result: 'Approved' | 'Rejected' | '';
        uciNumber?: string;
        applicationNumbers?: string[];
      }>;
    };
  };
  crs?: Record<string, unknown>;
  languageAssessment?: Record<string, unknown>;
  spouse?: Record<string, unknown>;
  documentsChecklist?: Record<string, unknown>;
}
```

#### **Subscription Model**

```typescript
interface ISubscription extends Document {
  tenantId: ObjectId;
  planId: ObjectId;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  startDate: Date;
  endDate: Date;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    maxUsers: number;
    maxStorage: number;
    maxApiCalls: number;
  };
  usage: {
    currentUsers: number;
    storageUsed: number;
    apiCallsThisMonth: number;
  };
}
```

### **Database Indexes**

```typescript
// User indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ tenantId: 1, isActive: 1 });

// Profile indexes
profileSchema.index({ userId: 1 }, { unique: true });
profileSchema.index({ tenantId: 1 });
profileSchema.index({ tenantId: 1, 'personalDetails.nationality': 1 });

// Tenant indexes
tenantSchema.index({ domain: 1 }, { unique: true });
tenantSchema.index({ subdomain: 1 }, { unique: true });
tenantSchema.index({ isActive: 1 });
```

---

## 🔌 API Endpoints

### **Authentication Endpoints**

```typescript
POST   /api/auth/login              // User login
POST   /api/auth/register           // User registration
POST   /api/auth/logout             // User logout
POST   /api/auth/refresh            // Token refresh
GET    /api/auth/permissions        // Get user permissions
GET    /api/auth/tenants            // Get user's tenants
POST   /api/auth/switch-tenant      // Switch tenant context
```

### **User Management Endpoints**

```typescript
GET    /api/users                   // Get users (admin only)
GET    /api/users/me                // Get current user
PUT    /api/users/me                // Update current user
DELETE /api/users/:id               // Delete user (admin only)
POST   /api/users                   // Create user (admin only)
PUT    /api/users/:id               // Update user (admin only)
```

### **Profile Management Endpoints**

```typescript
GET    /api/profiles                // Get user profile
PUT    /api/profiles                // Update profile
GET    /api/profiles/progress       // Get profile completion
POST   /api/profiles/assess         // Profile assessment
GET    /api/profiles/crs-score      // Calculate CRS score
```

### **Tenant Management Endpoints**

```typescript
GET    /api/tenants                 // Get tenants (super admin)
POST   /api/tenants                 // Create tenant (super admin)
PUT    /api/tenants/:id             // Update tenant
DELETE /api/tenants/:id             // Delete tenant (super admin)
GET    /api/tenants/resolve/subdomain/:subdomain  // Resolve tenant
```

### **Document Management Endpoints**

```typescript
GET    /api/files                   // Get files
POST   /api/files/upload            // Upload file
DELETE /api/files/:id               // Delete file
GET    /api/files/:id/download      // Download file
```

### **Analytics & Reporting Endpoints**

```typescript
GET    /api/analytics/dashboard     // Dashboard analytics
GET    /api/analytics/users         // User analytics
GET    /api/analytics/profiles      // Profile analytics
GET    /api/reports/export          // Export reports
```

---

## 🎨 Frontend Components

### **Component Architecture**

#### **Common Components**

```typescript
// DashboardHeader.tsx - Unified header component
interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'default' | 'compact' | 'minimal';
  showRefresh?: boolean;
  showLogout?: boolean;
  showProfile?: boolean;
  showSettings?: boolean;
  onRefresh?: () => void;
  onLogout?: () => void;
  customActions?: React.ReactNode;
}

// UserProfileDropdown.tsx - User profile menu
interface UserProfileDropdownProps {
  user: User;
  onLogout: () => void;
  onProfileClick: () => void;
}

// TenantContextIndicator.tsx - Tenant context display
interface TenantContextIndicatorProps {
  tenant: Tenant;
  showSwitcher?: boolean;
}
```

#### **CRS Components**

```typescript
// CrsScoreCard.tsx - CRS score display
interface CrsScoreCardProps {
  score: number;
  breakdown: CrsBreakdown;
  lastUpdated: Date;
}

// CrsBreakdownChart.tsx - Score breakdown visualization
interface CrsBreakdownChartProps {
  breakdown: CrsBreakdown;
  showDetails?: boolean;
}

// CrsDetailedGrid.tsx - Detailed score grid
interface CrsDetailedGridProps {
  breakdown: CrsBreakdown;
  editable?: boolean;
  onChange?: (breakdown: CrsBreakdown) => void;
}
```

#### **Dashboard Components**

```typescript
// SuperAdminDashboard.tsx
interface SuperAdminDashboardProps {
  stats: {
    totalTenants: number;
    totalUsers: number;
    totalRevenue: number;
    systemHealth: string;
  };
}

// TenantAdminDashboard.tsx
interface TenantAdminDashboardProps {
  tenant: Tenant;
  stats: {
    totalUsers: number;
    activeProfiles: number;
    completedApplications: number;
  };
}

// UserDashboard.tsx
interface UserDashboardProps {
  user: User;
  profile: Profile;
  progress: ProfileProgress;
}
```

### **State Management**

#### **Auth Store (Zustand)**

```typescript
interface AuthStore {
  // State
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshToken: () => Promise<void>;
}
```

#### **Tenant Context**

```typescript
interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
}
```

### **Custom Hooks**

```typescript
// useAuth.ts
export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  return { user, isAuthenticated, login, logout };
};

// useTenantData.ts
export const useTenantData = () => {
  const { tenant, isLoading, error } = useContext(TenantContext);
  return { tenant, isLoading, error };
};

// useDashboardData.ts
export const useDashboardData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData
  });
  return { data, isLoading, error };
};
```

---

## 🔒 Security Features

### **Authentication Security**

#### **Password Security**
```typescript
// bcryptjs password hashing
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password validation
const isValid = await bcrypt.compare(password, hashedPassword);
```

#### **JWT Security**
```typescript
// Secure JWT generation
const token = jwt.sign(
  { userId, tenantId, role },
  config.jwtSecret,
  { 
    expiresIn: '7d',
    issuer: 'immigration-portal',
    audience: 'immigration-portal-users'
  }
);
```

### **Input Validation & Sanitization**

#### **Express Validator**
```typescript
// Request validation
const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').trim().escape(),
  body('lastName').trim().escape()
];
```

#### **MongoDB Sanitization**
```typescript
// Prevent NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_'
}));
```

#### **XSS Protection**
```typescript
// XSS prevention
app.use(xss({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
}));
```

### **Rate Limiting**

```typescript
// API rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});
```

### **CORS Configuration**

```typescript
// CORS security
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://www.sehwagimmigration.com',
      'https://portal.sehwagimmigration.com',
      'http://localhost:5175'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### **Security Headers**

```typescript
// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.sehwagimmigration.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## ⚡ Performance Optimizations

### **API Performance**

#### **Caching Strategy**
```typescript
// Redis caching for frequently accessed data
const cacheKey = `tenant:${tenantId}:data`;
const cachedData = await redis.get(cacheKey);

if (cachedData) {
  return JSON.parse(cachedData);
}

const data = await fetchFromDatabase();
await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min TTL
```

#### **Database Optimization**
```typescript
// Optimized queries with proper indexing
const profiles = await Profile.find({
  tenantId: new ObjectId(tenantId),
  'personalDetails.nationality': 'Canada'
})
.select('personalDetails.firstName personalDetails.lastName crs')
.limit(50)
.sort({ createdAt: -1 });
```

#### **API Response Optimization**
```typescript
// Response compression
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

### **Frontend Performance**

#### **Code Splitting**
```typescript
// Lazy loading components
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/SuperAdminDashboard'));
const TenantAdminDashboard = lazy(() => import('./pages/tenant/TenantAdminDashboard'));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'));
```

#### **React Query Optimization**
```typescript
// Optimized data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['profile', userId],
  queryFn: () => fetchProfile(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false
});
```

#### **Bundle Optimization**
```typescript
// Vite configuration for optimal bundling
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    }
  }
});
```

### **Recent Performance Improvements**

#### **API Call Reduction**
- **Before**: 6-8 API calls during login/dashboard load
- **After**: 2-4 API calls (60-75% reduction)
- **Load Time**: 50-70% faster page loads

#### **Caching Implementation**
```typescript
// Tenant context caching
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cachedTenant = localStorage.getItem(`tenant:${tenantId}`);

if (cachedTenant) {
  const { data, timestamp } = JSON.parse(cachedTenant);
  if (Date.now() - timestamp < CACHE_DURATION) {
    return data;
  }
}
```

---

## 🧪 Testing & Monitoring

### **Testing Strategy**

#### **Unit Testing (Jest)**
```typescript
// User service tests
describe('AuthService', () => {
  test('should authenticate valid user', async () => {
    const result = await AuthService.login('test@example.com', 'password123');
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
  });
  
  test('should reject invalid credentials', async () => {
    await expect(
      AuthService.login('invalid@example.com', 'wrongpassword')
    ).rejects.toThrow('Invalid email or password');
  });
});
```

#### **Integration Testing**
```typescript
// API endpoint tests
describe('POST /api/auth/login', () => {
  test('should return JWT token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
```

#### **End-to-End Testing (Playwright)**
```typescript
// Browser automation tests
test('user login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});
```

### **Monitoring & Observability**

#### **Error Tracking (Sentry)**
```typescript
// Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app })
  ]
});
```

#### **Performance Monitoring**
```typescript
// Custom performance monitoring
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    // Send to monitoring service
    if (duration > 1000) {
      console.warn(`Slow request: ${req.path} took ${duration}ms`);
    }
  });
  
  next();
};
```

#### **API Call Monitoring**
```typescript
// Real-time API monitoring
const apiMonitor = {
  calls: [],
  
  logCall: (method, url, duration, status) => {
    this.calls.push({
      method,
      url,
      duration,
      status,
      timestamp: new Date()
    });
  },
  
  getStats: () => {
    return {
      totalCalls: this.calls.length,
      averageDuration: this.calls.reduce((sum, call) => sum + call.duration, 0) / this.calls.length,
      errorRate: this.calls.filter(call => call.status >= 400).length / this.calls.length
    };
  }
};
```

---

## 🚀 Deployment

### **Environment Configuration**

#### **Development Environment**
```bash
# .env.development
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/immigration-app-dev
JWT_SECRET=dev-secret-change-in-production
FRONTEND_URL=http://localhost:5175
REDIS_URL=redis://localhost:6379
```

#### **Production Environment**
```bash
# .env.production
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/immigration-app
JWT_SECRET=super-secure-production-secret
FRONTEND_URL=https://www.sehwagimmigration.com
REDIS_URL=redis://production-redis:6379
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key
```

### **Docker Configuration**

#### **Backend Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

#### **Frontend Dockerfile**
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### **Docker Compose**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/immigration-app
    depends_on:
      - mongo
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

### **CI/CD Pipeline**

#### **GitHub Actions**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test
      
      - name: Run linting
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Deployment commands
          docker-compose up -d --build
```

---

## 🔧 Development Workflow

### **Project Setup**

#### **Prerequisites**
- Node.js ≥ 18.0.0
- MongoDB ≥ 6.0
- Redis (optional, for caching)
- Git

#### **Installation**
```bash
# Clone repository
git clone https://github.com/your-org/immigration-portal.git
cd immigration-portal

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development servers
cd ../backend
npm run dev

# In another terminal
cd frontend
npm run dev
```

### **Development Scripts**

#### **Backend Scripts**
```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts"
  }
}
```

#### **Frontend Scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "lint:fix": "eslint . --ext ts,tsx --fix"
  }
}
```

### **Code Quality**

#### **ESLint Configuration**
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
}
```

#### **Prettier Configuration**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### **Git Workflow**

#### **Branch Strategy**
```
main
├── develop
│   ├── feature/user-authentication
│   ├── feature/crs-calculator
│   └── feature/document-upload
├── hotfix/critical-security-fix
└── release/v1.2.0
```

#### **Commit Convention**
```
feat: add CRS score calculation
fix: resolve tenant isolation issue
docs: update API documentation
style: format code with prettier
refactor: optimize database queries
test: add unit tests for auth service
chore: update dependencies
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check MongoDB connection
mongosh "mongodb://localhost:27017/immigration-app"

# Verify environment variables
echo $MONGODB_URI

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

#### **Authentication Issues**
```typescript
// Debug JWT token
const token = req.header('Authorization')?.replace('Bearer ', '');
const decoded = jwt.decode(token);
console.log('Token payload:', decoded);

// Check user status
const user = await User.findById(decoded.userId);
console.log('User status:', user?.isActive);
```

#### **Tenant Resolution Issues**
```typescript
// Debug tenant resolution
console.log('Host:', req.get('host'));
console.log('Tenant domain:', req.tenantDomain);
console.log('Is super admin:', req.isSuperAdmin);
console.log('Tenant ID:', req.tenantId);
```

### **Performance Issues**

#### **Slow API Responses**
```typescript
// Add performance logging
const start = Date.now();
// ... API logic
const duration = Date.now() - start;
console.log(`API call took ${duration}ms`);

// Check database indexes
db.profiles.getIndexes();
db.users.getIndexes();
```

#### **Memory Leaks**
```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB'
  });
}, 30000);
```

### **Debugging Tools**

#### **API Monitoring**
```bash
# Run API monitoring script
node api-monitor.js

# Check API call patterns
node browser-api-monitor.js
```

#### **Database Debugging**
```bash
# Check slow queries
db.setProfilingLevel(2, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(5);

# Analyze query performance
db.profiles.explain().find({ tenantId: ObjectId("...") });
```

#### **Frontend Debugging**
```typescript
// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add to App.tsx
<ReactQueryDevtools initialIsOpen={false} />

// Zustand DevTools
import { devtools } from 'zustand/middleware';

const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // store implementation
    }),
    { name: 'auth-store' }
  )
);
```

---

## 📚 Additional Resources

### **Documentation Links**
- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Security Guidelines](./SECURITY_GUIDELINES.md)

### **External Resources**
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### **Support & Contact**
- **Technical Support**: support@sehwagimmigration.com
- **Documentation**: docs@sehwagimmigration.com
- **Security Issues**: security@sehwagimmigration.com

---

*This documentation is maintained by the Immigration Portal development team. Last updated: December 2024*
