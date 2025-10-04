// backend/src/models/Tenant.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  domain: string; // Primary subdomain (e.g., "honeynwild.ibuyscrap.ca")
  customDomains: string[]; // Array of approved custom domains
  trustedDomains: string[]; // All trusted domains (computed)
  domainApprovals: Array<{
    domain: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: Date;
    approvedAt?: Date;
    approvedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
  }>;
  status: 'active' | 'suspended' | 'trial' | 'cancelled' | 'expired';
  settings: {
    maxUsers: number;
    maxAdmins: number;
    features: string[];
    customBranding?: {
      logo?: string;
      primaryColor?: string;
      companyName?: string;
    };
  };
  contactInfo: {
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  subscription?: {
    planId?: mongoose.Types.ObjectId;
    planName?: string;
    status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired';
    startDate?: Date;
    endDate?: Date;
    trialEndDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isActive(): boolean;
  isTrialExpired(): boolean;
  getAllTrustedDomains(): string[];
  hasDomainAccess(domain: string): boolean;
}

const tenantSchema = new Schema<ITenant>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  customDomains: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  domainApprovals: [{
    domain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
  }],
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial', 'cancelled', 'expired'],
    default: 'trial',
    index: true,
  },
  settings: {
    maxUsers: {
      type: Number,
      required: true,
      default: 25,
      min: 1,
      max: 10000,
    },
    maxAdmins: {
      type: Number,
      required: true,
      default: 2,
      min: 1,
      max: 100,
    },
    features: [{
      type: String,
      enum: ['basic', 'advanced', 'premium', 'enterprise'],
    }],
    customBranding: {
      logo: String,
      primaryColor: String,
      companyName: String,
    },
  },
  contactInfo: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  },
  subscription: {
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
    },
    planName: String,
    status: {
      type: String,
      enum: ['trial', 'active', 'suspended', 'cancelled', 'expired'],
      default: 'trial',
    },
    startDate: Date,
    endDate: Date,
    trialEndDate: Date,
  },
}, {
  timestamps: true,
});

// Indexes for domain lookups
tenantSchema.index({ customDomains: 1 });
tenantSchema.index({ 'domainApprovals.domain': 1 });
tenantSchema.index({ status: 1, createdAt: -1 });

// Virtual for all trusted domains
tenantSchema.virtual('trustedDomains').get(function() {
  return this.getAllTrustedDomains();
});

// Instance method to get all trusted domains
tenantSchema.methods.getAllTrustedDomains = function(): string[] {
  const domains = [this.domain]; // Primary subdomain
  
  // Add approved custom domains
  const approvedCustomDomains = this.customDomains || [];
  domains.push(...approvedCustomDomains);
  
  return [...new Set(domains)]; // Remove duplicates
};

// Instance method to check domain access
tenantSchema.methods.hasDomainAccess = function(domain: string): boolean {
  const trustedDomains = this.getAllTrustedDomains();
  return trustedDomains.includes(domain.toLowerCase());
};

// Instance method to check if tenant is active
tenantSchema.methods.isActive = function(): boolean {
  return this.status === 'active' || 
         (this.status === 'trial' && !this.isTrialExpired());
};

// Instance method to check if trial is expired
tenantSchema.methods.isTrialExpired = function(): boolean {
  if (this.status !== 'trial' || !this.subscription?.trialEndDate) {
    return false;
  }
  return new Date() > this.subscription.trialEndDate;
};

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);