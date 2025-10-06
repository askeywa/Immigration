// frontend/src/pages/tenant/TenantUsers.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { UsersIcon, PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useTenant } from '@/contexts/TenantContext';
import { UserManagement } from '@/components/tenant/UserManagement';
import { DashboardHeader } from '@/components/common';

const TenantUsers: React.FC = () => {
  const { tenant, isTenantAdmin } = useTenant();

  // Access denied check
  if (!isTenantAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UsersIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Tenant admin access required for this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Dashboard Header */}
      <DashboardHeader
        title="Users Management"
        subtitle={`Managing users for ${tenant?.name || 'your organization'}`}
        showRefresh={false}
        showLogout={false}
        showProfile={true}
        showNotifications={false}
        showSettings={false}
        isLoading={false}
      />

      <div className="max-w-7xl mx-auto px-6 pb-6">
        {/* Quick Actions Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 mt-6"
        >
          <div className="bg-white p-3 rounded-lg shadow-md border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
              <div className="flex flex-wrap items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                >
                  <PlusIcon className="w-3 h-3 mr-1.5" />
                  Add User
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => window.location.href = '/tenant/reports'}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200 shadow-sm"
                >
                  <ChartBarIcon className="w-3 h-3 mr-1.5" />
                  View Reports
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <UserManagement />
        </motion.div>
      </div>
    </div>
  );
};

export default TenantUsers;