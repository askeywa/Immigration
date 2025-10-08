# 🚨 Sentry Performance Monitoring Setup Guide

## 📊 Your Current Sentry Configuration
```
✅ DSN: https://1fed6693d06ca399d6d51b27adb20797@o4510120878145536.ingest.us.sentry.io/4510120957050880
✅ Project ID: 4510120957050880
✅ Release: 1.0.0
✅ Environment: development/production
```

## 🎯 Step-by-Step Dashboard Configuration

### 1. Access Sentry Dashboard
```bash
# Open browser:
https://sentry.io/

# Navigate to your project:
https://sentry.io/settings/[org]/projects/[project]/
```

### 2. Set Up Performance Monitoring Alerts

#### Alert 1: High Error Rate
```bash
# Navigate to: Alerts > Create Alert Rule
# Condition: Error rate > 5%
# Time window: 5 minutes
# Action: Email notification
```

#### Alert 2: Slow Response Times
```bash
# Navigate to: Alerts > Create Alert Rule
# Condition: P95 response time > 2000ms
# Time window: 5 minutes
# Action: Email notification
```

#### Alert 3: High Memory Usage
```bash
# Navigate to: Alerts > Create Alert Rule
# Condition: Memory usage > 1GB
# Time window: 2 minutes
# Action: Email notification
```

#### Alert 4: Database Connection Issues
```bash
# Navigate to: Alerts > Create Alert Rule
# Condition: Database errors > 10/minute
# Time window: 2 minutes
# Action: Email notification
```

#### Alert 5: Cron Job Failures (Critical for your EC2 crashes!)
```bash
# Navigate to: Alerts > Create Alert Rule
# Condition: "missed execution" OR "NODE-CRON" errors
# Time window: 1 minute
# Action: Email + Slack notification
```

### 3. Configure Performance Thresholds

#### Response Time Thresholds
```bash
# Navigate to: Performance > Settings
# Set thresholds:
- P50: < 200ms (Good)
- P75: < 500ms (Acceptable)
- P90: < 1000ms (Slow)
- P95: < 2000ms (Very Slow)
- P99: < 5000ms (Critical)
```

#### Error Rate Thresholds
```bash
# Set error rate thresholds:
- < 1%: Excellent
- 1-3%: Good
- 3-5%: Warning
- > 5%: Critical
```

### 4. Set Up Release Tracking

#### Release Configuration
```bash
# Navigate to: Releases > Create Release
# Release name: 1.0.0
# Associate commits and deployments
# Set up release health monitoring
```

### 5. Configure User Context

#### User Tracking Setup
```bash
# Your app already tracks:
✅ User ID
✅ Email
✅ Tenant ID
✅ Role (super_admin, tenant_admin, etc.)
```

## 🔧 Environment-Specific Settings

### Development Environment
```bash
# Current settings (good for development):
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% sampling
SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10% profiling
```

### Production Environment (Recommended)
```bash
# Update for production monitoring:
SENTRY_TRACES_SAMPLE_RATE=0.5  # 50% sampling
SENTRY_PROFILES_SAMPLE_RATE=0.3  # 30% profiling
```

## 📱 Notification Setup

### Email Notifications
```bash
# Navigate to: Settings > Notifications
# Configure email alerts for:
- Critical errors
- Performance degradation
- Cron job failures
- Database issues
```

### Slack Integration (Optional)
```bash
# Navigate to: Settings > Integrations > Slack
# Set up Slack webhook for real-time alerts
```

## 🎯 Key Metrics to Monitor

### Critical Metrics for Your App
1. **Authentication Success Rate**
2. **Tenant Registration Success Rate**
3. **Document Upload Success Rate**
4. **API Response Times**
5. **Database Query Performance**
6. **Memory Usage Patterns**
7. **Cron Job Execution Success**

### Business Metrics
1. **User Registration Rate**
2. **Tenant Activation Rate**
3. **Document Processing Time**
4. **Payment Processing Success Rate**

## 🚨 Emergency Alert Setup

### Critical Alerts (Immediate Response)
```bash
# Set up immediate alerts for:
- Server crashes
- Database connection failures
- Authentication system failures
- Payment processing errors
- Cron job failures (your recent issue!)
```

### Warning Alerts (Monitor)
```bash
# Set up monitoring alerts for:
- High memory usage
- Slow response times
- Increased error rates
- Performance degradation
```

## 📊 Dashboard Views

### Create Custom Dashboards
1. **Overview Dashboard**: High-level metrics
2. **Performance Dashboard**: Response times, throughput
3. **Error Dashboard**: Error rates, types, trends
4. **Business Dashboard**: User metrics, conversions
5. **Infrastructure Dashboard**: Memory, CPU, database

## 🔄 Regular Monitoring Tasks

### Daily Checks
- Review error rates and trends
- Check performance metrics
- Monitor memory usage patterns
- Review user feedback and issues

### Weekly Reviews
- Analyze performance trends
- Review error patterns
- Check release health
- Update alert thresholds if needed

### Monthly Reviews
- Comprehensive performance analysis
- Review and optimize alert rules
- Update monitoring dashboards
- Plan performance improvements
