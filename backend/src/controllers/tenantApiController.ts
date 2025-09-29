import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { TenantService } from '../services/tenantService';
import { AppError } from '../utils/errors';
import { log } from '../config/logging';
import { config } from '../config/config';

export class TenantApiController {
  /**
   * Tenant-specific login endpoint
   * POST /api/v1/tenant/auth/login
   */
  static async tenantLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const domain = req.get('host')?.split(':')[0] || '';
      
      log.info('Tenant login attempt', {
        email,
        domain,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      // Validate required fields
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      // Authenticate user with tenant context
      const result = await AuthService.login(email, password, domain);
      
      // Return tenant-specific response
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: result.user._id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            isActive: result.user.isActive
          },
          tenant: result.tenant ? {
            id: result.tenant._id,
            name: result.tenant.name,
            domain: result.tenant.domain,
            status: result.tenant.status
          } : null,
          subscription: result.subscription ? {
            id: result.subscription._id,
            status: result.subscription.status,
            planName: (result.subscription.planId as any)?.name || 'Unknown'
          } : null,
          token: result.token,
          frontendUrl: config.getFrontendUrl(domain)
        },
        message: 'Login successful'
      });

    } catch (error) {
      log.error('Tenant login failed', {
        error: error instanceof Error ? error.message : String(error),
        domain: req.get('host'),
        email: req.body?.email
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  }

  /**
   * Get tenant information
   * GET /api/v1/tenant/info
   */
  static async getTenantInfo(req: Request, res: Response): Promise<void> {
    try {
      const domain = req.get('host')?.split(':')[0] || '';
      
      // Find tenant by domain
      const tenant = await TenantService.getTenantByDomain(domain);
      
      if (!tenant) {
        throw new AppError('Tenant not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          id: tenant._id,
          name: tenant.name,
          domain: tenant.domain,
          status: tenant.status,
          settings: {
            maxUsers: tenant.settings?.maxUsers,
            features: tenant.settings?.features
          },
          contactInfo: {
            email: tenant.contactInfo?.email,
            phone: tenant.contactInfo?.phone
          },
          frontendUrl: config.getFrontendUrl(domain),
          apiUrl: config.getTenantApiUrl(domain)
        }
      });

    } catch (error) {
      log.error('Failed to get tenant info', {
        error: error instanceof Error ? error.message : String(error),
        domain: req.get('host')
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  }

  /**
   * Tenant user registration
   * POST /api/v1/tenant/auth/register
   */
  static async tenantRegister(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;
      const domain = req.get('host')?.split(':')[0] || '';
      
      log.info('Tenant registration attempt', {
        email,
        domain,
        ip: req.ip
      });

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        throw new AppError('All fields are required', 400);
      }

      // Find tenant by domain
      const tenant = await TenantService.getTenantByDomain(domain);
      if (!tenant) {
        throw new AppError('Tenant not found', 404);
      }

      // Register user for this tenant
      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role: 'user',
        tenantId: tenant._id.toString()
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.user._id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role
          },
          token: result.token,
          frontendUrl: config.getFrontendUrl(domain)
        },
        message: 'Registration successful'
      });

    } catch (error) {
      log.error('Tenant registration failed', {
        error: error instanceof Error ? error.message : String(error),
        domain: req.get('host'),
        email: req.body?.email
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  }

  /**
   * Get tenant login widget configuration
   * GET /api/v1/tenant/widget/config
   */
  static async getWidgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const domain = req.get('host')?.split(':')[0] || '';
      
      // Find tenant by domain
      const tenant = await TenantService.getTenantByDomain(domain);
      
      if (!tenant) {
        throw new AppError('Tenant not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          tenant: {
            id: tenant._id,
            name: tenant.name,
            domain: tenant.domain
          },
          apiEndpoints: {
            login: `${config.getTenantApiUrlByDomain(domain)}/tenant/auth/login`,
            register: `${config.getTenantApiUrlByDomain(domain)}/tenant/auth/register`,
            info: `${config.getTenantApiUrlByDomain(domain)}/tenant/info`
          },
          frontendUrl: config.getFrontendUrl(domain),
          branding: {
            logo: tenant.settings?.customBranding?.logo,
            primaryColor: tenant.settings?.customBranding?.primaryColor || '#3B82F6',
            companyName: tenant.settings?.customBranding?.companyName || tenant.name
          }
        }
      });

    } catch (error) {
      log.error('Failed to get widget config', {
        error: error instanceof Error ? error.message : String(error),
        domain: req.get('host')
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  }
}
