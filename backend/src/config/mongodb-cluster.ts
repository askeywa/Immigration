// backend/src/config/mongodb-cluster.ts
import mongoose from 'mongoose';
import { log } from '../utils/logger';

export interface MongoDBClusterConfig {
  primary: string;
  secondaries: string[];
  arbiter?: string;
  replicaSetName: string;
  options: mongoose.ConnectOptions;
}

export class MongoDBClusterManager {
  private static instance: MongoDBClusterManager;
  private isConnected = false;
  private replicaSetStatus: any = null;

  private constructor() {}

  static getInstance(): MongoDBClusterManager {
    if (!MongoDBClusterManager.instance) {
      MongoDBClusterManager.instance = new MongoDBClusterManager();
    }
    return MongoDBClusterManager.instance;
  }

  /**
   * Get MongoDB cluster configuration
   */
  getClusterConfig(): MongoDBClusterConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isProduction) {
      // Production cluster configuration - use MONGODB_URI directly for Atlas
      return {
        primary: process.env.MONGODB_URI || process.env.MONGODB_PRIMARY_URI || 'mongodb://mongodb-primary:27017',
        secondaries: [
          process.env.MONGODB_SECONDARY_1_URI || 'mongodb://mongodb-secondary-1:27017',
          process.env.MONGODB_SECONDARY_2_URI || 'mongodb://mongodb-secondary-2:27017'
        ],
        arbiter: process.env.MONGODB_ARBITER_URI || 'mongodb://mongodb-arbiter:27017',
        replicaSetName: process.env.MONGODB_REPLICA_SET_NAME || 'rs0',
        options: {
          replicaSet: 'rs0',
          readPreference: 'primaryPreferred',
          maxPoolSize: 50,
          minPoolSize: 5,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          // bufferMaxEntries: 0, // Removed - not supported in current mongoose version
          bufferCommands: false,
          retryWrites: true,
          retryReads: true,
          authSource: 'admin',
          ssl: process.env.MONGODB_SSL === 'true',
          // sslValidate: process.env.MONGODB_SSL_VALIDATE !== 'false' // Removed - not supported in current mongoose version
        }
      };
    } else if (isDevelopment) {
      // Development single instance
      return {
        primary: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        secondaries: [],
        replicaSetName: '',
        options: {
          maxPoolSize: 10,
          minPoolSize: 1,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          // bufferMaxEntries: 0, // Removed - not supported in current mongoose version
          bufferCommands: false,
          retryWrites: true,
          retryReads: true
        }
      };
    } else {
      // Default configuration
      return {
        primary: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        secondaries: [],
        replicaSetName: '',
        options: {
          maxPoolSize: 20,
          minPoolSize: 2,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          // bufferMaxEntries: 0, // Removed - not supported in current mongoose version
          bufferCommands: false,
          retryWrites: true,
          retryReads: true
        }
      };
    }
  }

  /**
   * Build MongoDB connection URI for cluster
   */
  buildConnectionURI(config: MongoDBClusterConfig): string {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // If MONGODB_URI is provided and it's an Atlas URI, use it directly
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv://')) {
      return process.env.MONGODB_URI;
    }
    
    if (isProduction && config.replicaSetName) {
      // Production cluster with replica set
      const hosts = [config.primary, ...config.secondaries];
      if (config.arbiter) {
        hosts.push(config.arbiter);
      }
      
      const hostsString = hosts.join(',');
      const authString = process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD 
        ? `${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@`
        : '';
      
      return `mongodb://${authString}${hostsString}/${process.env.MONGODB_DATABASE || 'immigration_portal'}?replicaSet=${config.replicaSetName}&authSource=admin`;
    } else {
      // Single instance or development
      return config.primary;
    }
  }

  /**
   * Connect to MongoDB cluster
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      log.info('MongoDB cluster already connected');
      return;
    }

    try {
      const config = this.getClusterConfig();
      const uri = this.buildConnectionURI(config);

      log.info('Connecting to MongoDB cluster...', {
        environment: process.env.NODE_ENV,
        replicaSetName: config.replicaSetName,
        hasSecondaries: config.secondaries.length > 0,
        hasArbiter: !!config.arbiter
      });

      await mongoose.connect(uri, config.options);

      this.isConnected = true;
      
      // Set up event listeners
      this.setupEventListeners();

      // Check replica set status if in production
      if (process.env.NODE_ENV === 'production' && config.replicaSetName) {
        await this.checkReplicaSetStatus();
      }

      log.info('MongoDB cluster connected successfully', {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      });

    } catch (error) {
      log.error('Failed to connect to MongoDB cluster', {
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB cluster
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      log.info('MongoDB cluster not connected');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      log.info('MongoDB cluster disconnected successfully');
    } catch (error) {
      log.error('Failed to disconnect from MongoDB cluster', {
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
      throw error;
    }
  }

  /**
   * Setup MongoDB event listeners
   */
  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      log.info('MongoDB cluster connected');
    });

    mongoose.connection.on('error', (error: any) => {
      log.error('MongoDB cluster connection error', {
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
    });

    mongoose.connection.on('disconnected', () => {
      log.warn('MongoDB cluster disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      log.info('MongoDB cluster reconnected');
      this.isConnected = true;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      log.info('Received SIGINT, closing MongoDB cluster connection...');
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      log.info('Received SIGTERM, closing MongoDB cluster connection...');
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Check replica set status
   */
  async checkReplicaSetStatus(): Promise<any> {
    try {
      const admin = mongoose.connection.db?.admin();
      if (admin) {
        this.replicaSetStatus = await admin.replSetGetStatus();
        
        log.info('Replica set status', {
          setName: (this.replicaSetStatus as any).set,
          members: (this.replicaSetStatus as any).members.map((member: any) => ({
            name: (member as any).name,
            stateStr: (member as any).stateStr,
            health: (member as any).health,
            uptime: (member as any).uptime
          }))
        });

        return this.replicaSetStatus;
      }
    } catch (error) {
      log.error('Failed to check replica set status', {
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
    }
    return null;
  }

  /**
   * Get connection health status
   */
  getHealthStatus(): {
    isConnected: boolean;
    readyState: number;
    replicaSetStatus?: any;
    connectionInfo: {
      host?: string;
      port?: number;
      name?: string;
    };
  } {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      replicaSetStatus: this.replicaSetStatus,
      connectionInfo: {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      }
    };
  }

  /**
   * Execute database operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        log.warn(`Database operation failed (attempt ${attempt}/${maxRetries})`, {
          error: lastError.message,
          attempt,
          maxRetries
        });

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    throw lastError || new Error('Database operation failed after all retries');
  }

  /**
   * Get read preference for queries
   */
  getReadPreference(): 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest' {
    const config = this.getClusterConfig();
    
    if (process.env.NODE_ENV === 'production' && config.secondaries.length > 0) {
      // In production with secondaries, prefer primary but allow secondary reads
      return 'primaryPreferred';
    } else {
      // Development or single instance, always use primary
      return 'primary';
    }
  }

  /**
   * Get write concern for operations
   */
  getWriteConcern(): any {
    const config = this.getClusterConfig();
    
    if (process.env.NODE_ENV === 'production' && config.secondaries.length > 0) {
      // In production with replica set, require majority write concern
      return { w: 'majority', j: true, wtimeout: 5000 };
    } else {
      // Development or single instance, use basic write concern
      return { w: 1, j: true };
    }
  }

  /**
   * Check if cluster is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // Ping the database
      await mongoose.connection.db?.admin().ping();
      
      // Check replica set status in production
      if (process.env.NODE_ENV === 'production') {
        const status = await this.checkReplicaSetStatus();
        if (status) {
          // Check if primary is healthy
          const primary = (status.members as any).find((member: any) => (member as any).stateStr === 'PRIMARY');
          return primary && primary.health === 1;
        }
      }

      return true;
    } catch (error) {
      log.error('MongoDB cluster health check failed', {
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
      return false;
    }
  }
}

export default MongoDBClusterManager;
