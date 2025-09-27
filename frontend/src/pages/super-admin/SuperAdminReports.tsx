import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tenantApiService } from '@/services/tenantApiService';

interface ReportData {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  revenue: {
    monthly: number;
    yearly: number;
  };
  topTenants: Array<{
    name: string;
    domain: string;
    userCount: number;
    applicationCount: number;
  }>;
}

const SuperAdminReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await tenantApiService.getSystemReports({ dateRange });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Set default data to prevent crashes
      setReportData({
        totalTenants: 0,
        activeTenants: 0,
        totalUsers: 0,
        activeUsers: 0,
        totalApplications: 0,
        pendingApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0,
        revenue: {
          monthly: 0,
          yearly: 0
        },
        topTenants: []
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      const response = await tenantApiService.exportSystemReport({ 
        format, 
        dateRange 
      });
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-report-${dateRange}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No report data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button onClick={fetchReportData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Export Options */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Export Reports</h3>
        <div className="flex gap-2">
          <Button onClick={() => exportReport('pdf')} variant="outline">
            Export PDF
          </Button>
          <Button onClick={() => exportReport('csv')} variant="outline">
            Export CSV
          </Button>
          <Button onClick={() => exportReport('excel')} variant="outline">
            Export Excel
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{reportData?.totalTenants || 0}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {reportData?.activeTenants || 0} Active
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{reportData?.totalUsers || 0}</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {reportData?.activeUsers || 0} Active
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{reportData?.totalApplications || 0}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                {reportData?.pendingApplications || 0} Pending
              </Badge>
              <Badge className="bg-green-100 text-green-800 text-xs">
                {reportData?.approvedApplications || 0} Approved
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(reportData?.revenue?.monthly || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Monthly / ${(reportData?.revenue?.yearly || 0).toLocaleString()} Yearly
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Tenants */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performing Tenants</h3>
        <div className="space-y-3">
          {(reportData?.topTenants || []).map((tenant, index) => (
            <div key={tenant.domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{tenant.name}</p>
                  <p className="text-sm text-gray-600">{tenant.domain}</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>{tenant.userCount} users</span>
                <span>{tenant.applicationCount} applications</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminReports;