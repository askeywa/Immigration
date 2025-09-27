// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';
import { validateEmail, validatePassword, validateName } from '../utils/validation';
import { TenantRequest } from '../middleware/tenantResolution';
import { TenantAwareService } from '../middleware/rowLevelSecurity';
import { SessionService } from '../services/sessionService';
import { log } from '../utils/logger';

export const login = asyncHandler(async (req: TenantRequest, res: Response) => {
  const { email, password, tenantDomain } = req.body;

  // SECURITY: Comprehensive input validation
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Email and password are required' 
    });
  }

  // SECURITY: Validate input types and lengths
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid input format' 
    });
  }

  if (email.length > 254 || password.length > 128) {
    return res.status(400).json({ 
      success: false,
      message: 'Input too long' 
    });
  }

  // SECURITY: Validate email format
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return res.status(400).json({ 
      success: false,
      message: emailValidation.error 
    });
  }

  // SECURITY: Validate tenant domain if provided
  if (tenantDomain && (typeof tenantDomain !== 'string' || tenantDomain.length > 255)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid tenant domain format' 
    });
  }

  try {
    // Get tenant context from request (set by tenant resolution middleware)
    const tenantId = req.tenantId;
    const isSuperAdmin = req.isSuperAdmin;
    
    log.info('Login attempt', { email, tenantId, isSuperAdmin });
    
    const { user, token, tenant, subscription } = await AuthService.login(email, password, tenantDomain, tenantId);
    
    log.info('AuthService.login completed', { userId: user._id?.toString(), tenantId: tenant?._id?.toString() });
    
    // Create secure session (with timeout protection)
    try {
      const sessionPromise = SessionService.createSession(req, res, {
        userId: user._id?.toString() || '',
        userEmail: user.email,
        role: user.role,
        permissions: user.permissions || [],
        tenantId: tenant?._id?.toString() || '',
        tenantName: tenant?.name,
        tenantDomain: tenant?.domain,
        isSuperAdmin: isSuperAdmin || false,
        mfaVerified: false, // TODO: Integrate with MFA service
        sessionType: 'web',
        deviceId: req.headers['x-device-id'] as string
      });
      
      // Add timeout to session creation
      await Promise.race([
        sessionPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 5000))
      ]);
      
      log.info('Session created successfully');
    } catch (sessionError) {
      log.warn('Session creation failed, continuing without session', { error: sessionError instanceof Error ? sessionError.message : String(sessionError) });
      // Continue without failing the login - session is optional for JWT-based auth
    }
    
    // Set tenant context headers for frontend
    if (tenant) {
      res.set('X-Tenant-ID', (tenant._id as any).toString());
      res.set('X-Tenant-Name', tenant.name);
      res.set('X-Tenant-Domain', tenant.domain);
    }
    
    if (isSuperAdmin) {
      res.set('X-Is-Super-Admin', 'true');
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      data: { 
        user, 
        token,
        tenant: tenant || null,
        subscription: subscription || null
      },
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Login failed' 
    });
  }
 });

export const register = asyncHandler(async (req: TenantRequest, res: Response) => {
  const { email, password, firstName, lastName, role, companyName, domain } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ 
      success: false,
      message: 'Email, password, first name, and last name are required' 
    });
  }

  // Validate input data
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return res.status(400).json({ 
      success: false,
      message: emailValidation.error 
    });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ 
      success: false,
      message: passwordValidation.error 
    });
  }

  const firstNameValidation = validateName(firstName);
  if (!firstNameValidation.isValid) {
    return res.status(400).json({ 
      success: false,
      message: firstNameValidation.error 
    });
  }

  const lastNameValidation = validateName(lastName);
  if (!lastNameValidation.isValid) {
    return res.status(400).json({ 
      success: false,
      message: lastNameValidation.error 
    });
  }

  try {
    // Get tenant context from request
    const tenantId = req.tenantId;
    const isSuperAdmin = req.isSuperAdmin;
    
    const { user, token, tenant, subscription } = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
      role: role || 'user',
      companyName,
      domain,
      tenantId,
    });
    
    // Set tenant context headers for frontend
    if (tenant) {
      res.set('X-Tenant-ID', (tenant._id as any).toString());
      res.set('X-Tenant-Name', tenant.name);
      res.set('X-Tenant-Domain', tenant.domain);
    }
    
    if (isSuperAdmin) {
      res.set('X-Is-Super-Admin', 'true');
    }
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { 
        user, 
        token,
        tenant: tenant || null,
        subscription: subscription || null
      },
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Registration failed' 
    });
  }
});

