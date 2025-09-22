// backend/src/services/tenantService.ts
import mongoose from 'mongoose';
import { Tenant, ITenant } from '../models/Tenant';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Profile } from '../models/Profile';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import bcrypt from 'bcryptjs';

export class TenantService {
  static async getAllTenants(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const tenants = await Tenant.find()
      .populate('subscription.planId', 'name displayName') // Only populate name and displayName
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Tenant.countDocuments();
    
    return {
      tenants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTenants: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  static async getTenantById(tenantId: string): Promise<ITenant | null> {
    return Tenant.findById(tenantId)
      .populate('subscription.planId', 'name displayName') // Only populate name and displayName
      .lean();
  }

  static async getTenantStats(tenantId: string) {
    const userCount = await User.countDocuments({ tenantId, isActive: true });
    const adminCount = await User.countDocuments({ tenantId, role: 'admin', isActive: true });
    const profileCount = await Profile.countDocuments({ userId: { $in: await User.find({ tenantId }).select('_id') } });
    
    const subscription = await Subscription.findOne({ tenantId }).populate('planId');
    
    return {
      userCount,
      adminCount,
      profileCount,
      subscription: subscription ? {
        status: subscription.status,
        plan: subscription.planId,
        usage: subscription.usage,
        billing: subscription.billing
      } : null
    };
  }

  static async updateTenant(tenantId: string, updateData: Partial<ITenant>): Promise<ITenant | null> {
    return Tenant.findByIdAndUpdate(
      tenantId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  static async suspendTenant(tenantId: string): Promise<boolean> {
    const result = await Tenant.findByIdAndUpdate(
      tenantId,
      { status: 'suspended', updatedAt: new Date() }
    );
    return !!result;
  }

  static async activateTenant(tenantId: string): Promise<boolean> {
    const result = await Tenant.findByIdAndUpdate(
      tenantId,
      { status: 'active', updatedAt: new Date() }
    );
    return !!result;
  }

  static async deleteTenant(tenantId: string): Promise<boolean> {
    // Soft delete - mark as cancelled
    const result = await Tenant.findByIdAndUpdate(
      tenantId,
      { status: 'cancelled', updatedAt: new Date() }
    );
    return !!result;
  }

  static async getTenantAnalytics() {
    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({ status: 'active' });
    const trialTenants = await Tenant.countDocuments({ status: 'trial' });
    const suspendedTenants = await Tenant.countDocuments({ status: 'suspended' });
    const cancelledTenants = await Tenant.countDocuments({ status: 'cancelled' });

    // Get recent tenant registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await Tenant.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      cancelledTenants,
      recentRegistrations
    };
  }

  static async getTenantUsers(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const users = await User.find({ tenantId })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments({ tenantId });
    
    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  static async createTenant(tenantData: {
    name: string;
    domain: string;
    description?: string;
    adminUser: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    };
    subscriptionPlan?: string;
  }) {
    const session = await Tenant.startSession();
    
    try {
      return await session.withTransaction(async () => {
        // 1. Create the tenant
        const tenant = new Tenant({
          name: tenantData.name,
          domain: tenantData.domain,
          description: tenantData.description || '',
          status: 'active',
          settings: {
            allowRegistration: true,
            requireEmailVerification: true,
            maxUsers: 100,
            features: {
              profiles: true,
              documents: true,
              analytics: true,
              reports: true
            }
          }
        });

        await tenant.save({ session });

        // 2. Get default subscription plan (or use provided one)
        let planId;
        if (tenantData.subscriptionPlan) {
          const plan = await SubscriptionPlan.findOne({ name: tenantData.subscriptionPlan });
          planId = plan?._id;
        } else {
          // Get the first available plan as default
          const defaultPlan = await SubscriptionPlan.findOne().sort({ createdAt: 1 });
          planId = defaultPlan?._id;
        }

        // 3. Create subscription for the tenant
        if (planId) {
          const subscription = new Subscription({
            tenantId: tenant._id,
            planId: planId,
            status: 'trial',
            billing: {
              amount: 0,
              currency: 'USD',
              billingCycle: 'monthly'
            },
            period: {
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
              trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            usage: {
              currentUsers: 1, // Admin user
              currentAdmins: 1,
              lastUpdated: new Date()
            }
          });

          await subscription.save({ session });

          // Update tenant with subscription reference
          tenant.subscription = {
            planId: planId as mongoose.Types.ObjectId,
            status: 'trial',
            startDate: subscription.period.startDate,
            endDate: subscription.period.endDate
          };
          await tenant.save({ session });
        }

        // 4. Create admin user for the tenant
        const hashedPassword = await bcrypt.hash(tenantData.adminUser.password, 12);
        
        const adminUser = new User({
          firstName: tenantData.adminUser.firstName,
          lastName: tenantData.adminUser.lastName,
          email: tenantData.adminUser.email,
          password: hashedPassword,
          role: 'admin',
          tenantId: tenant._id,
          isActive: true,
          isEmailVerified: true,
          permissions: [
            'user.create',
            'user.read',
            'user.update',
            'user.delete',
            'profile.create',
            'profile.read',
            'profile.update',
            'profile.delete',
            'tenant.manage',
            'billing.view',
            'analytics.view',
            'reports.view'
          ]
        });

        await adminUser.save({ session });

        return {
          tenant,
          adminUser: {
            id: adminUser._id,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            email: adminUser.email,
            role: adminUser.role
          },
          subscription: planId ? {
            planId,
            status: 'trial',
            isTrial: true,
            trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          } : null
        };
      });
    } finally {
      await session.endSession();
    }
  }
}