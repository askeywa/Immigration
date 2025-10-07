// frontend/src/pages/super-admin/SuperAdminDashboard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  ChartBarIcon, 
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ServerIcon,
  GlobeAltIcon,
  DocumentChartBarIcon,
  EyeIcon,
  UserGroupIcon,
  BanknotesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useTenant } from '@/contexts/TenantContext';
import { useAuthStore } from '@/store/authStore';
import { useSuperAdminDashboard } from '@/hooks/useSuperAdminData';
import { log } from '@/utils/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/common';

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemUptime: number;
  lastBackup: string;
  newTenantsThisMonth: number;
  newUsersThisMonth: number;
  revenueGrowth: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  subtitle?: string;
}

interface TenantStats {
  _id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  userCount: number;
  subscription: {
    planName: string;
    status: string;
    expiresAt: string;
  };
  lastActivity: string;
  revenue: number;
}

interface RecentActivity {
  _id: string;
  type: 'tenant_created' | 'tenant_suspended' | 'user_registered' | 'payment_received' | 'system_alert';
  description: string;
  timestamp: string;
  tenantId?: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemAlert {
  _id: string;
  type: 'performance' | 'security' | 'billing' | 'system';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
}

// Enhanced Metric Card Component
const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color, 
  subtitle 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white',
    red: 'bg-red-500 text-white'
  };

  const trendColors = {
    up: 'text-green-600 bg-green-100',
    down: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100'
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border-0 shadow-md w-full bg-white dark:bg-gray-800" style={{ height: '160px' }}>
      {/* Fixed Height Container */}
      <div className="flex flex-col justify-between h-full">
        {/* Top Section - Title and Icon */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className={`p-2 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        {/* Middle Section - Main Value */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">{value}</h3>
        </div>
        
        {/* Bottom Section - Trend and Subtitle */}
        <div className="space-y-1">
          {change && trend && (
            <div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendColors[trend]} dark:bg-opacity-20`}>
                {trend === 'up' && <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />}
                {trend === 'down' && <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />}
                {change}
              </span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export const SuperAdminDashboard: React.FC = () => {
  const { isSuperAdmin } = useTenant();
  const { user, logout } = useAuthStore();
  
  // Use React Query for data fetching with caching
  const { data, isLoading, error, refetch } = useSuperAdminDashboard();
  
  // Extract data from the hook (with fallbacks to prevent errors)
  // React Query automatically handles caching, loading states, and refetching
  const systemStats = data?.analytics?.systemStats || null;
  const tenantStats = data?.tenants?.tenants || [];
  const recentActivity = data?.analytics?.recentActivity || [];
  const systemAlerts = data?.reports?.systemAlerts || [];

  // Handle manual refresh - React Query will automatically cache the results
  const handleRefresh = () => {
    console.log('🔄 SuperAdminDashboard: Manual refresh triggered');
    refetch();
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'inactive': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'suspended': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'tenant_created': return BuildingOfficeIcon;
      case 'tenant_suspended': return XCircleIcon;
      case 'user_registered': return UsersIcon;
      case 'payment_received': return ArrowTrendingUpIcon;
      case 'system_alert': return ExclamationTriangleIcon;
      default: return BellIcon;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Super admin access required for this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading super admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Dashboard Header - Clean and Simple */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="max-w-7xl mx-auto py-6 px-6">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 dark:text-white"
              >
                Super Admin Dashboard
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-1 text-lg text-gray-600 dark:text-gray-400"
              >
                Welcome back, {user?.firstName} {user?.lastName}
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4" />
                    Refresh Data
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 dark:text-red-500 mr-2" />
              <div className="text-sm text-red-700 dark:text-red-400">
                {error instanceof Error ? error.message : 'Failed to load dashboard data'}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced System Overview Cards - Fixed Alignment */}
        {systemStats && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ gridTemplateRows: 'minmax(160px, 1fr)' }}>
              <div className="flex">
                <MetricCard
                  title="Total Tenants"
                  value={systemStats.totalTenants}
                  change={`+${systemStats.newTenantsThisMonth} this month`}
                  trend="up"
                  icon={BuildingOfficeIcon}
                  color="blue"
                  subtitle={`${systemStats.activeTenants} active tenants`}
                />
                  </div>
              
              <div className="flex">
                <MetricCard
                  title="Total Users"
                  value={systemStats.totalUsers.toLocaleString()}
                  change={`+${systemStats.newUsersThisMonth} this month`}
                  trend="up"
                  icon={UserGroupIcon}
                  color="green"
                  subtitle={`${systemStats.activeUsers.toLocaleString()} active users`}
                />
                  </div>
              
              <div className="flex">
                <MetricCard
                  title="Monthly Revenue"
                  value={`$${systemStats.monthlyRevenue.toLocaleString()}`}
                  change={`+${systemStats.revenueGrowth}%`}
                  trend="up"
                  icon={BanknotesIcon}
                  color="purple"
                  subtitle={`$${systemStats.totalRevenue.toLocaleString()} total`}
                />
                </div>
              
              <div className="flex">
                <MetricCard
                  title="System Health"
                  value={`${systemStats.systemUptime}%`}
                  change="Excellent"
                  trend="up"
                  icon={ServerIcon}
                  color="green"
                  subtitle="Last backup completed"
                />
                  </div>
                </div>
          </motion.div>
        )}

        {/* Loading State - Fixed Alignment */}
        {isLoading && (
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ gridTemplateRows: 'minmax(160px, 1fr)' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex">
                  <Card className="p-6 animate-pulse border-0 shadow-md w-full bg-white dark:bg-gray-800" style={{ height: '160px' }}>
                    <div className="flex flex-col justify-between h-full">
                      {/* Top Section */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>

                      {/* Middle Section */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            </div>

                      {/* Bottom Section */}
                      <div className="space-y-1">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
                  </Card>
                  </div>
              ))}
                </div>
              </div>
        )}

        {/* Quick Actions Bar */}
        {!isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="p-4 border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:space-x-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => window.location.href = '/super-admin/tenants'}
                    className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 min-w-0 flex-shrink-0"
                  >
                    <BuildingOfficeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Manage Tenants</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => window.location.href = '/super-admin/users'}
                    className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200 min-w-0 flex-shrink-0"
                  >
                    <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Manage Users</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => window.location.href = '/super-admin/reports'}
                    className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200 min-w-0 flex-shrink-0"
                  >
                    <DocumentChartBarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">View Reports</span>
                  </motion.button>
                  </div>
                </div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Enhanced Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full shadow-lg border-0 bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 dark:bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Live</span>
                  </div>
                </div>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse flex space-x-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
                    ))}
          </div>
                ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, activityIdx) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                          <motion.li 
                            key={activity._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * activityIdx }}
                          >
                        <div className="relative pb-8">
                          {activityIdx !== recentActivity.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                          ) : null}
                              <div className="relative flex space-x-4">
                            <div>
                                  <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 shadow-sm ${getSeverityColor(activity.severity)}`}>
                                <ActivityIcon className="h-5 w-5" />
                              </span>
                            </div>
                                <div className="min-w-0 flex-1 pt-1.5">
                                  <div className="flex justify-between space-x-4">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(activity.timestamp).toLocaleString()}
                                </p>
                              </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(activity.severity)}`}>
                                  {activity.severity}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                          </motion.li>
                    );
                  })}
                </ul>
              </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Enhanced System Alerts */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full shadow-lg border-0 bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">System Alerts</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    {systemAlerts?.filter(alert => !alert.resolved).length || 0} Active
                  </span>
                </div>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex space-x-3">
                        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {systemAlerts.map((alert, index) => (
                      <motion.div 
                        key={alert._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.resolved 
                            ? 'bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-500' 
                            : alert.severity === 'high' 
                              ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-500'
                              : alert.severity === 'medium'
                                ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-500'
                                : 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-500'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 ${alert.resolved ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {alert.resolved ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message}</p>
                            <div className="mt-2 flex items-center space-x-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                {alert.type} • {alert.severity}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                      </motion.div>
                ))}
              </div>
                )}
              </div>
            </Card>
          </motion.div>
            </div>

        {/* Enhanced Tenant Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Tenant Overview</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {tenantStats.length} active tenants
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-0 flex-shrink-0"
                  >
                    <EyeIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">View All</span>
                  </motion.button>
          </div>
        </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                      </div>
                      <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {tenantStats.map((tenant, index) => (
                          <motion.tr 
                            key={tenant._id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                          >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                    <BuildingOfficeIcon className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{tenant.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{tenant.domain}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                          {tenant.status}
                        </span>
                      </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white font-medium">{tenant.userCount}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">users</div>
                      </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {tenant?.subscription?.planName || 'No Plan'}
                              </span>
                      </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${tenant.revenue.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">monthly</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(tenant.lastActivity).toLocaleDateString()}
                      </td>
                          </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
              )}
        </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
