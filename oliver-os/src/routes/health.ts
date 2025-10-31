/**
 * Health Check Routes
 * Provides comprehensive system health status and diagnostics
 * Phase 5.2: Enhanced monitoring and observability
 */

import { Router, type IRouter, type Request, type Response } from 'express';
import { Logger } from '../core/logger';
import { container, ServiceIds, resolveService } from '../core/di/index.js';

const router: IRouter = Router();
const logger = new Logger('HealthAPI');

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latency?: number;
  error?: string;
  lastCheck?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  version: string;
  environment: string;
  services: ServiceHealth[];
  checks: {
    database: ServiceHealth;
    knowledgeGraph: ServiceHealth;
    memoryCapture: ServiceHealth;
    assistant: ServiceHealth;
  };
}

/**
 * Check service health with timeout
 */
async function checkService(
  name: string,
  checkFn: () => Promise<boolean>,
  timeoutMs = 5000
): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    const result = await Promise.race([
      checkFn(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
    const latency = Date.now() - startTime;
    
    return {
      name,
      status: result ? 'healthy' : 'degraded',
      latency,
      lastCheck: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      name,
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error.message || 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Basic health check endpoint
 */
router.get('/', (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env['VERSION'] || '0.0.2',
    environment: process.env['NODE_ENV'] || 'development',
    message: 'Oliver-OS is running smoothly! 🚀'
  };

  logger.info('Health check requested', { 
    userAgent: req.get('User-Agent'),
    ip: req.ip 
  });

  res.json(health);
});

/**
 * Detailed health check with service dependencies
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const services: ServiceHealth[] = [];
  
  // Check database connection
  const dbHealth = await checkService('database', async () => {
    if (container.has(ServiceIds.DATABASE)) {
      try {
        const db = await resolveService(ServiceIds.DATABASE);
        // @ts-ignore - Prisma client has $queryRaw
        await db.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    }
    return false; // Database not configured
  });
  services.push(dbHealth);

  // Check Knowledge Graph Service
  const kgHealth = await checkService('knowledgeGraph', async () => {
    if (container.has(ServiceIds.KNOWLEDGE_GRAPH_SERVICE)) {
      try {
        const kg = await resolveService(ServiceIds.KNOWLEDGE_GRAPH_SERVICE);
        // @ts-ignore - Service has getStats method
        const stats = kg.getStats?.();
        return stats !== undefined;
      } catch {
        return false;
      }
    }
    return true; // Optional service
  });
  services.push(kgHealth);

  // Check Memory Capture Service
  const memoryHealth = await checkService('memoryCapture', async () => {
    if (container.has(ServiceIds.CAPTURE_MEMORY_SERVICE)) {
      try {
        const mem = await resolveService(ServiceIds.CAPTURE_MEMORY_SERVICE);
        // @ts-ignore - Service has getStats method
        const stats = mem.getStats?.();
        return stats !== undefined;
      } catch {
        return false;
      }
    }
    return true; // Optional service
  });
  services.push(memoryHealth);

  // Check Assistant Service
  const assistantHealth = await checkService('assistant', async () => {
    if (container.has(ServiceIds.ASSISTANT_SERVICE)) {
      try {
        const assistant = await resolveService(ServiceIds.ASSISTANT_SERVICE);
        return assistant !== null && assistant !== undefined;
      } catch {
        return false;
      }
    }
    return true; // Optional service
  });
  services.push(assistantHealth);

  // Determine overall status
  const unhealthyServices = services.filter(s => s.status === 'unhealthy');
  const degradedServices = services.filter(s => s.status === 'degraded');
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyServices.length > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedServices.length > 0 || dbHealth.status === 'unhealthy') {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  const detailedHealth: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env['VERSION'] || '0.0.2',
    environment: process.env['NODE_ENV'] || 'development',
    services,
    checks: {
      database: dbHealth,
      knowledgeGraph: kgHealth,
      memoryCapture: memoryHealth,
      assistant: assistantHealth
    }
  };

  logger.info('Detailed health check completed', {
    status: overallStatus,
    duration: Date.now() - startTime,
    services: services.map(s => `${s.name}:${s.status}`)
  });

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503;
  res.status(statusCode).json(detailedHealth);
});

/**
 * Readiness probe (for Kubernetes/container orchestration)
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check critical services
    const criticalChecks = [
      checkService('database', async () => {
        if (container.has(ServiceIds.DATABASE)) {
          const db = await resolveService(ServiceIds.DATABASE);
          // @ts-ignore
          await db.$queryRaw`SELECT 1`;
          return true;
        }
        return false;
      })
    ];

    const results = await Promise.all(criticalChecks);
    const allHealthy = results.every(r => r.status === 'healthy');

    if (allHealthy) {
      res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ 
        status: 'not ready', 
        timestamp: new Date().toISOString(),
        checks: results
      });
    }
  } catch (error: any) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({ 
      status: 'not ready', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness probe (for Kubernetes/container orchestration)
 */
router.get('/live', (_req: Request, res: Response) => {
  // Simple check - if this endpoint responds, the app is alive
  res.status(200).json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Metrics endpoint (Prometheus-compatible)
 */
router.get('/metrics', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const uptime = process.uptime();
  
  // Prometheus format metrics
  const metrics = [
    `# HELP oliver_os_uptime_seconds Total uptime in seconds`,
    `# TYPE oliver_os_uptime_seconds gauge`,
    `oliver_os_uptime_seconds ${uptime}`,
    '',
    `# HELP oliver_os_memory_heap_used_bytes Heap memory used in bytes`,
    `# TYPE oliver_os_memory_heap_used_bytes gauge`,
    `oliver_os_memory_heap_used_bytes ${mem.heapUsed}`,
    '',
    `# HELP oliver_os_memory_heap_total_bytes Total heap memory in bytes`,
    `# TYPE oliver_os_memory_heap_total_bytes gauge`,
    `oliver_os_memory_heap_total_bytes ${mem.heapTotal}`,
    '',
    `# HELP oliver_os_memory_rss_bytes Resident set size in bytes`,
    `# TYPE oliver_os_memory_rss_bytes gauge`,
    `oliver_os_memory_rss_bytes ${mem.rss}`,
    '',
    `# HELP oliver_os_memory_external_bytes External memory in bytes`,
    `# TYPE oliver_os_memory_external_bytes gauge`,
    `oliver_os_memory_external_bytes ${mem.external}`,
    ''
  ].join('\n');

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

export { router as healthRouter };
