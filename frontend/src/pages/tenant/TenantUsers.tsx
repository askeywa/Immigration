// frontend/src/pages/tenant/TenantUsers.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { UsersIcon, PlusIcon } from '@heroicons/react/24/outline';
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
        customActions={
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add User
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-6 pb-6">
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