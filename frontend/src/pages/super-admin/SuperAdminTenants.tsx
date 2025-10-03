import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { tenantApiService } from '@/services/tenantApiService';
import { api } from '@/services/api';
import { useTenant } from '@/contexts/TenantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoSave } from '@/hooks/useAutoSave';
import { 
  EyeIcon, 
  CogIcon, 
  TrashIcon, 
  PlayIcon, 
  PauseIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  GlobeAltIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BellIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Color utility functions for status and plan badges
const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
    case 'suspended':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
    case 'trial':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
    case 'expired':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
  }
};

const getStatusIcon = (status: string): React.ReactNode => {
  switch (status?.toLowerCase()) {
    case 'active':
      return <CheckCircleIcon className="w-3 h-3" />;
    case 'suspended':
      return <XCircleIcon className="w-3 h-3" />;
    case 'trial':
      return <ClockIcon className="w-3 h-3" />;
    case 'cancelled':
      return <XCircleIcon className="w-3 h-3" />;
    case 'expired':
      return <ExclamationTriangleIcon className="w-3 h-3" />;
    default:
      return <ExclamationTriangleIcon className="w-3 h-3" />;
  }
};

const getPlanColor = (planName: string): string => {
  const plan = planName?.toLowerCase() || '';
  
  // Premium plans - Gold colors
  if (plan.includes('premium') || plan.includes('pro') || plan.includes('enterprise') || plan.includes('gold')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
  }
  
  // Standard plans - Silver colors  
  if (plan.includes('standard') || plan.includes('business') || plan.includes('silver') || plan.includes('basic')) {
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
  }
  
  // Bronze/Budget plans - Bronze colors
  if (plan.includes('bronze') || plan.includes('starter') || plan.includes('budget') || plan.includes('economy')) {
    return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700';
  }
  
  // Trial plans - Blue colors
  if (plan.includes('trial') || plan.includes('demo') || plan.includes('free')) {
    return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
  }
  
  // Custom plans - Purple colors
  if (plan.includes('custom') || plan.includes('special') || plan.includes('vip')) {
    return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700';
  }
  
  // Default/N/A - Gray colors
  return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
};

