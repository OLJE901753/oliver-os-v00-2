/**
 * Oliver-OS Server Configuration
 * Creates and configures the Express server with security and middleware
 */

import express from 'express';
import { createServer as createHttpServer, Server as HTTPServer } from 'http';
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
import { websocketRouter, setWebSocketManager } from '../routes/websocket';
import { createAuthRoutes } from '../routes/auth';
import { errorHandler } from '../middleware/error-handler';
import { requestLogger } from '../middleware/request-logger';
import { createAuthMiddleware } from '../middleware/auth';
import { 
  generalRateLimit, 
  authRateLimit, 
  strictRateLimit, 
  slowDownMiddleware,
  userRateLimit 
} from '../middleware/rate-limit';
import { SecurityManager } from './security';
import { createValidationMiddleware } from '../middleware/validation';
import { createSecurityHeadersMiddleware } from '../middleware/security-headers';
import { WebSocketManager } from './websocket-manager';

const logger = new Logger('Server');

/**
 * Create and configure Express server
 */
export function createServer(config: Config, serviceManager?: any, prisma?: any): express.Application {
  const app = express();
  
  // Initialize security manager
  const securityManager = new SecurityManager(config);
  const securityConfig = securityManager.getConfig();
  
  // Security middleware
  app.use(helmet(securityConfig.helmet));
  
  // CORS configuration
  app.use(cors(securityConfig.cors));
  
  // Compression middleware
  app.use(compression());
  
  // Security headers middleware
  const securityHeadersMiddleware = createSecurityHeadersMiddleware(securityManager);
  app.use(securityHeadersMiddleware.addRequestId);
  app.use(securityHeadersMiddleware.addTimingHeaders);
  app.use(securityHeadersMiddleware.addSecurityHeaders);
  app.use(securityHeadersMiddleware.addCorsHeaders);
  app.use(securityHeadersMiddleware.logSecurityEvents);
  
  // Rate limiting middleware
  app.use(generalRateLimit);
  app.use(slowDownMiddleware);
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging
  app.use(requestLogger);
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
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
  app.use('/api/websocket', websocketRouter);
  
  // Authentication routes (with rate limiting)
  if (prisma) {
    app.use('/api/auth', authRateLimit, createAuthRoutes(prisma));
  }
  
  // Agent routes (if service manager is provided)
  if (serviceManager) {
    app.use('/api/agents', createAgentRoutes(serviceManager));
  }
  
  // Root endpoint
  app.get('/', (_req, res) => {
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
        agents: '/api/agents',
        websocket: '/api/websocket',
        auth: '/api/auth'
      },
      websocket: {
        url: 'ws://localhost:3000/ws/{client_id}',
        events: [
          'thought:create',
          'thought:analyze', 
          'collaboration:event',
          'agent:spawn',
          'voice:data'
        ]
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

/**
 * Create HTTP server with WebSocket support
 */
export function createHttpServerWithWebSocket(config: Config, serviceManager?: any, prisma?: any): { app: express.Application; httpServer: HTTPServer; wsManager: WebSocketManager } {
  const app = createServer(config, serviceManager, prisma);
  const httpServer = createHttpServer(app);
  
  // Initialize WebSocket manager
  const aiServicesUrl = config.get('aiServices.url', 'http://localhost:8000');
  const wsManager = new WebSocketManager(httpServer, aiServicesUrl);
  
  // Set WebSocket manager reference for routes
  setWebSocketManager(wsManager);
  
  logger.info('✅ HTTP server with WebSocket support created');
  
  return { app, httpServer, wsManager };
}