export const getUserPermissions = asyncHandler(async (req: TenantRequest, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = req.tenantId;
    const isSuperAdmin = req.isSuperAdmin;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // For Super Admin, return all permissions
    if (isSuperAdmin || user.role === 'super_admin') {
      const allPermissions = [
        'user.create', 'user.read', 'user.update', 'user.delete',
        'profile.create', 'profile.read', 'profile.update', 'profile.delete',
        'tenant.create', 'tenant.read', 'tenant.update', 'tenant.delete', 'tenant.manage',
        'role.create', 'role.read', 'role.update', 'role.delete', 'role.assign',
        'subscription.read', 'subscription.update', 'subscription.manage',
        'system.admin', 'system.monitor', 'system.configure',
        'reporting.read', 'reporting.create', 'reporting.export',
        'billing.read', 'billing.manage'
      ];
      
      return res.json({
        success: true,
        data: {
          permissions: allPermissions,
          role: user.role,
          tenantId: tenantId || null,
          isSuperAdmin: true
        }
      });
    }

    // For tenant users, return tenant-scoped permissions
    const tenantPermissions = user.permissions || [];
    
    // Add tenant context to response
    res.set('X-Tenant-ID', tenantId || '');
    
    res.json({
      success: true,
      data: {
        permissions: tenantPermissions,
        role: user.role,
        tenantId: tenantId || null,
        isSuperAdmin: false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Failed to get permissions'
    });
  }
});

// Get user's tenants (for users who belong to multiple tenants)
export const getUserTenants = asyncHandler(async (req: TenantRequest, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = req.tenantId;
    const isSuperAdmin = req.isSuperAdmin;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!tenantId && !isSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const tenants = await AuthService.getUserTenants(user._id);
    
    // Set tenant context headers
    if (tenantId) {
      res.set('X-Tenant-ID', tenantId);
    }
    
    res.json({
      success: true,
      data: { tenants }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Failed to get user tenants'
    });
  }
});

// Switch tenant context
export const switchTenant = asyncHandler(async (req: TenantRequest, res: Response) => {
  try {
    const user = (req as any).user;
    const { tenantId } = req.body;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const { user: updatedUser, token, tenant, subscription } = await AuthService.switchTenant(user._id, tenantId);
    
    // Set tenant context headers for frontend
    if (tenant) {
      res.set('X-Tenant-ID', (tenant._id as any).toString());
      res.set('X-Tenant-Name', tenant.name);
      res.set('X-Tenant-Domain', tenant.domain);
    }
    
    res.json({
      success: true,
      message: 'Tenant switched successfully',
      data: { 
        user: updatedUser, 
        token,
        tenant: tenant || null,
        subscription: subscription || null
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Failed to switch tenant'
    });
  }
});

// Refresh token with current tenant context
export const refreshToken = asyncHandler(async (req: TenantRequest, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = req.tenantId;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { token, tenant, subscription } = await AuthService.refreshToken(user._id, tenantId);
    
    // Set tenant context headers for frontend
    if (tenant) {
      res.set('X-Tenant-ID', (tenant._id as any).toString());
      res.set('X-Tenant-Name', tenant.name);
      res.set('X-Tenant-Domain', tenant.domain);
    }
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { 
        token,
        tenant: tenant || null,
        subscription: subscription || null
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Failed to refresh token'
    });
  }
});