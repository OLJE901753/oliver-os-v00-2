/**
 * Health Check Routes
 * Provides system health status and diagnostics
 */

import { Router, type Request, type Response } from 'express';
import { Logger } from '../core/logger';

const router = Router();
const logger = new Logger('HealthAPI');

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

router.get('/detailed', (_req: Request, res: Response) => {
  const detailedHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    },
    application: {
      version: process.env['VERSION'] || '0.0.2',
      environment: process.env['NODE_ENV'] || 'development',
      pid: process.pid
    },
    services: {
      status: 'operational',
      lastCheck: new Date().toISOString()
    }
  };

  logger.info('Detailed health check requested');
  res.json(detailedHealth);
});

export { router as healthRouter };