// Modal Component for better isolation
const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
  isDarkMode: boolean;
}> = ({ isOpen, onClose, children, isDarkMode }) => {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <div 
        className="modal-content"
        style={{
          position: 'relative',
          maxWidth: '42rem',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 10000,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

// Create Tenant Form Component
interface CreateTenantFormProps {
  onSubmit: (data: {
    name: string;
    domain: string;
    description?: string;
    adminUser: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    };
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
  fieldErrors?: {
    name?: string[];
    domain?: string[];
    adminUser?: {
      firstName?: string[];
      lastName?: string[];
      email?: string[];
      password?: string[];
    };
  };
  resetTrigger?: number; // Add reset trigger prop
}

const CreateTenantForm: React.FC<CreateTenantFormProps> = ({ onSubmit, onCancel, isLoading, fieldErrors = {}, resetTrigger }) => {
  // Use refs for uncontrolled inputs to ensure they start completely empty
  const nameRef = React.useRef<HTMLInputElement>(null);
  const domainRef = React.useRef<HTMLInputElement>(null);
  const firstNameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  // Clear fields when component mounts (modal opens) or when resetTrigger changes
  React.useEffect(() => {
    // Clear fields when modal opens or reset is triggered
    if (nameRef.current) nameRef.current.value = '';
    if (domainRef.current) domainRef.current.value = '';
    if (firstNameRef.current) firstNameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    if (passwordRef.current) passwordRef.current.value = '';
  }, [resetTrigger]); // Run on mount and when resetTrigger changes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Collect data from refs
    const fullName = firstNameRef.current?.value?.trim() || '';
    const nameParts = fullName.split(' ');
    
    const formData = {
      name: nameRef.current?.value || '',
      domain: domainRef.current?.value || '',
      description: '',
      adminUser: {
        firstName: nameParts[0] || '',
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0] || '', // Use firstName as lastName if no last name provided
        email: emailRef.current?.value || '',
        password: passwordRef.current?.value || ''
      }
    };
    
    // Validate required fields
    if (!formData.name.trim()) {
      return;
    }
    if (!formData.domain.trim()) {
      return;
    }
    if (!formData.adminUser.firstName.trim()) {
      return;
    }
    if (!formData.adminUser.email.trim()) {
      return;
    }
    if (!formData.adminUser.password.trim()) {
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      {/* Professional Form Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-full">
            <BuildingOfficeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100">New Organization Setup</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Configure your new organization with admin access and custom domain settings
            </p>
          </div>
        </div>
      </div>

      {/* Simplified Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tenant Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Name *
          </label>
          <Input
            ref={nameRef}
            type="text"
            placeholder="e.g., Acme Corporation"
            defaultValue=""
            required
            className={fieldErrors.name ? 'border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400' : ''}
          />
          {fieldErrors.name && (
            <div className="mt-1">
              {fieldErrors.name.map((error, index) => (
                <p key={index} className="text-sm text-red-600 dark:text-red-400">{error}</p>
              ))}
            </div>
          )}
        </div>

        {/* Domain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Website Domain *
          </label>
          <Input
            ref={domainRef}
            type="text"
            placeholder="e.g., acme.immigration.com"
            defaultValue=""
            required
            className={fieldErrors.domain ? 'border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400' : ''}
          />
          {fieldErrors.domain && (
            <div className="mt-1">
              {fieldErrors.domain.map((error, index) => (
                <p key={index} className="text-sm text-red-600 dark:text-red-400">{error}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Contact */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Admin Contact</h4>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name *
            </label>
            <Input
              ref={firstNameRef}
              type="text"
              placeholder="e.g., John Smith"
              defaultValue=""
              required
              className={fieldErrors.adminUser?.firstName || fieldErrors.adminUser?.lastName ? 'border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400' : ''}
            />
            {(fieldErrors.adminUser?.firstName || fieldErrors.adminUser?.lastName) && (
              <div className="mt-1">
                {[...(fieldErrors.adminUser.firstName || []), ...(fieldErrors.adminUser.lastName || [])].map((error, index) => (
                  <p key={index} className="text-sm text-red-600 dark:text-red-400">{error}</p>
                ))}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <Input
              ref={emailRef}
              type="email"
              placeholder="e.g., admin@acme.com"
              defaultValue=""
              required
              className={fieldErrors.adminUser?.email ? 'border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400' : ''}
            />
            {fieldErrors.adminUser?.email && (
              <div className="mt-1">
                {fieldErrors.adminUser.email.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 dark:text-red-400">{error}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Admin Password *
          </label>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            🔐 Create a strong password for the admin account
          </div>
          <Input
            ref={passwordRef}
            type="password"
            placeholder="Create a strong password"
            defaultValue=""
            required
            minLength={8}
            className={fieldErrors.adminUser?.password ? 'border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400' : ''}
          />
          {fieldErrors.adminUser?.password && (
            <div className="mt-1">
              {fieldErrors.adminUser.password.map((error, index) => (
                <p key={index} className="text-sm text-red-600 dark:text-red-400">{error}</p>
              ))}
            </div>
          )}
          {/* Password strength indicators removed for simplicity with uncontrolled inputs */}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>Create Tenant</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};

interface Tenant {
  _id: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended' | 'trial' | 'cancelled' | 'expired';
  createdAt: string;
  contactInfo?: {
    email: string;
    phone?: string;
    address?: string;
  };
  settings?: {
    maxUsers: number;
    maxAdmins: number;
    features: string[];
    branding?: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  };
  subscription?: {
    planName: string;
    status: string;
    expiresAt?: string;
    billing?: {
      amount: number;
      currency: string;
      cycle: string;
    };
  };
}

interface TenantStats {
  userCount: number;
  adminCount: number;
  profileCount: number;
  subscription?: {
    status: string;
    plan: any;
    usage: any;
    billing: any;
  };
}

interface TenantDetails extends Tenant {
  stats?: TenantStats;
  users?: any[];
  userCount?: number;
  activeUserCount?: number;
  lastLogin?: string;
  subscriptionDetails?: any;
  settings?: any;
  usage?: any;
  analytics?: any;
  originalData?: any;
  hasChanges?: boolean;
}

const SuperAdminTenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalResetTrigger, setCreateModalResetTrigger] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<{
    name?: string[];
    domain?: string[];
    adminUser?: {
      firstName?: string[];
      lastName?: string[];
      email?: string[];
      password?: string[];
    };
  }>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTenants, setTotalTenants] = useState(0);
  const [itemsPerPage] = useState(10);
  
  // Statistics state (for all tenants, not just current page)
  const [tenantStats, setTenantStats] = useState({
    total: 0,
    active: 0,
    trial: 0,
    suspended: 0
  });
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Auto-save hook for unsaved changes
  useAutoSave({
    type: 'super-admin',
    data: {
      tenants,
      selectedTenant,
      editFormData,
      searchTerm,
      currentPage,
      totalPages
    },
    enabled: true
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'success' });
  
  const { tenant: currentTenant } = useTenant();

  // Helper function to show notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ show: true, message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    fetchTenants();
  }, [currentPage, statusFilter, sortBy, sortOrder]);

  // Force re-render when search term changes
  useEffect(() => {
    console.log(`🔍 Search term changed to: "${searchTerm}"`);
  }, [searchTerm]);

  // Fetch all tenants for statistics (separate from paginated data)
  const fetchAllTenantsForStats = async () => {
    try {
      tenantApiService.setTenantContext({
        isSuperAdmin: true,
        includeTenantContext: false
      });
      
      // Fetch with high limit to get all tenants for statistics
      const response = await tenantApiService.getAllTenants(1, 1000);
      const allTenants = response.data?.tenants || [];
      
      const stats = {
        total: allTenants.length,
        active: allTenants.filter(t => t.status === 'active').length,
        trial: allTenants.filter(t => t.status === 'trial').length,
        suspended: allTenants.filter(t => t.status === 'suspended').length,
      };
      
      setTenantStats(stats);
      console.log('🔍 SuperAdminTenants: Updated tenant statistics:', stats);
    } catch (error) {
      console.error('❌ SuperAdminTenants: Error fetching tenant stats:', error);
    }
  };

  // Fetch stats when component mounts
  useEffect(() => {
    fetchAllTenantsForStats();
  }, []);

  // Dark mode detection for portal content
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      console.log('🔍 SuperAdminTenants: Starting fetchTenants...');
      
      // Configure tenantApiService for super admin context
      tenantApiService.setTenantContext({
        isSuperAdmin: true,
        includeTenantContext: false // Super admin calls don't need tenant context
      });
      
      // Fetch ALL tenants for client-side filtering and pagination
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = Date.now();
      const response = await tenantApiService.getAllTenants(1, 1000, cacheBuster); // Get all tenants
      console.log('🔍 SuperAdminTenants: API response:', response);
      console.log('🔍 SuperAdminTenants: Tenants data:', response.data?.tenants);
      console.log('🔍 SuperAdminTenants: Pagination data:', response.pagination);
      
      // CRITICAL: Extract pagination FIRST before setting tenants
      const paginationData = response.pagination || {};
      const tenantsData = response.data?.tenants || [];
      
      // Set all state in proper order
      setTenants(tenantsData); // Now contains ALL tenants
      setTotalPages(paginationData.totalPages || 1);
      setTotalTenants(paginationData.totalTenants || paginationData.totalCount || tenantsData.length);
      
      // Debug: Log subscription data for each tenant
      console.log('🔍 SuperAdminTenants: Tenant subscription data:');
      tenantsData.forEach((tenant, index) => {
        if (tenant.subscription) {
          console.log(`   Tenant ${index + 1} "${tenant.name}":`, {
            planName: tenant.subscription.planName || 'N/A',
            status: tenant.subscription.status,
            fullSubscription: tenant.subscription
          });
        } else {
          console.log(`   Tenant ${index + 1} "${tenant.name}": No subscription data`);
        }
      });
      
      console.log('🔍 SuperAdminTenants: Pagination set:', {
        totalPages: paginationData.totalPages,
        totalTenants: paginationData.totalTenants,
        currentPage: currentPage,
        shouldShowPagination: (paginationData.totalPages || 1) > 1
      });
      
    } catch (error) {
      console.error('❌ SuperAdminTenants: Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'trial': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'inactive': return <XCircleIcon className="w-4 h-4" />;
      case 'suspended': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'trial': return <ClockIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getPlanColor = (planName: string) => {
    const plan = planName?.toLowerCase() || '';
    
    // Premium plans - Gold colors
    if (plan.includes('premium') || plan.includes('enterprise')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
    }
    
    // Standard plans - Silver colors  
    if (plan.includes('standard') || plan.includes('business')) {
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
    }
    
    // Basic plans - Blue colors
    if (plan.includes('basic')) {
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
    }
    
    // Trial plans - Orange colors
    if (plan.includes('trial')) {
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700';
    }
    
    // Default - Gray
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
  };

  // Apply filters and sorting
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = searchTerm === '' || 
                         tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    
    // Debug logging
    if (searchTerm !== '') {
      console.log(`🔍 Search debug - Tenant: "${tenant.name}", Domain: "${tenant.domain}", Email: "${tenant.contactInfo?.email}"`);
      console.log(`🔍 Search term: "${searchTerm}", Matches: ${matchesSearch}`);
    }
    
    return matchesSearch && matchesStatus;
  });
  
  // Debug: Log filtering results
  console.log(`🔍 Filtering results: ${tenants.length} total tenants, ${filteredTenants.length} after filtering`);

  // Pagination helpers - Use filtered tenants for display
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTenants = filteredTenants.slice(startIndex, endIndex);
  const totalFilteredPages = Math.ceil(filteredTenants.length / itemsPerPage);
  
  // Debug: Log pagination results
  console.log(`🔍 Pagination debug - Page: ${currentPage}, Items per page: ${itemsPerPage}, Start: ${startIndex}, End: ${endIndex}`);
  console.log(`🔍 Paginated tenants: ${paginatedTenants.length} tenants to display`);
  console.log(`🔍 Current search term: "${searchTerm}"`);
  console.log(`🔍 Component re-rendering with ${paginatedTenants.length} tenants to display`);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const createTenant = async (tenantData: {
    name: string;
    domain: string;
    description?: string;
    adminUser: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    };
  }) => {
    setIsCreating(true);
    setCreateError(null);
    setCreateFieldErrors({});

    try {
      console.log('🔍 SuperAdminTenants: Creating tenant with data:', tenantData);
      
      // Remove description field as it's not expected by backend and causes 500 errors
      const { description, ...cleanTenantData } = tenantData;
      
      // Add subscriptionPlan field as it's required by backend
      const finalTenantData = {
        ...cleanTenantData,
        subscriptionPlan: 'Gold' // Default to Gold plan
      };
      
      console.log('🔍 SuperAdminTenants: Sending final data (without description, with subscriptionPlan):', finalTenantData);
      
      // Configure tenantApiService for super admin context
      tenantApiService.setTenantContext({
        isSuperAdmin: true,
        includeTenantContext: false // Super admin calls don't need tenant context
      });
      
      // Use tenantApiService to create tenant with proper authentication
      const response = await tenantApiService.post('/tenants', finalTenantData);
      
      console.log('🔍 SuperAdminTenants: Create tenant response:', response);
      
      // Check if the API response indicates success
      console.log('🔍 SuperAdminTenants: Response structure check:', {
        responseSuccess: response.success,
        hasResponseData: !!response.data,
        responseDataType: typeof response.data,
        responseDataKeys: response.data ? Object.keys(response.data) : []
      });
      
      if (response.success && response.data) {
        // Check if the backend response also indicates success
        const backendResponse = response.data;
        console.log('🔍 SuperAdminTenants: Backend response check:', {
          backendSuccess: backendResponse.success,
          backendSuccessType: typeof backendResponse.success,
          backendMessage: backendResponse.message,
          hasTenant: !!backendResponse.tenant
        });
        
        // Check for success - handle both explicit true/false and undefined (which means success)
        if (backendResponse.success === true || backendResponse.success === undefined || backendResponse.tenant) {
          setShowCreateModal(false);
          setCreateError(null);
          setCreateFieldErrors({});
          // Refresh the tenant list and reset pagination
          setCurrentPage(1);
          await fetchTenants();
          await fetchAllTenantsForStats();
          console.log('✅ SuperAdminTenants: Tenant created successfully');
        } else {
          setCreateError(backendResponse.message || 'Failed to create tenant');
          console.log('❌ SuperAdminTenants: Backend indicated failure:', backendResponse);
        }
      } else {
        // Handle API service error responses
        if (response.data && response.data.error === 'VALIDATION_ERROR') {
          // Handle validation errors from backend
          if (response.data.fieldErrors) {
            setCreateFieldErrors(response.data.fieldErrors);
            setCreateError('Please fix the validation errors below');
          } else {
            setCreateError(response.data.message || 'Validation failed');
          }
        } else {
          setCreateError(response.message || 'Failed to create tenant');
        }
        console.log('❌ SuperAdminTenants: API response indicated failure:', response);
      }
    } catch (error: any) {
      console.error('❌ SuperAdminTenants: Error creating tenant:', error);
      
      // Handle different types of errors
      let errorData = null;
      
      // Check if error has response data (Axios error)
      if (error.response?.data) {
        errorData = error.response.data;
      }
      // Check if error has data directly (API service error)
      else if (error.data) {
        errorData = error.data;
      }
      
      console.log('🔍 Full error object:', error);
      console.log('🔍 Error response:', error.response);
      console.log('🔍 Error data:', errorData);
      
      if (errorData) {
        // Handle validation errors
        if (errorData.error === 'VALIDATION_ERROR' && errorData.fieldErrors) {
          console.log('🔍 Setting field errors:', errorData.fieldErrors);
          setCreateFieldErrors(errorData.fieldErrors);
          setCreateError('Please fix the validation errors below');
          return;
        }
        
        // Handle duplicate errors
        if (errorData.error === 'DUPLICATE_ERROR') {
          setCreateError(`${errorData.field === 'email' ? 'Email address' : 
                         errorData.field === 'domain' ? 'Domain' : 
                         errorData.field === 'name' ? 'Tenant name' : 'Field'} "${errorData.value}" is already registered`);
          return;
        }
        
        // Handle general API errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setCreateError(errorData.errors.join('; '));
        } else {
          setCreateError(errorData.message || 'Failed to create tenant');
        }
      } else {
        setCreateError(error.message || 'Failed to create tenant');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewDetails = async (tenant: Tenant) => {
    setIsLoadingDetails(true);
    setSelectedTenant(null);
    setShowDetailsModal(true);

    try {
      // Configure tenant API service for super admin context
      tenantApiService.setTenantContext({ isSuperAdmin: true, includeTenantContext: false });
      
      // Fetch detailed tenant information with comprehensive data
      const [tenantResponse, usersResponse, analyticsResponse] = await Promise.all([
        tenantApiService.getTenantById(tenant._id),
        tenantApiService.getTenantUsers(tenant._id),
        api.get(`/super-admin/analytics/tenant/${tenant._id}`).catch(() => ({ ok: false })) // Graceful fallback if analytics endpoint doesn't exist
      ]);

      // Process tenant data
      let tenantDetails: TenantDetails;
      if (tenantResponse.success && tenantResponse.data) {
        tenantDetails = {
          ...tenant,
          ...tenantResponse.data,
          users: usersResponse.success ? usersResponse.data || [] : [],
          userCount: usersResponse.success ? usersResponse.data?.length || 0 : 0,
          activeUserCount: usersResponse.success ? 
            usersResponse.data?.filter((user: any) => user.isActive).length || 0 : 0,
          // Additional detailed information
          lastLogin: tenantResponse.data.lastLogin || 'Never',
          subscriptionDetails: tenantResponse.data.subscription || null,
          settings: tenantResponse.data.settings || null,
          usage: {
            storageUsed: tenantResponse.data.storageUsed || '0 MB',
            apiCallsThisMonth: tenantResponse.data.apiCallsThisMonth || 0,
            bandwidthUsed: tenantResponse.data.bandwidthUsed || '0 GB'
          }
        };
      } else {
        // Fallback to basic tenant data if detailed fetch fails
        tenantDetails = {
          ...tenant,
          users: usersResponse.success ? usersResponse.data || [] : [],
          userCount: usersResponse.success ? usersResponse.data?.length || 0 : 0,
          activeUserCount: 0,
          lastLogin: 'Unknown',
          subscriptionDetails: null,
          settings: null,
          usage: {
            storageUsed: '0 MB',
            apiCallsThisMonth: 0,
            bandwidthUsed: '0 GB'
          }
        };
      }

      // Process analytics data if available
      if (analyticsResponse && typeof analyticsResponse === 'object' && 'ok' in analyticsResponse && analyticsResponse.ok) {
        try {
          const analyticsData = await (analyticsResponse as Response).json();
          if (analyticsData.success && analyticsData.data) {
            tenantDetails.analytics = analyticsData.data;
          }
        } catch (analyticsError) {
          console.warn('Failed to parse analytics data:', analyticsError);
        }
      }

      setSelectedTenant(tenantDetails);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      // Set basic tenant data as fallback - ensure no error objects
      setSelectedTenant({
        ...tenant,
        users: [],
        userCount: 0,
        activeUserCount: 0,
        lastLogin: 'Unknown',
        subscriptionDetails: null,
        settings: null,
        usage: {
          storageUsed: '0 MB',
          apiCallsThisMonth: 0,
          bandwidthUsed: '0 GB'
        },
        contactInfo: tenant.contactInfo || { email: '', phone: '', address: '' },
        subscription: tenant.subscription || { planName: '', status: '', expiresAt: '' }
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleManage = async (tenant: Tenant) => {
    setIsLoadingDetails(true);
    setSelectedTenant(null);
    setShowManageModal(true);
    setIsEditing(true); // Open directly in edit mode

    try {
      // Configure tenant API service for super admin context
      tenantApiService.setTenantContext({ isSuperAdmin: true, includeTenantContext: false });
      
      // Fetch detailed tenant information for editing
      const tenantResponse = await tenantApiService.getTenantById(tenant._id);
      
      if (tenantResponse.success && tenantResponse.data) {
        const tenantData = {
          ...tenant,
          ...tenantResponse.data,
          // Ensure we have editable fields
          originalData: { ...tenantResponse.data }, // Keep original for comparison
          hasChanges: false
        };
        setSelectedTenant(tenantData);
        setEditFormData(tenantData); // Set form data for editing
      } else {
        // Fallback to basic tenant data
        const tenantData = {
          ...tenant,
          originalData: { ...tenant },
          hasChanges: false
        };
        setSelectedTenant(tenantData);
        setEditFormData(tenantData); // Set form data for editing
      }
    } catch (error) {
      console.error('Error fetching tenant details for management:', error);
      setSelectedTenant({
        ...tenant,
        originalData: { ...tenant },
        hasChanges: false
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDelete = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!tenantToDelete) return;

    setIsDeleting(true);
    try {
      console.log('🗑️ SuperAdminTenants: Deleting tenant:', tenantToDelete._id);
      
      // Configure tenantApiService for super admin context
      tenantApiService.setTenantContext({
        isSuperAdmin: true,
        includeTenantContext: false
      });
      
      const result = await tenantApiService.delete(`/tenants/${tenantToDelete._id}`);
      
      console.log('🗑️ SuperAdminTenants: Delete result:', result);
      
      if (result.success) {
        setShowDeleteModal(false);
        setTenantToDelete(null);
        await fetchTenants(); // Refresh the list
        await fetchAllTenantsForStats(); // Refresh statistics
        console.log('✅ SuperAdminTenants: Tenant deleted successfully!');
      } else {
        console.error('❌ Failed to delete tenant:', result.message);
        alert(`Failed to delete tenant: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error deleting tenant:', error);
      alert(`Error deleting tenant: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${tenant.name}"?\n\n` +
      `${action === 'activate' ? 'This will restore access to all tenant users.' : 'This will suspend access for all tenant users.'}`
    );
    
    if (!confirmed) return;
    
    setIsUpdating(true);

    try {
      // Configure tenant API service for super admin context
      tenantApiService.setTenantContext({ isSuperAdmin: true, includeTenantContext: false });
      
      const result = await tenantApiService.updateTenant(tenant._id, { 
        status: newStatus,
        updatedBy: 'super_admin',
        statusChangeReason: `Status changed to ${newStatus} by Super Admin`,
        statusChangeDate: new Date().toISOString()
      });

      if (result.success) {
        // Optimistic state update - update UI immediately
        setTenants(prevTenants => 
          prevTenants.map(t => 
            t._id === tenant._id ? {...t, status: newStatus} : t
          )
        );
        
        // Refresh the list and statistics
        await fetchTenants();
        await fetchAllTenantsForStats();
        console.log(`✅ SuperAdminTenants: Tenant "${tenant.name}" has been ${action}d successfully!`);
      } else {
        console.error('Failed to update tenant status:', result.message);
        alert(`Failed to ${action} tenant: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating tenant status:', error);
      alert(`Error ${action}ing tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSuspend = async (tenant: Tenant) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to suspend "${tenant.name}"?\n\n` +
      'This will temporarily disable access for all tenant users.'
    );
    
    if (!confirmed) return;
    
    setIsUpdating(true);

    try {
      // Configure tenant API service for super admin context
      tenantApiService.setTenantContext({ isSuperAdmin: true, includeTenantContext: false });
      
      const result = await tenantApiService.updateTenant(tenant._id, { 
        status: 'suspended',
        updatedBy: 'super_admin',
        statusChangeReason: 'Tenant suspended by Super Admin',
        statusChangeDate: new Date().toISOString()
      });

      if (result.success) {
        // Optimistic state update - update UI immediately
        setTenants(prevTenants => 
          prevTenants.map(t => 
            t._id === tenant._id ? {...t, status: 'suspended'} : t
          )
        );
        
        // Refresh the list and statistics
        await fetchTenants();
        await fetchAllTenantsForStats();
        console.log(`✅ SuperAdminTenants: Tenant "${tenant.name}" has been suspended successfully!`);
      } else {
        console.error('Failed to suspend tenant:', result.message);
        alert(`Failed to suspend tenant: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error suspending tenant:', error);
      alert(`Error suspending tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnsuspend = async (tenant: Tenant) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to unsuspend "${tenant.name}"?\n\n` +
      'This will restore access for all tenant users.'
    );
    
    if (!confirmed) return;
    
    setIsUpdating(true);

    try {
      // Configure tenant API service for super admin context
      tenantApiService.setTenantContext({ isSuperAdmin: true, includeTenantContext: false });
      
      const result = await tenantApiService.updateTenant(tenant._id, { 
        status: 'active',
        updatedBy: 'super_admin',
        statusChangeReason: 'Tenant unsuspended by Super Admin',
        statusChangeDate: new Date().toISOString()
      });

      if (result.success) {
        // Optimistic state update - update UI immediately
        setTenants(prevTenants => 
          prevTenants.map(t => 
            t._id === tenant._id ? {...t, status: 'active'} : t
          )
        );
        
        // Refresh the list and statistics
        await fetchTenants();
        await fetchAllTenantsForStats();
        console.log(`✅ SuperAdminTenants: Tenant "${tenant.name}" has been unsuspended successfully!`);
      } else {
        console.error('Failed to unsuspend tenant:', result.message);
        alert(`Failed to unsuspend tenant: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error unsuspending tenant:', error);
      alert(`Error unsuspending tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditMode = () => {
    if (selectedTenant) {
      setIsEditing(true);
      setEditFormData({
        name: selectedTenant.name,
        domain: selectedTenant.domain,
        contactInfo: selectedTenant.contactInfo || {},
        settings: selectedTenant.settings || { maxUsers: 100, maxAdmins: 5, features: [] },
        subscription: selectedTenant.subscription || {}
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
  };

  const handleSaveChanges = async () => {
    if (!selectedTenant || !editFormData) return;

    setIsSaving(true);
    try {
      // Configure tenant API service for super admin context
      tenantApiService.setTenantContext({ isSuperAdmin: true, includeTenantContext: false });
      
      const result = await tenantApiService.updateTenant(selectedTenant._id, {
        ...editFormData,
        updatedBy: 'super_admin',
        lastModified: new Date().toISOString()
      });

      if (result.success) {
        // Update the selected tenant data to reflect changes
        setSelectedTenant({ ...selectedTenant, ...editFormData });
        setIsEditing(false);
        setEditFormData(null);
        setShowManageModal(false); // Close the modal after successful save
        await fetchTenants(); // Refresh the list
        await fetchAllTenantsForStats(); // Refresh statistics
        console.log('✅ SuperAdminTenants: Tenant updated successfully!');
        showNotification('✅ Tenant updated successfully!', 'success');
      } else {
        showNotification(`Failed to update tenant: ${result.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      showNotification(`Error updating tenant: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = () => {
    setShowManageModal(false);
    setIsEditing(false);
    setEditFormData(null);
  };

  const handleFormDataChange = (field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedFormDataChange = (parentField: string, childField: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-full transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Manage all tenants, monitor usage, and oversee subscriptions
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setCreateError(null);
                  setCreateFieldErrors({});
                  setCreateModalResetTrigger(prev => prev + 1);
                  setShowCreateModal(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Add Tenant
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tenants</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenantStats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <BuildingOfficeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {tenantStats.active}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trial</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {tenantStats.trial}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspended</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {tenantStats.suspended}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors duration-300">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Search tenants by name, domain, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status ({tenantStats.total})</option>
                  <option value="active">Active ({tenantStats.active})</option>
                  <option value="trial">Trial ({tenantStats.trial})</option>
                  <option value="suspended">Suspended ({tenantStats.suspended})</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8" key={`tenants-grid-${searchTerm}-${statusFilter}`}>
          {paginatedTenants.map((tenant) => (
            <motion.div
              key={tenant._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4 min-w-0">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
                        <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {tenant.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {tenant.domain}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge className={`${getStatusColor(tenant.status)} flex items-center gap-1 border text-xs whitespace-nowrap`}>
                      {getStatusIcon(tenant.status)}
                      <span className="truncate max-w-[60px]">{tenant.status}</span>
                    </Badge>
                    {currentTenant?._id === tenant._id && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 border text-xs whitespace-nowrap">
                        <ShieldCheckIcon className="w-3 h-3 mr-1" />
                        Current
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  {tenant.subscription && (
                    <div className="flex items-center justify-between min-w-0">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Plan:</span>
                      <Badge className={`${getPlanColor(tenant.subscription.planName || tenant.subscription.status)} text-xs border whitespace-nowrap truncate max-w-[120px]`}>
                        {(() => {
                          const planName = tenant.subscription?.planName;
                          const status = tenant.subscription?.status;
                          
                          // If we have a plan name, show it without status
                          if (planName) {
                            return planName;
                          }
                          
                          // If no plan name but we have status, convert status to plan name (without status)
                          if (status === 'trial') {
                            return 'Trial Plan';
                          } else if (status === 'active') {
                            return 'Basic Plan';
                          } else if (status === 'suspended') {
                            return 'Basic Plan';
                          }
                          
                          // Fallback
                          return status || 'N/A';
                        })()}
                      </Badge>
                    </div>
                  )}
                  {tenant.contactInfo?.email && (
                    <div className="flex items-center justify-between min-w-0">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Email:</span>
                      <span className="text-sm text-gray-900 dark:text-white truncate ml-2 min-w-0 flex-1 text-right">
                        {tenant.contactInfo?.email || 'N/A'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between min-w-0">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Created:</span>
                    <span className="text-sm text-gray-900 dark:text-white flex-shrink-0">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {tenant.settings && (
                    <div className="flex items-center justify-between min-w-0">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Max Users:</span>
                      <span className="text-sm text-gray-900 dark:text-white flex-shrink-0">
                        {tenant.settings?.maxUsers || 'Unlimited'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Streamlined 3-button layout */}
        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(tenant)}
            className="flex-1 flex items-center justify-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 dark:border-gray-600"
          >
            <EyeIcon className="w-4 h-4" />
            <span className="text-xs sm:text-sm">View</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleManage(tenant)}
            className="flex-1 flex items-center justify-center gap-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
          >
            <CogIcon className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(tenant)}
            className="flex-1 flex items-center justify-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 dark:border-gray-600"
          >
            <TrashIcon className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Delete</span>
          </Button>
        </div>
              </div>
            </motion.div>
          ))}
        </div>


        {/* Pagination Controls */}
        {(totalFilteredPages && totalFilteredPages > 1) ? (
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredTenants.length)} of {filteredTenants.length} tenants
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalFilteredPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalFilteredPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 p-0 dark:border-gray-600 ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white dark:bg-blue-500' 
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalFilteredPages}
                className="flex items-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Next
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BuildingOfficeIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first tenant'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button 
                onClick={() => {
                  setCreateError(null);
                  setCreateFieldErrors({});
                  setCreateModalResetTrigger(prev => prev + 1);
                  setShowCreateModal(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create First Tenant
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Tenant Modal */}
      <Modal 
        key={showCreateModal ? 'create-modal-open' : 'create-modal-closed'}
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        isDarkMode={isDarkMode}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add New Tenant
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create a new tenant account with admin access
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(false)}
            className="p-2"
          >
            <XMarkIcon className="w-4 h-4" />
          </Button>
        </div>
        
        {createError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
          </div>
        )}

        <CreateTenantForm 
          onSubmit={createTenant}
          onCancel={() => {
            setShowCreateModal(false);
            setCreateError(null);
            setCreateFieldErrors({});
          }}
          isLoading={isCreating}
          fieldErrors={createFieldErrors}
          resetTrigger={createModalResetTrigger}
        />
      </Modal>

      {/* Tenant Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedTenant && typeof selectedTenant === 'object' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Tenant Details
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>

              {isLoadingDetails ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedTenant ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <GlobeAltIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Basic Information
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            Name:
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {String(selectedTenant.name || 'N/A')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <GlobeAltIcon className="w-4 h-4" />
                            Domain:
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {String(selectedTenant.domain || 'N/A')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <ShieldCheckIcon className="w-4 h-4" />
                            Status:
                          </span>
                          <Badge className={`${getStatusColor(selectedTenant.status)} flex items-center gap-1`}>
                            {getStatusIcon(selectedTenant.status)}
                            {String(selectedTenant.status || 'unknown')}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            Created:
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {selectedTenant.createdAt ? new Date(selectedTenant.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            Last Login:
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {String((selectedTenant as any).lastLogin || 'Never')}
                          </span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        User Statistics
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Total Users:</span>
                          <span className="text-gray-900 dark:text-white">
                            {String((selectedTenant as any).userCount || selectedTenant.stats?.userCount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Active Users:</span>
                          <span className="text-gray-900 dark:text-white">
                            {String((selectedTenant as any).activeUserCount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Admin Users:</span>
                          <span className="text-gray-900 dark:text-white">
                            {String(selectedTenant.stats?.adminCount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Max Users:</span>
                          <span className="text-gray-900 dark:text-white">
                            {String(selectedTenant.settings?.maxUsers || 'Unlimited')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Max Admins:</span>
                          <span className="text-gray-900 dark:text-white">
                            {String(selectedTenant.settings?.maxAdmins || 'Unlimited')}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Usage & Performance */}
                  {(selectedTenant as any).usage && (
                    <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Usage & Performance
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Storage Used:</span>
                          <span className="text-gray-900 dark:text-white">
                            {String((selectedTenant as any).usage?.storageUsed || '0 MB')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400">API Calls (This Month):</span>
                          <span className="text-gray-900 dark:text-white">
                            {typeof (selectedTenant as any).usage?.apiCallsThisMonth === 'number' 
                              ? (selectedTenant as any).usage.apiCallsThisMonth.toLocaleString() 
                              : '0'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Bandwidth Used:</span>
                          <span className="text-gray-900 dark:text-white">
                            {String((selectedTenant as any).usage?.bandwidthUsed || '0 GB')}
                          </span>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Contact Information */}
                  {selectedTenant.contactInfo && (
                    <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <BellIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        Contact Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <BellIcon className="w-4 h-4" />
                            Email:
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {String(selectedTenant.contactInfo?.email || 'Not provided')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <BellIcon className="w-4 h-4" />
                            Phone:
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {String(selectedTenant.contactInfo?.phone || 'Not provided')}
                          </span>
                        </div>
                        {selectedTenant.contactInfo.address && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <BellIcon className="w-4 h-4" />
                              Address:
                            </span>
                            <span className="text-gray-900 dark:text-white ml-2">
                              {(() => {
                                const address = selectedTenant.contactInfo?.address;
                                if (!address) return 'N/A';
                                
                                // If it's already a string, return it
                                if (typeof address === 'string') return address;
                                
                                // If it's an object, construct the address string
                                if (typeof address === 'object' && address !== null) {
                                  const addr = address as any;
                                  const parts = [
                                    addr.street,
                                    addr.city,
                                    addr.state,
                                    addr.zipCode,
                                    addr.country
                                  ].filter(part => part && String(part).trim());
                                  
                                  return parts.length > 0 ? parts.join(', ') : 'N/A';
                                }
                                
                                return 'N/A';
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Subscription Information */}
                  {selectedTenant.subscription && typeof selectedTenant.subscription === 'object' && (
                    <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <CreditCardIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Subscription Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Plan:</span>
                          <span className="text-gray-900 dark:text-white">
                            {String(selectedTenant.subscription?.planName || selectedTenant.subscription?.status || 'N/A')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                          <span className="text-gray-900 dark:text-white">
                            {String(selectedTenant.subscription?.status || 'N/A')}
                          </span>
                        </div>
                        {selectedTenant.subscription?.expiresAt && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Expires:</span>
                            <span className="text-gray-900 dark:text-white">
                              {new Date(selectedTenant.subscription.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Features */}
                  {selectedTenant.settings?.features && Array.isArray(selectedTenant.settings.features) && selectedTenant.settings.features.length > 0 && (
                    <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Available Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTenant.settings.features.map((feature, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                            {String(feature)}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load tenant details
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Tenant Modal */}
      <AnimatePresence>
        {showManageModal && selectedTenant && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Manage Tenant: {selectedTenant.name}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowManageModal(false);
                      setIsEditing(false);
                      setEditFormData(null);
                    }}
                    className="p-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isLoadingDetails ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">

                  {isEditing && editFormData ? (
                    /* Edit Mode */
                    <div className="space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                          <CogIcon className="w-5 h-5" />
                          <span className="font-medium">Edit Mode - Make your changes below</span>
                        </div>
                      </div>

                      {/* Basic Information */}
                      <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Tenant Name
                            </label>
                            <Input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) => handleFormDataChange('name', e.target.value)}
                              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Domain
                            </label>
                            <Input
                              type="text"
                              value={editFormData.domain}
                              onChange={(e) => handleFormDataChange('domain', e.target.value)}
                              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Status
                            </label>
                            <select
                              value={editFormData.status}
                              onChange={(e) => handleFormDataChange('status', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Subscription Plan */}
                      <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <CreditCardIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Subscription Plan
                        </h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Select Plan
                          </label>
                          <select
                            value={editFormData.subscription?.planName || editFormData.subscription?.status || 'trial'}
                            onChange={(e) => {
                              const planValue = e.target.value;
                              handleNestedFormDataChange('subscription', 'planName', planValue);
                              // Set status based on plan selection
                              if (planValue === 'trial') {
                                handleNestedFormDataChange('subscription', 'status', 'trial');
                              } else {
                                handleNestedFormDataChange('subscription', 'status', 'active');
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="trial">Trial Plan</option>
                            <option value="basic">Basic Plan</option>
                            <option value="standard">Standard Plan</option>
                            <option value="premium">Premium Plan</option>
                            <option value="enterprise">Enterprise Plan</option>
                          </select>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Trial plans are automatically set to trial status, all others are active
                          </p>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Email
                            </label>
                            <Input
                              type="email"
                              value={editFormData.contactInfo?.email || ''}
                              onChange={(e) => handleNestedFormDataChange('contactInfo', 'email', e.target.value)}
                              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Phone
                            </label>
                            <Input
                              type="tel"
                              value={editFormData.contactInfo?.phone || ''}
                              onChange={(e) => handleNestedFormDataChange('contactInfo', 'phone', e.target.value)}
                              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Settings */}
                      <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Usage Limits</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Max Users
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={editFormData.settings?.maxUsers || 100}
                              onChange={(e) => handleNestedFormDataChange('settings', 'maxUsers', parseInt(e.target.value))}
                              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Max Admins
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={editFormData.settings?.maxAdmins || 5}
                              onChange={(e) => handleNestedFormDataChange('settings', 'maxAdmins', parseInt(e.target.value))}
                              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          onClick={handleSaveChanges}
                          disabled={isSaving}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="space-y-6">

                      {/* Basic Information */}
                      <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                            <span className="text-gray-900 dark:text-white">{selectedTenant.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Domain:</span>
                            <span className="text-gray-900 dark:text-white">{selectedTenant.domain}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                            <Badge className={getStatusColor(selectedTenant.status)}>
                              {selectedTenant.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Created:</span>
                            <span className="text-gray-900 dark:text-white">
                              {new Date(selectedTenant.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      {selectedTenant.contactInfo && (
                        <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>
                              <span className="text-gray-900 dark:text-white">
                                {selectedTenant.contactInfo?.email || 'Not provided'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Phone:</span>
                              <span className="text-gray-900 dark:text-white">
                                {selectedTenant.contactInfo?.phone || 'Not provided'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Settings */}
                      <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Usage Limits</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Max Users:</span>
                            <span className="text-gray-900 dark:text-white">
                              {selectedTenant.settings?.maxUsers || 'Unlimited'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Max Admins:</span>
                            <span className="text-gray-900 dark:text-white">
                              {selectedTenant.settings?.maxAdmins || 'Unlimited'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* View Mode Done Button */}
                  {!isEditing && (
                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                      <Button
                        onClick={handleDone}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Done
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && tenantToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Tenant
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to permanently delete <strong>{tenantToDelete.name}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This action cannot be undone. All data associated with this tenant will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed top-4 right-4 z-50 max-w-sm w-full mx-4 ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : notification.type === 'error' 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'
            } rounded-lg shadow-lg border border-gray-200 dark:border-gray-700`}
          >
            <div className="p-4 flex items-center space-x-3">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                )}
                {notification.type === 'error' && (
                  <XCircleIcon className="w-5 h-5 text-white" />
                )}
                {notification.type === 'info' && (
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminTenants;