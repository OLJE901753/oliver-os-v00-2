/**
 * Assistant API Routes
 * Express routes for AI assistant with knowledge graph access
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';
import type { AssistantService, ChatRequest } from '../services/assistant/assistant-service';

const logger = new Logger('AssistantAPI');

export function createAssistantRoutes(assistantService: AssistantService): IRouter {
  const router: IRouter = Router();

  /**
   * POST /api/assistant/chat
   * Send a message to the assistant
   */
  router.post('/chat', async (req: Request, res: Response) => {
    try {
      const { sessionId, message, context } = req.body as ChatRequest;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'message is required and must be a string',
        });
      }

      const userId = (req as any).user?.id || 'default';

      const response = await assistantService.chat(
        {
          sessionId,
          message,
          context,
        },
        userId
      );

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error(`Failed to process chat: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/assistant/suggestions
   * Get proactive suggestions
   */
  router.get('/suggestions', async (req: Request, res: Response) => {
    try {
      const currentNodeId = req.query.currentNodeId as string | undefined;
      const recentNodes = req.query.recentNodes
        ? (req.query.recentNodes as string).split(',').filter(Boolean)
        : [];

      const suggestions = await assistantService.getSuggestions(currentNodeId, recentNodes);

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      logger.error(`Failed to get suggestions: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/assistant/refine-idea
   * Refine a business idea
   */
  router.post('/refine-idea', async (req: Request, res: Response) => {
    try {
      const { nodeId } = req.body;

      if (!nodeId || typeof nodeId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'nodeId is required and must be a string',
        });
      }

      const refinements = await assistantService.refineIdea(nodeId);

      res.json({
        success: true,
        data: refinements,
      });
    } catch (error) {
      logger.error(`Failed to refine idea: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/assistant/sessions
   * List chat sessions
   */
  router.get('/sessions', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'default';
      const limit = parseInt(req.query.limit as string) || 50;

      const sessions = assistantService.getSessions(userId, limit);

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error(`Failed to get sessions: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/assistant/sessions/:id
   * Get session history
   */
  router.get('/sessions/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      const messages = assistantService.getSessionMessages(id, limit);

      res.json({
        success: true,
        data: {
          sessionId: id,
          messages,
        },
      });
    } catch (error) {
      logger.error(`Failed to get session: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}

