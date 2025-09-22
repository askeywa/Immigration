
// backend/src/config/database.ts
import mongoose from 'mongoose';
import { config } from './config';
import { log } from '../utils/logger';
import MongoDBClusterManager from './mongodb-cluster';

export const connectDatabase = async (): Promise<void> => {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const hasExternalUri = !!(process.env.MONGODB_URI || process.env.MONGO_URI);
      if (!hasExternalUri && config.allowStartWithoutDb) {
        log.warn('⚠️  No MONGODB_URI provided. Continuing without database connection (development mode).');
        return; // Skip DB connection entirely in dev if allowed
      }

      // Use cluster manager for production, fallback to simple connection for development
      if (process.env.NODE_ENV === 'production') {
        const clusterManager = MongoDBClusterManager.getInstance();
        await clusterManager.connect();
      } else {
        // Development mode - use simple connection with retry logic
        const mongooseOptions = {
          maxPoolSize: 5,                     // ✅ REDUCED FROM 10 to 5
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 30000,             // ✅ REDUCED FROM 45000
          connectTimeoutMS: 8000,             // ✅ REDUCED FROM 10000
          retryWrites: true,
          retryReads: true,
          // ✅ REMOVED: bufferMaxEntries (not supported in newer Mongoose)
          // ✅ REMOVED: bufferCommands (causes connection issues)
        };

        const mongoUriToUse = config.mongoUri;

        try {
          await mongoose.connect(mongoUriToUse, mongooseOptions);
          log.info('✅ MongoDB connected successfully');
          return; // Success, exit retry loop
        } catch (dbErr) {
          if (config.allowStartWithoutDb) {
            log.warn('⚠️  Failed to connect to MongoDB. Continuing without DB in dev mode.', { error: dbErr instanceof Error ? dbErr.message : String(dbErr) });
            return; // proceed without active DB
          }
          throw dbErr;
        }
      }
      
      // Handle connection events
      mongoose.connection.on('error', (error: any) => {
        log.error('❌ MongoDB connection error:', { error: error instanceof Error ? error.message : String(error) });
      });
      
      mongoose.connection.on('disconnected', () => {
        log.warn('⚠️  MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        log.info('✅ MongoDB reconnected');
      });
      
      return; // Success, exit retry loop
      
    } catch (error) {
      log.error(`❌ MongoDB connection attempt ${attempt}/${maxRetries} failed:`, { 
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
        attempt,
        maxRetries
      });
      
      if (attempt === maxRetries) {
        log.error('❌ All MongoDB connection attempts failed. Server will not start.');
        throw error;
      }
      
      log.info(`⏳ Retrying MongoDB connection in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};