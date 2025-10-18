/**
 * Oliver-OS Server Configuration
 * Creates and configures the Express server with security and middleware
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from './logger';
import { Config } from './config';
import { healthRouter } from '../routes/health';
import { servicesRouter } from '../routes/services';
import { processesRouter } from '../routes/processes';
import { statusRouter } from '../routes/status';
import { disruptorRouter } from '../routes/disruptor';
import { createAgentRoutes } from '../routes/agents';
import { errorHandler } from '../middleware/error-handler';
import { requestLogger } from '../middleware/request-logger';

const logger = new Logger('Server');

/**
 * Create and configure Express server
 */
export function createServer(config: Config, serviceManager?: any): express.Application {
  const app = express();
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'nonce-{random}'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }));
  
  // CORS configuration
  const corsOrigin = config.get('cors.origin');
  app.use(cors({
    origin: Array.isArray(corsOrigin) ? corsOrigin : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  }));
  
  // Compression middleware
  app.use(compression());
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging
  app.use(requestLogger);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: config.get('version', '0.0.2'),
      message: 'Oliver-OS is running smoothly! 🚀'
    });
  });
  
  // API routes
  app.use('/api/health', healthRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/processes', processesRouter);
  app.use('/api/status', statusRouter);
  app.use('/api/disruptor', disruptorRouter);
  
  // Agent routes (if service manager is provided)
  if (serviceManager) {
    app.use('/api/agents', createAgentRoutes(serviceManager));
  }
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Oliver-OS',
      version: config.get('version', '0.0.2'),
      description: 'A rebellious operating system for disrupting bureaucracy',
      motto: 'For the honor, not the glory—by the people, for the people.',
      endpoints: {
        health: '/api/health',
        services: '/api/services',
        processes: '/api/processes',
        status: '/api/status',
        agents: '/api/agents'
      }
    });
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Endpoint not found',
      path: req.originalUrl,
      method: req.method,
      message: 'This endpoint does not exist in Oliver-OS'
    });
  });
  
  // Error handling middleware (must be last)
  app.use(errorHandler);
  
  logger.info('✅ Server configured with security, CORS, and middleware');
  
  return app;
}
