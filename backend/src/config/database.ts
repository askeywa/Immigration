// backend/src/config/database.ts
import mongoose from 'mongoose';
import { config } from './config';
import { log } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if we have any MongoDB URI
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || config.mongoUri;
      
      if (!mongoUri) {
        if (config.allowStartWithoutDb) {
          log.warn('⚠️  No MONGODB_URI provided. Continuing without database connection (development mode).');
          return; // Skip DB connection entirely in dev if allowed
        } else {
          throw new Error('MongoDB URI is required but not provided');
        }
      }

      // Use direct connection for both production and development
      // The cluster manager was causing URI parsing issues
      const mongooseOptions: mongoose.ConnectOptions = {
        // Connection pool settings
        maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5,
        minPoolSize: process.env.NODE_ENV === 'production' ? 2 : 1,
        
        // Timeout settings
        serverSelectionTimeoutMS: 10000, // Increased for EC2
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000, // Increased for EC2
        
        // Retry settings
        retryWrites: true,
        retryReads: true,
        
        // Memory management
        maxIdleTimeMS: 30000,
      };

      // Add production-specific options
      if (process.env.NODE_ENV === 'production') {
        mongooseOptions.readPreference = 'primaryPreferred';
        mongooseOptions.authSource = 'admin';
        
        // Only add SSL options if explicitly configured
        if (process.env.MONGODB_SSL === 'true') {
          mongooseOptions.ssl = true;
        }
      }

      log.info('🔄 Attempting to connect to MongoDB...', {
        attempt,
        maxRetries,
        environment: process.env.NODE_ENV,
        uriProvided: !!mongoUri,
        isAtlasUri: mongoUri.includes('mongodb+srv://'),
        isLocalUri: mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')
      });

      await mongoose.connect(mongoUri, mongooseOptions);
      
      log.info('✅ MongoDB connected successfully', {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      });
      
      // Set up connection event handlers
      setupConnectionEventHandlers();
      
      return; // Success, exit retry loop
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      log.error(`❌ MongoDB connection attempt ${attempt}/${maxRetries} failed:`, { 
        error: errorMessage,
        attempt,
        maxRetries,
        environment: process.env.NODE_ENV
      });
      
      // If this is the last attempt, check if we can continue without DB
      if (attempt === maxRetries) {
        if (config.allowStartWithoutDb && process.env.NODE_ENV !== 'production') {
          log.warn('⚠️  All MongoDB connection attempts failed. Continuing without DB in development mode.');
          return;
        } else {
          log.error('❌ All MongoDB connection attempts failed. Server cannot start without database in production.');
          throw new Error(`MongoDB connection failed after ${maxRetries} attempts: ${errorMessage}`);
        }
      }
      
      log.info(`⏳ Retrying MongoDB connection in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

/**
 * Set up MongoDB connection event handlers
 */
function setupConnectionEventHandlers(): void {
  mongoose.connection.on('error', (error: any) => {
    log.error('❌ MongoDB connection error:', { 
      error: error instanceof Error ? error.message : String(error),
      readyState: mongoose.connection.readyState
    });
  });
  
  mongoose.connection.on('disconnected', () => {
    log.warn('⚠️  MongoDB disconnected', {
      readyState: mongoose.connection.readyState
    });
  });
  
  mongoose.connection.on('reconnected', () => {
    log.info('✅ MongoDB reconnected', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      readyState: mongoose.connection.readyState
    });
  });
  
  mongoose.connection.on('close', () => {
    log.info('🔌 MongoDB connection closed');
  });
}

/**
 * Gracefully disconnect from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    log.info('✅ MongoDB disconnected successfully');
  } catch (error) {
    log.error('❌ Error disconnecting from MongoDB:', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

/**
 * Check if database is connected
 */
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get database connection info
 */
export const getDatabaseInfo = () => {
  return {
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    isConnected: isDatabaseConnected()
  };
};