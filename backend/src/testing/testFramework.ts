// backend/src/testing/testFramework.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { log } from '../utils/logger';

interface TestContext {
  tenantId: string;
  userId: string;
  userRole: string;
  testData: any;
  cleanup: () => Promise<void>;
}

interface TestSuite {
  name: string;
  description: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

interface TestCase {
  name: string;
  description: string;
  test: (context: TestContext) => Promise<void>;
  expectedResult?: any;
  timeout?: number;
}

class ComprehensiveTestFramework {
  private testSuites: TestSuite[] = [];
  private results: any[] = [];
  private isRunning = false;

  constructor() {
    this.setupGlobalTestHandlers();
  }

  /**
   * Add a test suite
   */
  addTestSuite(suite: TestSuite): void {
    this.testSuites.push(suite);
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<TestResults> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    this.results = [];
    
    log.info('Starting comprehensive test suite', { 
      totalSuites: this.testSuites.length 
    });

    const startTime = Date.now();

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const results = this.generateTestResults(duration);
    
    log.info('Test suite completed', { 
      duration: `${duration}ms`,
      totalTests: (results as any).totalTests,
      passed: (results as any).passed,
      failed: (results as any).failed
    });

    this.isRunning = false;
    return results;
  }

  /**
   * Run a specific test suite
   */
  private async runTestSuite(suite: TestSuite): Promise<void> {
    log.info(`Running test suite: ${suite.name}`);

    // Setup
    if (suite.setup) {
      try {
        await suite.setup();
      } catch (error) {
        log.error(`Test suite setup failed: ${suite.name}`, { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        this.results.push({
          suite: suite.name,
          status: 'setup_failed',
          error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
        });
        return;
      }
    }

    // Run tests
    for (const testCase of suite.tests) {
      await this.runTestCase(suite.name, testCase);
    }

    // Teardown
    if (suite.teardown) {
      try {
        await suite.teardown();
      } catch (error) {
        log.error(`Test suite teardown failed: ${suite.name}`, { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
      }
    }
  }

  /**
   * Run a specific test case
   */
  private async runTestCase(suiteName: string, testCase: TestCase): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Create test context
      const context = await this.createTestContext();
      
      // Run test with timeout
      const timeout = testCase.timeout || 30000;
      const testPromise = testCase.test(context);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      );

      await Promise.race([testPromise, timeoutPromise]);
      
      // Cleanup
      await context.cleanup();

      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: suiteName,
        test: testCase.name,
        status: 'passed',
        duration,
        description: testCase.description
      });

      log.info(`Test passed: ${testCase.name}`, { duration: `${duration}ms` });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: suiteName,
        test: testCase.name,
        status: 'failed',
        duration,
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
        description: testCase.description
      });

      log.error(`Test failed: ${testCase.name}`, { 
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
        duration: `${duration}ms`
      });
    }
  }

  /**
   * Create test context with isolated data
   */
  private async createTestContext(): Promise<TestContext> {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create test tenant
    const Tenant = mongoose.model('Tenant');
    const testTenant = await Tenant.create({
      name: `Test Tenant ${testId}`,
      domain: `test-${testId}`,
      email: `test-${testId}@example.com`,
      status: 'active',
      type: 'RCIC'
    });

    // Create test user
    const User = mongoose.model('User');
    const testUser = await User.create({
      email: `test-${testId}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      tenantId: testTenant._id,
      isActive: true
    });

    return {
      tenantId: testTenant._id.toString(),
      userId: testUser._id.toString(),
      userRole: 'admin',
      testData: {
        tenantId: testTenant._id,
        userId: testUser._id,
        testId
      },
      cleanup: async () => {
        // Clean up test data
        await User.deleteOne({ _id: testUser._id });
        await Tenant.deleteOne({ _id: testTenant._id });
        
        // Clean up any other test data
        await this.cleanupTestData(testId);
      }
    };
  }

  /**
   * Clean up test data
   */
  private async cleanupTestData(testId: string): Promise<void> {
    try {
      // Clean up documents
      const Document = mongoose.model('Document');
      await Document.deleteMany({ testId });

      // Clean up profiles
      const Profile = mongoose.model('Profile');
      await Profile.deleteMany({ testId });

      // Clean up any other collections with test data
      const collections = await mongoose.connection.db?.listCollections().toArray() || [];
      
      for (const collection of collections) {
        if (collection.name.includes('test') || collection.name.includes('temp')) {
          await mongoose.connection.db?.collection(collection.name).deleteMany({ testId });
        }
      }
    } catch (error) {
      log.error('Test cleanup error', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error), testId });
    }
  }

  /**
   * Generate test results
   */
  private generateTestResults(duration: number): TestResults {
    const totalTests = this.results.length;
    const passed = this.results.filter((r: any) => r.status === 'passed').length;
    const failed = this.results.filter((r: any) => r.status === 'failed').length;
    const setupFailed = this.results.filter((r: any) => r.status === 'setup_failed').length;

    return {
      totalTests,
      passed,
      failed,
      setupFailed,
      duration,
      successRate: totalTests > 0 ? (passed / totalTests) * 100 : 0,
      results: this.results,
      summary: {
        passedSuites: [...new Set(this.results.filter((r: any) => r.status === 'passed').map((r: any) => r.suite))].length,
        failedSuites: [...new Set(this.results.filter((r: any) => r.status === 'failed' || r.status === 'setup_failed').map((r: any) => r.suite))].length,
        averageTestDuration: this.results.length > 0 ? this.results.reduce((sum: any, r: any) => sum + r.duration, 0) / this.results.length : 0
      }
    };
  }

  /**
   * Setup global test handlers
   */
  private setupGlobalTestHandlers(): void {
    // Handle uncaught exceptions during tests
    process.on('uncaughtException', (error: any) => {
      if (this.isRunning) {
        log.error('Uncaught exception during test', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
      }
    });

    // Handle unhandled promise rejections during tests
    process.on('unhandledRejection', (reason: any, promise: any) => {
      if (this.isRunning) {
        log.error('Unhandled promise rejection during test', { 
          reason: reason instanceof Error ? reason.message : reason,
          promise: promise.toString()
        });
      }
    });
  }

  /**
   * Create test middleware for Express
   */
  createTestMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add test utilities to request
      (req as any).testUtils = {
        createTestTenant: async () => {
          const Tenant = mongoose.model('Tenant');
          return await Tenant.create({
            name: `Test Tenant ${Date.now()}`,
            domain: `test-${Date.now()}`,
            email: `test-${Date.now()}@example.com`,
            status: 'active',
            type: 'RCIC'
          });
        },
        createTestUser: async (tenantId: string) => {
          const User = mongoose.model('User');
          return await User.create({
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'admin',
            tenantId,
            isActive: true
          });
        },
        cleanupTestData: async (testId: string) => {
          await this.cleanupTestData(testId);
        }
      };

      next();
    };
  }
}

interface TestResults {
  totalTests: number;
  passed: number;
  failed: number;
  setupFailed: number;
  duration: number;
  successRate: number;
  results: any[];
  summary: {
    passedSuites: number;
    failedSuites: number;
    averageTestDuration: number;
  };
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      testUtils?: {
        createTestTenant: () => Promise<any>;
        createTestUser: (tenantId: string) => Promise<any>;
        cleanupTestData: (testId: string) => Promise<void>;
      };
    }
  }
}

export default ComprehensiveTestFramework;
