/**
 * DI-enabled Server Factory
 * Creates Express server using DI container
 */

import express from 'express';
import { container, bootstrapContainer, initializeServices, ServiceIds } from './index';
import { Config } from '../config';
import { createServer as createExpressServer } from '../server';
import { Logger } from '../logger';

/**
 * Create server with DI container
 */
export async function createServerWithDI(): Promise<express.Application> {
  const logger = new Logger('ServerFactory');
  
  try {
    // Load config first
    const config = new Config();
    await config.load();
    
    // Register config in container
    container.registerInstance(ServiceIds.CONFIG, config);
    
    // Bootstrap DI container
    await bootstrapContainer(container);
    
    // Initialize all services
    await initializeServices(container);
    
    // Get Prisma instance if available
    let prisma = null;
    try {
      prisma = await container.resolve(ServiceIds.DATABASE);
    } catch (error) {
      logger.warn('Database not available, continuing without it');
    }
    
    // Get service manager (if needed)
    // For now, we'll pass undefined and let createServer handle it
    
    // Create Express server
    const app = createExpressServer(config, undefined, prisma);
    
    // Make container available on app for route handlers
    (app as any).container = container;
    
    logger.info('✅ Server created with DI container');
    
    return app;
  } catch (error) {
    logger.error('❌ Failed to create server with DI:', error);
    throw error;
  }
}

// Note: getService and resolveService are now exported from ./index.ts
// to avoid circular dependencies

