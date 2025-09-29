import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { tenantApiService } from '@/services/tenantApiService';
import { useTenant } from '@/contexts/TenantContext';

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
}

const CreateTenantForm: React.FC<CreateTenantFormProps> = ({ onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    adminUser: {
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    if (field.startsWith('adminUser.')) {
      const adminField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        adminUser: {
          ...prev.adminUser,
          [adminField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tenant Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Tenant Information</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tenant Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter tenant name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Domain *
          </label>
          <Input
            type="text"
            value={formData.domain}
            onChange={(e) => handleChange('domain', e.target.value)}
            placeholder="e.g., company.ibuyscrap.ca"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Enter tenant description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>

      {/* Admin User Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Admin User</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <Input
              type="text"
              value={formData.adminUser.firstName}
              onChange={(e) => handleChange('adminUser.firstName', e.target.value)}
              placeholder="First name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <Input
              type="text"
              value={formData.adminUser.lastName}
              onChange={(e) => handleChange('adminUser.lastName', e.target.value)}
              placeholder="Last name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <Input
            type="email"
            value={formData.adminUser.email}
            onChange={(e) => handleChange('adminUser.email', e.target.value)}
            placeholder="admin@company.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <Input
            type="password"
            value={formData.adminUser.password}
            onChange={(e) => handleChange('adminUser.password', e.target.value)}
            placeholder="Enter password"
            required
            minLength={8}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? 'Creating...' : 'Create Tenant'}
        </Button>
      </div>
    </form>
  );
};

interface Tenant {
  _id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdAt: string;
  subscription?: {
    planName: string;
    status: string;
    expiresAt?: string;
  };
}

const SuperAdminTenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const { tenant: currentTenant } = useTenant();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await tenantApiService.getAllTenants();
      setTenants(response.data?.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tenantData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setShowCreateModal(false);
          fetchTenants(); // Refresh the list
        } else {
          setCreateError(result.message || 'Failed to create tenant');
        }
      } else {
        const error = await response.json();
        setCreateError(error.message || 'Failed to create tenant');
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
      setCreateError('Failed to create tenant');
    } finally {
      setIsCreating(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Add Tenant
          </Button>
          <Button onClick={fetchTenants} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search tenants by name or domain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant._id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {tenant.name}
                  </h3>
                  <Badge className={getStatusColor(tenant.status)}>
                    {tenant.status}
                  </Badge>
                  {currentTenant?._id === tenant._id && (
                    <Badge className="bg-blue-100 text-blue-800">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Domain: {tenant.domain}
                </p>
                {tenant.subscription && (
                  <p className="text-sm text-gray-600 mb-2">
                    Plan: {tenant.subscription.planName} ({tenant.subscription.status})
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Created: {new Date(tenant.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No tenants found</p>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Tenant
            </h3>
            
            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{createError}</p>
              </div>
            )}

            <CreateTenantForm 
              onSubmit={createTenant}
              onCancel={() => setShowCreateModal(false)}
              isLoading={isCreating}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminTenants;