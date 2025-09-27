import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { tenantApiService } from '@/services/tenantApiService';
import { useTenant } from '@/contexts/TenantContext';

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
        <Button onClick={fetchTenants} variant="outline">
          Refresh
        </Button>
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
    </div>
  );
};

export default SuperAdminTenants;