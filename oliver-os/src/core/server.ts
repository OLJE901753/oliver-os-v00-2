/**
 * Oliver-OS Server Configuration
 * Creates and configures the Express server with security and middleware
 * Now supports Dependency Injection for better testability and maintainability
 */

import express, { Router } from 'express';
import { createServer as createHttpServer, Server as HTTPServer } from 'http';
import path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from './logger';
import { Config } from './config';
import { container, ServiceIds, resolveService } from './di/index.js';
import { healthRouter } from '../routes/health';
import { backupRouter } from '../routes/backup';
import { servicesRouter } from '../routes/services';
import { processesRouter } from '../routes/processes';
import { statusRouter } from '../routes/status';
import { disruptorRouter } from '../routes/disruptor';
import { createAgentRoutes } from '../routes/agents';
import { websocketRouter, setWebSocketManager } from '../routes/websocket';
import { createAuthRoutes } from '../routes/auth';
import { createUnifiedAgentRoutes } from '../routes/unified-agent';
import { createKnowledgeGraphRoutes } from '../routes/knowledge';
import { KnowledgeGraphService } from '../services/knowledge/knowledge-graph-service';
import { createMemoryCaptureRoutes } from '../routes/memory-capture';
import { CaptureMemoryService } from '../services/memory/capture/capture-memory-service';
import { createOrganizerRoutes } from '../routes/organizer';
import { ThoughtOrganizerService } from '../services/organizer/organizer-service';
import { MinimaxProvider, type MinimaxConfig } from '../services/llm/minimax-provider';
import { createAssistantRoutes } from '../routes/assistant';
import { AssistantService } from '../services/assistant/assistant-service';
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
 * Supports both traditional and DI-based initialization
 */
