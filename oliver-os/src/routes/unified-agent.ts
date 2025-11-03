/**
 * Unified Agent Routes
 * API endpoint for unified routing from Python agent
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { UnifiedAgentRouter, type RouteRequest } from '../services/unified-agent-router';
import { Config } from '../core/config';
import { Logger } from '../core/logger';
import { ServiceManager } from '../services/service-manager'

const logger = new Logger('UnifiedAgentRoutes');

let unifiedRouter: UnifiedAgentRouter | null = null;

/**
 * Initialize the unified router (singleton pattern)
 */
function getUnifiedRouter(config: Config, serviceManager?: ServiceManager): UnifiedAgentRouter {
  if (!unifiedRouter) {
    // unifiedRouterServiceManager = serviceManager; // Reserved for future use
    unifiedRouter = new UnifiedAgentRouter(config, serviceManager);
    unifiedRouter.initialize().catch((err) => {
      logger.error('Failed to initialize UnifiedAgentRouter:', err);
    });
  }
  return unifiedRouter;
}

/**
 * Create unified agent routes
 */
export function createUnifiedAgentRoutes(config: Config, serviceManager?: ServiceManager): Router {
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
      const router_instance = getUnifiedRouter(config, serviceManager);

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
    } catch (error: unknown) {
      logger.error('Route error:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';
      res.status(500).json({
        error: 'Failed to route message',
        details: errorMessage
      });
    }
  });

  router.get('/status', async (_req: Request, res: Response): Promise<void> => {
    try {
      const router_instance = getUnifiedRouter(config, serviceManager);
      const status = router_instance.getStatus();
      res.json({
        success: true,
        ...status
      });
    } catch (error: unknown) {
      logger.error('Status error:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';
      res.status(500).json({
        error: 'Failed to get router status',
        details: errorMessage
      });
    }
  });

  router.get('/decisions', async (_req: Request, res: Response): Promise<void> => {
    try {
      const router_instance = getUnifiedRouter(config, serviceManager);
      const items = router_instance.getRecentDecisions();
      res.json({ success: true, items });
    } catch (error: unknown) {
      logger.error('Decisions error:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';
      res.status(500).json({ error: 'Failed to get recent decisions', details: errorMessage });
    }
  });

  router.post('/inspect', async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, translated } = req.body || {};
      if (!message) { res.status(400).json({ error: 'message is required' }); return; }
      const router_instance = getUnifiedRouter(config, serviceManager);
      // Dry-run: reuse internal logic to compute reason/rules but do not submit tasks
      const result = await router_instance.route({ sender: 'inspector', message, translated, auto: true });
      delete result.taskId; // not actually submitted
      res.json({ success: true, decision: result.decision, intent: result.intent, destination: result.destination });
    } catch (error: unknown) {
      logger.error('Inspect error:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';
      res.status(500).json({ error: 'Failed to inspect routing', details: errorMessage });
    }
  });

  router.post('/confirm', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.body || {};
      if (!id) { res.status(400).json({ error: 'id is required' }); return; }
      const router_instance = getUnifiedRouter(config, serviceManager);
      // @ts-ignore - access method exists
      const item = (router_instance as unknown as { consumePending: (id: string) => { request: RouteRequest; destination: string } | undefined }).consumePending(id);
      if (!item) { res.status(404).json({ error: 'pending id not found' }); return; }

      const { request, destination } = item;
      let result;
      if (destination === 'codebuff' || request.translated?.type?.includes('research')) {
        // execute via auto-mode policy
        result = await (router_instance as unknown as { routeAutoMode: (msg: string, trans?: RouteRequest['translated']) => Promise<unknown> }).routeAutoMode(request.message, request.translated);
      } else if (destination === 'cursor') {
        result = await (router_instance as unknown as { routeToCursor: (msg: string, trans?: RouteRequest['translated'], ctx?: { reason: string; rulesMatched: string[] }) => Promise<unknown> }).routeToCursor(request.message, request.translated, { reason: 'Confirmed by user', rulesMatched: ['safety:confirmed'] });
      } else {
        result = await (router_instance as unknown as { routeToMonsterMode: (msg: string, trans?: RouteRequest['translated'], ctx?: { reason: string; rulesMatched: string[] }) => Promise<unknown> }).routeToMonsterMode(request.message, request.translated, { reason: 'Confirmed by user', rulesMatched: ['safety:confirmed'] });
      }
      res.json({ success: true, ...result as Record<string, unknown> });
    } catch (error: unknown) {
      logger.error('Confirm error:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';
      res.status(500).json({ error: 'Failed to confirm pending action', details: errorMessage });
    }
  });

  router.get('/pending', async (_req: Request, res: Response): Promise<void> => {
    try {
      const router_instance = getUnifiedRouter(config, serviceManager) as unknown as { getPending: () => Array<{ id: string; sender: string; message: string; destination: string; intent: unknown }> };
      const items = router_instance.getPending();
      res.json({ success: true, items });
    } catch (error: unknown) {
      logger.error('Pending error:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';
      res.status(500).json({ error: 'Failed to get pending items', details: errorMessage });
    }
  });

  return router;
}

