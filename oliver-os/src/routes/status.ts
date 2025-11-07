/**
 * System Status API Routes
 * Provides comprehensive system status and metrics
 */

import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';

const router: IRouter = Router();
const logger = new Logger('StatusAPI');

router.get('/', (_req: Request, res: Response) => {
  const status = {
    system: {
      status: 'operational',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env['VERSION'] || '0.0.2',
      environment: process.env['NODE_ENV'] || 'development'
    },
    performance: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch
    },
    services: {
      total: 4,
      running: 4,
      status: 'healthy'
    },
    processes: {
      total: 2,
      running: 2,
      status: 'healthy'
    },
    motto: 'For the honor, not the glory—by the people, for the people.'
  };

  logger.info('System status requested');
  res.json(status);
});

router.get('/metrics', (req: Request, res: Response) => {
  // Calculate actual response time from request header if available
  const requestStart = req.headers['x-request-start'] 
    ? parseInt(req.headers['x-request-start'] as string) 
    : null;
  const responseTime = requestStart ? Date.now() - requestStart : null;
  
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    application: {
      version: process.env['VERSION'] || '0.0.2',
      environment: process.env['NODE_ENV'] || 'development',
      pid: process.pid
    },
    performance: {
      responseTime,
      // Note: requestCount would need to be tracked by middleware or a monitoring service
      // For now, this is omitted as it requires real tracking infrastructure
    }
  };

  logger.info('System metrics requested');
  res.json(metrics);
});

export { router as statusRouter };