export function createServer(config: Config, serviceManager?: unknown, prisma?: unknown): express.Application {
  const app = express();
  
  // Initialize security manager
  const securityManager = new SecurityManager(config);
  const securityConfig = securityManager.getConfig();
  
  // Security middleware
  app.use(helmet(securityConfig.helmet as Parameters<typeof helmet>[0]));
  // Ensure CORP allows favicon and similar resources
  // @ts-ignore - helmet namespace typing
  app.use((helmet as unknown as { crossOriginResourcePolicy: (options: { policy: string }) => unknown }).crossOriginResourcePolicy({ policy: 'cross-origin' }));

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
  // Python agent decisions endpoint (for learning dashboard)
  app.post('/api/learning/python-decisions', async (req, res) => {
    try {
      const decision = req.body;
      
      // Write to learning events file (same format as TypeScript events)
      const fs = await import('fs-extra');
      const fsModule = fs.default || fs;
      const pathMod = await import('node:path');
      const file = pathMod.join(process.cwd(), 'logs', 'learning-events.jsonl');
      
      // Ensure logs directory exists
      const logDir = pathMod.dirname(file);
      if (!(await fsModule.pathExists(logDir))) {
        await fsModule.mkdirs(logDir);
      }
      
      // Append decision as learning event
      const logEntry = {
        timestamp: decision.timestamp || new Date().toISOString(),
        event: `python_${decision.type}`,
        data: {
          ...decision.context,
          choice: decision.choice,
          reasoning: decision.reasoning
        },
        context: {
          source: 'python_agent',
          decisionType: decision.type
        }
      };
      
      await fsModule.appendFile(file, `${JSON.stringify(logEntry)}\n`, 'utf-8');
      
      logger.info(`Python agent decision logged: ${decision.type}`);
      res.json({ success: true, message: 'Decision logged' });
    } catch (e: unknown) {
      logger.error('Failed to log Python decision:', e);
      const errorMessage = e && typeof e === 'object' && 'message' in e
        ? String(e.message)
        : 'Unknown error';
      res.status(500).json({ 
        success: false,
        error: 'Failed to log decision', 
        details: errorMessage
      });
    }
  });

  // Learning events endpoint (for learning dashboard)
  app.get('/api/learning/events', async (_req, res) => {
    try {
      const fsModule = await import('fs-extra');
      const fs = fsModule.default || fsModule;
      const pathMod = await import('node:path');
      const file = pathMod.join(process.cwd(), 'logs', 'learning-events.jsonl');
      
      if (!(await fs.pathExists(file))) {
        logger.info('Learning events file not found, returning empty array');
        res.json({ success: true, events: [] });
        return;
      }
      
      const text = await fs.readFile(file, 'utf-8');
      const lines = text.trim().split(/\r?\n/).filter(Boolean);
      const events = lines.map(l => {
        try {
          return JSON.parse(l);
        } catch (parseError) {
          logger.warn(`Failed to parse learning event line: ${l.substring(0, 100)}`);
          return null;
        }
      }).filter(Boolean);
      
      logger.info(`Loaded ${events.length} learning events`);
      res.json({ success: true, events });
    } catch (e: unknown) {
      logger.error('Failed to read learning events:', e);
      const errorMessage = e && typeof e === 'object' && 'message' in e
        ? String(e.message)
        : 'Unknown error';
      const errorStack = e && typeof e === 'object' && 'stack' in e
        ? String(e.stack)
        : undefined;
      res.status(500).json({ 
        success: false,
        error: 'Failed to read learning events', 
        details: errorMessage,
        stack: process.env['NODE_ENV'] === 'development' ? errorStack : undefined
      });
    }
  });

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
    } catch (e: unknown) {
      const errorMessage = e && typeof e === 'object' && 'message' in e
        ? String(e.message)
        : 'Unknown error';
      res.status(500).json({ error: 'Failed to read traces', details: errorMessage });
    }
  });
  app.use('/api/health', healthRouter);
  app.use('/api/backup', backupRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/processes', processesRouter);
  app.use('/api/status', statusRouter);
  app.use('/api/disruptor', disruptorRouter);
  app.use('/api/websocket', websocketRouter);
  
  // Authentication routes (with rate limiting)
  if (prisma && typeof prisma === 'object' && prisma !== null && 'user' in prisma) {
    app.use('/api/auth', authRateLimit, createAuthRoutes(prisma as Parameters<typeof createAuthRoutes>[0]));
  }
  
  // Agent routes (if service manager is provided)
  if (serviceManager && typeof serviceManager === 'object' && serviceManager !== null && 'registerService' in serviceManager) {
    app.use('/api/agents', createAgentRoutes(serviceManager as Parameters<typeof createAgentRoutes>[0]));
  }

  // Unified agent routes (for Python agent communication)
  app.use('/api/unified', createUnifiedAgentRoutes(config, serviceManager && typeof serviceManager === 'object' && serviceManager !== null && 'registerService' in serviceManager ? serviceManager as Parameters<typeof createUnifiedAgentRoutes>[1] : undefined));
  
  // Assistant and Organizer routes - will be initialized async
  // Store service instances for route handlers to check (currently unused - reserved for future use)
  // let assistantServiceInstance: AssistantService | null = null;
  // let organizerServiceInstance: any = null;
  
  // Create routers that will be populated when services initialize
  const assistantRouter = Router();
  const organizerRouter = Router();
  
  // Register routers immediately (routes will be added when services initialize)
  app.use('/api/assistant', assistantRouter);
  app.use('/api/organizer', organizerRouter);
  
  // Add placeholder route to assistant router
  assistantRouter.use((_req, res) => {
    res.status(503).json({
      success: false,
      error: 'Assistant Service is initializing. Please wait a moment and try again.',
      hint: 'Check server logs for initialization status. Service requires Knowledge Graph and Memory services to be ready.',
    });
  });

  // Add placeholder route to organizer router
  organizerRouter.use((_req, res) => {
    res.status(503).json({
      success: false,
      error: 'Organizer Service is initializing. Please wait a moment and try again.',
    });
  });
  
  // Knowledge graph routes (initialize service if not provided)
  let knowledgeGraphService: KnowledgeGraphService | undefined;
  let knowledgeGraphReady = false;
  let captureMemoryService: CaptureMemoryService | undefined;
  let memoryReady = false;
  
  // Helper function to initialize assistant services when both are ready (for fallback mode)
  const initializeAssistantServices = async () => {
    if (!knowledgeGraphService || !captureMemoryService || !knowledgeGraphReady || !memoryReady) {
      return;
    }
    
    try {
      const minimaxConfig = config.get('minimax') as {
        apiKey: string;
        baseURL?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
      };

      if (minimaxConfig?.apiKey) {
        const mmConfig: MinimaxConfig = { apiKey: minimaxConfig.apiKey };
        if (minimaxConfig.baseURL !== undefined) mmConfig.baseURL = minimaxConfig.baseURL;
        if (minimaxConfig.model !== undefined) mmConfig.model = minimaxConfig.model;
        if (minimaxConfig.temperature !== undefined) mmConfig.temperature = minimaxConfig.temperature;
        if (minimaxConfig.maxTokens !== undefined) mmConfig.maxTokens = minimaxConfig.maxTokens;
        const llmProvider = new MinimaxProvider(mmConfig);

        const organizerService = new ThoughtOrganizerService(
          config,
          knowledgeGraphService,
          captureMemoryService,
          llmProvider
        );

        const { BusinessIdeaStructurer } = await import('../services/organizer/business-structurer');
        const businessStructurer = new BusinessIdeaStructurer(llmProvider, knowledgeGraphService);

        const organizerRoutes = createOrganizerRoutes(organizerService, businessStructurer);
        organizerRouter.stack.length = 0;
        organizerRouter.stack.push(...organizerRoutes.stack);

        if (serviceManager && typeof serviceManager === 'object' && serviceManager !== null && 'registerService' in serviceManager) {
          await (serviceManager as { registerService: (id: string, name: string, metadata: Record<string, unknown>) => Promise<void> }).registerService('thought-organizer', 'Thought Organizer Service', {
            status: 'ready',
          });
        }

        logger.info('✅ Thought Organizer Service initialized');

        const assistantService = new AssistantService(
          config,
          knowledgeGraphService,
          llmProvider
        );

        const assistantRoutes = createAssistantRoutes(assistantService);
        assistantRouter.stack.length = 0;
        assistantRouter.stack.push(...assistantRoutes.stack);

        if (serviceManager && typeof serviceManager === 'object' && serviceManager !== null && 'registerService' in serviceManager) {
          await (serviceManager as { registerService: (id: string, name: string, metadata: Record<string, unknown>) => Promise<void> }).registerService('assistant', 'AI Assistant Service', {
            status: 'ready',
          });
        }

        logger.info('✅ AI Assistant Service initialized');
      } else {
        logger.warn('⚠️ Minimax API key not configured - Assistant and Organizer services disabled');
      }
    } catch (error) {
      logger.error(`Failed to initialize assistant services: ${error}`);
    }
  };
  
  // Try to use DI container if available, otherwise fall back to manual instantiation
  const useDI = container.has(ServiceIds.KNOWLEDGE_GRAPH_SERVICE);
  
  if (useDI) {
    // Use DI container for service resolution
    resolveService<KnowledgeGraphService>(ServiceIds.KNOWLEDGE_GRAPH_SERVICE).then(async (service) => {
      knowledgeGraphService = service;
      knowledgeGraphReady = true;
      app.use('/api/knowledge', createKnowledgeGraphRoutes(service));
      
      if (serviceManager && typeof serviceManager === 'object' && serviceManager !== null && 'registerService' in serviceManager) {
        await (serviceManager as { registerService: (id: string, name: string, metadata: Record<string, unknown>) => Promise<void> }).registerService('knowledge-graph', 'Knowledge Graph Service', {
          stats: await service.getGraphStats(),
        });
      }

      // Initialize Automatic Linking Engine
      try {
        const { AutomaticLinkingEngine } = await import('../services/organizer/automatic-linking-engine');
        const linkingEngine = new AutomaticLinkingEngine(service);
        service.setAutomaticLinkingEngine(linkingEngine);
        logger.info('✅ Automatic Linking Engine initialized');
      } catch (error) {
        logger.warn(`Automatic Linking Engine initialization failed: ${error}`);
      }
      
      if (memoryReady && service) {
        await initializeAssistantServices();
      }
    }).catch((error) => {
      logger.warn(`Knowledge Graph Service initialization failed: ${error}`);
    });

    resolveService<CaptureMemoryService>(ServiceIds.CAPTURE_MEMORY_SERVICE).then(async (service) => {
      captureMemoryService = service;
      memoryReady = true;
      app.use('/api/memory', createMemoryCaptureRoutes(service));
      
      if (serviceManager && typeof serviceManager === 'object' && serviceManager !== null && 'registerService' in serviceManager) {
        await (serviceManager as { registerService: (id: string, name: string, metadata: Record<string, unknown>) => Promise<void> }).registerService('memory-capture', 'Memory Capture Service', {
          stats: await service.getStats(),
        });
      }

      if (knowledgeGraphReady && knowledgeGraphService) {
        await initializeAssistantServices();
      }
    }).catch((error) => {
      logger.warn(`Memory Capture Service initialization failed: ${error}`);
    });

    // Use DI for assistant services
    resolveService<ThoughtOrganizerService>(ServiceIds.THOUGHT_ORGANIZER_SERVICE).then(async (service) => {
      const { BusinessIdeaStructurer } = await import('../services/organizer/business-structurer');
      const llmProvider = await resolveService<MinimaxProvider>(ServiceIds.MINIMAX_PROVIDER);
      const businessStructurer = new BusinessIdeaStructurer(llmProvider, knowledgeGraphService!);
      
      const organizerRoutes = createOrganizerRoutes(service, businessStructurer);
      organizerRouter.stack.length = 0;
      organizerRouter.stack.push(...organizerRoutes.stack);
      
      if (serviceManager && typeof serviceManager === 'object' && serviceManager !== null && 'registerService' in serviceManager) {
        await (serviceManager as { registerService: (id: string, name: string, metadata: Record<string, unknown>) => Promise<void> }).registerService('thought-organizer', 'Thought Organizer Service', {
          status: 'ready',
        });
      }

      logger.info('✅ Thought Organizer Service initialized (via DI)');
    }).catch((error) => {
      logger.warn(`Thought Organizer Service initialization failed: ${error}`);
    });

    resolveService<AssistantService>(ServiceIds.ASSISTANT_SERVICE).then(async (service) => {
      const assistantRoutes = createAssistantRoutes(service);
      assistantRouter.stack.length = 0;
      assistantRouter.stack.push(...assistantRoutes.stack);
      
      if (serviceManager && typeof serviceManager === 'object' && serviceManager !== null && 'registerService' in serviceManager) {
        await (serviceManager as { registerService: (id: string, name: string, metadata: Record<string, unknown>) => Promise<void> }).registerService('assistant', 'AI Assistant Service', {
          status: 'ready',
        });
      }

      logger.info('✅ AI Assistant Service initialized (via DI)');
    }).catch((error) => {
      logger.warn(`AI Assistant Service initialization failed: ${error}`);
    });
  } else {
    // Fallback to manual instantiation (existing code)
    try {
      knowledgeGraphService = new KnowledgeGraphService(config);
      knowledgeGraphService.initialize().then(async () => {
        if (!knowledgeGraphService) return;
        knowledgeGraphReady = true;
        app.use('/api/knowledge', createKnowledgeGraphRoutes(knowledgeGraphService));
        
        // Register with service manager if available
        if (serviceManager && typeof serviceManager === 'object' && serviceManager !== null && 'registerService' in serviceManager) {
          await (serviceManager as { registerService: (id: string, name: string, metadata: Record<string, unknown>) => Promise<void> }).registerService('knowledge-graph', 'Knowledge Graph Service', {
            stats: await knowledgeGraphService.getGraphStats(),
          });
        }

        // Initialize Automatic Linking Engine
        try {
          const { AutomaticLinkingEngine } = await import('../services/organizer/automatic-linking-engine');
          const linkingEngine = new AutomaticLinkingEngine(knowledgeGraphService);
          knowledgeGraphService.setAutomaticLinkingEngine(linkingEngine);
          logger.info('✅ Automatic Linking Engine initialized');
        } catch (error) {
          logger.warn(`Automatic Linking Engine initialization failed: ${error}`);
        }
        
        // Try to initialize assistant/organizer if memory service is also ready
        if (memoryReady) {
          await initializeAssistantServices();
        }
      }).catch((error) => {
        logger.warn(`Knowledge Graph Service initialization failed: ${error}`);
      });
    } catch (error) {
      logger.warn(`Knowledge Graph Service not available: ${error}`);
    }
    
    // Memory capture routes
    try {
      captureMemoryService = new CaptureMemoryService(config);
      captureMemoryService.initialize().then(async () => {
        if (!captureMemoryService) return;
        memoryReady = true;
        app.use('/api/memory', createMemoryCaptureRoutes(captureMemoryService));
        
        // Register with service manager if available
        if (serviceManager && typeof serviceManager === 'object' && serviceManager !== null && 'registerService' in serviceManager) {
          await (serviceManager as { registerService: (id: string, name: string, metadata: Record<string, unknown>) => Promise<void> }).registerService('memory-capture', 'Memory Capture Service', {
            stats: await captureMemoryService.getStats(),
          });
        }

        // Try to initialize assistant/organizer if knowledge graph is also ready
        if (knowledgeGraphReady) {
          await initializeAssistantServices();
        }
      }).catch((error) => {
        logger.warn(`Memory Capture Service initialization failed: ${error}`);
      });
    } catch (error) {
      logger.warn(`Memory Capture Service not available: ${error}`);
    }
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
        auth: '/api/auth',
        knowledge: '/api/knowledge',
        memory: '/api/memory',
        organizer: '/api/organizer',
        assistant: '/api/assistant'
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

  // Learning dashboard UI
  app.get('/ui/learning', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(path.join(staticDir, 'learning-dashboard.html'));
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
export function createHttpServerWithWebSocket(config: Config, serviceManager?: unknown, prisma?: unknown): { app: express.Application; httpServer: HTTPServer; wsManager: WebSocketManager } {
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
