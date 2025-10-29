/**
 * Oliver-OS Server Configuration
 * Creates and configures the Express server with security and middleware
 */

import express from 'express';
import { createServer as createHttpServer, Server as HTTPServer } from 'http';
import path from 'node:path';
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
import { createUnifiedAgentRoutes } from '../routes/unified-agent';
import { errorHandler } from '../middleware/error-handler';
import { requestLogger } from '../middleware/request-logger';
import { requestTrace } from '../middleware/request-trace';
import { 
  generalRateLimit, 
  authRateLimit, 
  slowDownMiddleware
} from '../middleware/rate-limit';
import { SecurityManager } from './security';
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
  // Ensure CORP allows favicon and similar resources
  // @ts-ignore - helmet namespace typing
  app.use((helmet as any).crossOriginResourcePolicy({ policy: 'cross-origin' }));

  // Global CORP header to prevent OpaqueResponseBlocking for simple GET assets
  app.use((_, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });
  
  // CORS configuration
  // Strengthen CORS: allow local UI ports explicitly and credentials
  app.use(cors({
    origin: (origin, callback) => {
      const allowed = new Set<string>([
        'http://localhost:3000',
        'http://localhost:3001',
        ...(Array.isArray(securityConfig.cors?.origin) ? securityConfig.cors.origin : [])
      ]);
      if (!origin || allowed.has(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET','POST','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
  }));
  // Ensure preflight succeeds
  app.options('*', cors());

  // Add dynamic ACAO to match requesting origin (helps with ORB for simple resources)
  app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    if (origin && /^http:\/\/localhost:(3000|3001)$/.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    next();
  });
  
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
  app.use(requestTrace);

  // Static files (UI)
  const staticDir = path.join(process.cwd(), 'public');
  app.use(express.static(staticDir));

  // Set a relaxed CSP for simple UI pages under /ui to avoid extension-injected nonce parsing issues
  app.use('/ui', (_req, res, next) => {
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self' http://localhost:3000",
      "frame-ancestors 'self'"
    ].join('; '));
    next();
  });
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: config.get('version', '0.0.2'),
      message: 'Oliver-OS is running smoothly! 🚀'
    });
  });

  // Favicon handler to avoid CORP warnings in browsers
  app.get('/favicon.ico', (_req, res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.status(204).end();
  });
  
  // API routes
  // Traces endpoint (basic dashboard source)
  app.get('/api/traces', async (_req, res) => {
    try {
      const fs = await import('fs-extra');
      const pathMod = await import('node:path');
      const file = pathMod.join(process.cwd(), 'logs', 'trace.log');
      if (!(await fs.pathExists(file))) {
        res.json({ success: true, items: [] });
        return;
      }
      const text = await fs.readFile(file, 'utf-8');
      const lines = text.trim().split(/\r?\n/).slice(-200);
      const items = lines.map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean);
      res.json({ success: true, items });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to read traces', details: e?.message || 'Unknown error' });
    }
  });
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

  // Unified agent routes (for Python agent communication)
  app.use('/api/unified', createUnifiedAgentRoutes(config, serviceManager));
  
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

  // Quick link to decisions UI if file exists
  app.get('/ui/decisions', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(path.join(staticDir, 'decisions.html'));
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
  const aiServicesUrl = config.get('aiServices.url', 'http://localhost:8000') as string;
  const wsManager = new WebSocketManager(httpServer, aiServicesUrl);
  
  // Set WebSocket manager reference for routes
  setWebSocketManager(wsManager);
  
  logger.info('✅ HTTP server with WebSocket support created');
  
  return { app, httpServer, wsManager };
}
