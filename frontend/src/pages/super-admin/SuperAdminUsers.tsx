import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { tenantApiService } from '@/services/tenantApiService';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'tenant_user';
  status: 'active' | 'inactive' | 'suspended';
  tenant?: {
    name: string;
    domain: string;
  };
  createdAt: string;
  lastLogin?: string;
}

const SuperAdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 SuperAdminUsers: Starting fetchUsers...');
      // This would be a super admin endpoint to get all users across all tenants
      const response = await tenantApiService.getAllUsers();
      console.log('🔍 SuperAdminUsers: API response:', response);
      console.log('🔍 SuperAdminUsers: Users data:', response.data?.users);
      setUsers(response.data?.users || []);
      console.log('🔍 SuperAdminUsers: Users state updated');
    } catch (error) {
      console.error('❌ SuperAdminUsers: Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'tenant_admin': return 'bg-blue-100 text-blue-800';
      case 'tenant_user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Button onClick={fetchUsers} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="tenant_admin">Tenant Admin</option>
          <option value="tenant_user">Tenant User</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user._id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <Badge className={getRoleColor(user.role)}>
                    {user.role.replace('_', ' ')}
                  </Badge>
                  <Badge className={getStatusColor(user.status)}>
                    {user.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Email: {user.email}
                </p>
                {user.tenant && (
                  <p className="text-sm text-gray-600 mb-2">
                    Tenant: {user.tenant.name} ({user.tenant.domain})
                  </p>
                )}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                  {user.lastLogin && (
                    <span>Last Login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUsers;