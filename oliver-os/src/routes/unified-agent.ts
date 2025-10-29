/**
 * Unified Agent Routes
 * API endpoint for unified routing from Python agent
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { UnifiedAgentRouter, type RouteRequest } from '../services/unified-agent-router';
import { Config } from '../core/config';
import { Logger } from '../core/logger';

const logger = new Logger('UnifiedAgentRoutes');

let unifiedRouter: UnifiedAgentRouter | null = null;

/**
 * Initialize the unified router (singleton pattern)
 */
function getUnifiedRouter(config: Config): UnifiedAgentRouter {
  if (!unifiedRouter) {
    unifiedRouter = new UnifiedAgentRouter(config);
    unifiedRouter.initialize().catch((err) => {
      logger.error('Failed to initialize UnifiedAgentRouter:', err);
    });
  }
  return unifiedRouter;
}

/**
 * Create unified agent routes
 */
export function createUnifiedAgentRoutes(config: Config): Router {
  const router = Router();

  router.post('/route', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sender, message, translated, auto, target } = req.body || {};

      // Validate request
      if (!message || typeof message !== 'string') {
        res.status(400).json({
          error: 'Invalid request',
          details: 'message is required and must be a string'
        });
        return;
      }

      // Get router instance
      const router_instance = getUnifiedRouter(config);

      // Build route request
      const routeRequest: RouteRequest = {
        sender: sender || 'client',
        message,
        translated,
        auto: auto === true,
        target
      };

      // Route the message
      const result = await router_instance.route(routeRequest);

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error('Route error:', error);
      res.status(500).json({
        error: 'Failed to route message',
        details: error?.message || 'Unknown error'
      });
    }
  });

  router.get('/status', async (_req: Request, res: Response): Promise<void> => {
    try {
      const router_instance = getUnifiedRouter(config);
      const status = router_instance.getStatus();
      res.json({
        success: true,
        ...status
      });
    } catch (error: any) {
      logger.error('Status error:', error);
      res.status(500).json({
        error: 'Failed to get router status',
        details: error?.message || 'Unknown error'
      });
    }
  });

  router.post('/inspect', async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, translated } = req.body || {};
      if (!message) { res.status(400).json({ error: 'message is required' }); return; }
      const router_instance = getUnifiedRouter(config);
      // Dry-run: reuse internal logic to compute reason/rules but do not submit tasks
      const result = await router_instance.route({ sender: 'inspector', message, translated, auto: true });
      delete result.taskId; // not actually submitted
      res.json({ success: true, decision: result.decision, intent: result.intent, destination: result.destination });
    } catch (error: any) {
      logger.error('Inspect error:', error);
      res.status(500).json({ error: 'Failed to inspect routing', details: error?.message || 'Unknown error' });
    }
  });

  return router;
}

