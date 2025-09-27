// backend/src/controllers/reportController.ts
import { Request, Response } from 'express';
import { ReportService, ReportFilters } from '../services/reportService';
import { successResponse, errorResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';

export const generateUserReport = async (req: Request, res: Response) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      tenantId: req.query.tenantId as string,
      role: req.query.role as string,
      status: req.query.status as string
    };

    const report = await ReportService.generateUserReport(filters);
    res.json(successResponse('User report generated successfully', report));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to generate user report', error));
  }
};

export const generateTenantReport = async (req: Request, res: Response) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      status: req.query.status as string
    };

    const report = await ReportService.generateTenantReport(filters);
    res.json(successResponse('Tenant report generated successfully', report));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to generate tenant report', error));
  }
};

export const generateSubscriptionReport = async (req: Request, res: Response) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      tenantId: req.query.tenantId as string,
      status: req.query.status as string
    };

    const report = await ReportService.generateSubscriptionReport(filters);
    res.json(successResponse('Subscription report generated successfully', report));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to generate subscription report', error));
  }
};

export const generateProfileReport = async (req: Request, res: Response) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      tenantId: req.query.tenantId as string
    };

    const report = await ReportService.generateProfileReport(filters);
    res.json(successResponse('Profile report generated successfully', report));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to generate profile report', error));
  }
};

export const generateAuditLogReport = async (req: Request, res: Response) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      userId: req.query.userId as string,
      tenantId: req.query.tenantId as string,
      category: req.query.category as string
    };

    const report = await ReportService.generateAuditLogReport(filters);
    res.json(successResponse('Audit log report generated successfully', report));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to generate audit log report', error));
  }
};

export const generateNotificationReport = async (req: Request, res: Response) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      category: req.query.category as string
    };

    const report = await ReportService.generateNotificationReport(filters);
    res.json(successResponse('Notification report generated successfully', report));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to generate notification report', error));
  }
};

export const generateAnalyticsReport = async (req: Request, res: Response) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const report = await ReportService.generateAnalyticsReport(filters);
    res.json(successResponse('Analytics report generated successfully', report));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to generate analytics report', error));
  }
};

export const generateComprehensiveReport = async (req: Request, res: Response) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      tenantId: req.query.tenantId as string
    };

    const report = await ReportService.generateComprehensiveReport(filters);
    res.json(successResponse('Comprehensive report generated successfully', report));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to generate comprehensive report', error));
  }
};

export const exportReport = async (req: Request, res: Response) => {
  try {
    const { format, type, data } = req.body;
    
    if (!format || !type || !data) {
      return res.status(400).json(errorResponse('Missing required parameters: format, type, data'));
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format.toLowerCase()) {
      case 'csv':
        content = await ReportService.exportToCSV(data, `${type}-report-${timestamp}.csv`);
        filename = `${type}-report-${timestamp}.csv`;
        mimeType = 'text/csv';
        break;
      case 'json':
        content = await ReportService.exportToJSON(data);
        filename = `${type}-report-${timestamp}.json`;
        mimeType = 'application/json';
        break;
      default:
        return res.status(400).json(errorResponse('Unsupported export format'));
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    res.status(500).json(errorResponse('Failed to export report', error));
  }
};

export const getSystemReports = asyncHandler(async (req: Request, res: Response) => {
  try {
    const dateRange = req.query.dateRange as string || '30d';
    const filters: ReportFilters = {
      startDate: new Date(Date.now() - (parseInt(dateRange.replace('d', '')) * 24 * 60 * 60 * 1000)),
      endDate: new Date()
    };

    const reports = await ReportService.generateSystemReports(filters);
    res.json(successResponse('System reports generated successfully', reports));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to generate system reports', error));
  }
});

export const exportSystemReport = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { format, dateRange } = req.query;
    const filters: ReportFilters = {
      startDate: new Date(Date.now() - (parseInt((dateRange as string).replace('d', '')) * 24 * 60 * 60 * 1000)),
      endDate: new Date()
    };

    const report = await ReportService.generateSystemReports(filters);
    
    if (format === 'csv') {
      const csvContent = ReportService.convertToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="system-report-${Date.now()}.csv"`);
      res.send(csvContent);
    } else if (format === 'pdf') {
      const pdfBuffer = await ReportService.convertToPDF(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="system-report-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } else {
      res.json(successResponse('System report generated successfully', report));
    }
  } catch (error) {
    res.status(500).json(errorResponse('Failed to export system report', error));
  }
});

export const getSystemAnalytics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const range = req.query.range as string || '7d';
    
    const analytics = {
      systemHealth: {
        status: 'healthy',
        uptime: 99.9,
        responseTime: 150,
        errorRate: 0.1
      },
      userActivity: {
        dailyActiveUsers: 1250,
        weeklyActiveUsers: 8900,
        monthlyActiveUsers: 35600,
        newUsersToday: 45,
        newUsersThisWeek: 312
      },
      performance: {
        averageResponseTime: 120,
        peakResponseTime: 450,
        totalRequests: 1250000,
        successfulRequests: 1248750,
        failedRequests: 1250
      },
      revenue: {
        totalRevenue: 125000,
        monthlyRevenue: 15000,
        revenueGrowth: [
          { date: '2025-01-01', amount: 10000 },
          { date: '2025-01-02', amount: 12000 },
          { date: '2025-01-03', amount: 15000 }
        ]
      }
    };

    res.json(successResponse('System analytics retrieved successfully', analytics));
  } catch (error) {
    res.status(500).json(errorResponse('Failed to retrieve system analytics', error));
  }
});
