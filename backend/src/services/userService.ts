// backend/src/services/userService.ts
import { User, IUser } from '../models/User';
import { Profile } from '../models/Profile';
import mongoose from 'mongoose';

export class UserService {
  static async getAllUsers(page: number = 1, limit: number = 10, tenantId?: string, userRole?: string) {
    const skip = (page - 1) * limit;
    
    // Build query based on tenant context
    let query: Record<string, any> = { isActive: true };
    
    // SECURITY: Only super admins can access all users, enforce tenant isolation
    const isSuperAdmin = userRole === 'super_admin';
    
    // If not super admin, enforce tenant isolation
    if (!isSuperAdmin) {
      if (!tenantId) {
        throw new Error('Tenant ID is required for non-super-admin users');
      }
      query.tenantId = new mongoose.Types.ObjectId(tenantId);
    }
    
    const users = await User.find(query)
      .select('-password')
      .populate('tenantId', 'name domain status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);
    
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

  static async getUserById(userId: string, tenantId?: string, userRole?: string): Promise<IUser | null> {
    // Build query based on tenant context
    let query: Record<string, any> = { _id: userId };
    
    // SECURITY: Only super admins can access any user, enforce tenant isolation
    const isSuperAdmin = userRole === 'super_admin';
    
    // If not super admin, enforce tenant isolation
    if (!isSuperAdmin) {
      if (!tenantId) {
        throw new Error('Tenant ID is required for non-super-admin users');
      }
      query.tenantId = new mongoose.Types.ObjectId(tenantId);
    }
    
    return User.findOne(query).select('-password').populate('tenantId', 'name domain status');
  }

  static async updateUser(userId: string, updateData: Partial<IUser>, tenantId?: string, userRole?: string): Promise<IUser | null> {
    // Build query based on tenant context
    let query: Record<string, any> = { _id: userId };
    
    // SECURITY: Only super admins can update any user, enforce tenant isolation
    const isSuperAdmin = userRole === 'super_admin';
    
    // If not super admin, enforce tenant isolation
    if (!isSuperAdmin) {
      if (!tenantId) {
        throw new Error('Tenant ID is required for non-super-admin users');
      }
      query.tenantId = new mongoose.Types.ObjectId(tenantId);
    }
    
    // Ensure tenantId is preserved in updates for tenant users
    const updateFields = { ...updateData, updatedAt: new Date() };
    if (!isSuperAdmin && tenantId && !updateFields.tenantId) {
      updateFields.tenantId = new mongoose.Types.ObjectId(tenantId);
    }
    
    return User.findOneAndUpdate(
      query,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password').populate('tenantId', 'name domain status');
  }

  static async deleteUser(userId: string): Promise<boolean> {
    const result = await User.findByIdAndUpdate(
      userId,
      { isActive: false, updatedAt: new Date() }
    );
    return !!result;
  }

  static async getUserStats(tenantId?: string, isSuperAdmin?: boolean) {
    // Build base query based on tenant context
    let baseQuery: any = { isActive: true };
    
    // If not super admin and tenantId provided, filter by tenant
    if (!isSuperAdmin && tenantId) {
      (baseQuery as any).tenantId = new mongoose.Types.ObjectId(tenantId);
    }
    
    const totalUsers = await User.countDocuments(baseQuery);
    const adminUsers = await User.countDocuments({ ...baseQuery, role: 'admin' });
    const regularUsers = await User.countDocuments({ ...baseQuery, role: 'user' });
    
    // Build profile query based on tenant context
    let profileQuery: any = {};
    if (!isSuperAdmin && tenantId) {
      (profileQuery as any).tenantId = new mongoose.Types.ObjectId(tenantId);
    }
    
    const profilesCreated = await Profile.countDocuments(profileQuery);
    
    return {
      totalUsers,
      adminUsers,
      regularUsers,
      profilesCreated,
    };
  }
}