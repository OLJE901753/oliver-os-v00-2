/**
 * Memory Capture API Routes
 * Express routes for memory capture operations
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';
import { SecurityManager } from '../core/security';
import { Config } from '../core/config';
import type { CaptureMemoryService } from '../services/memory/capture/capture-memory-service';
import type { MemoryStatus } from '../services/memory/capture/storage';

const logger = new Logger('MemoryCaptureRoutes');
const config = new Config();
const securityManager = new SecurityManager(config);

// Input sanitization helper
function sanitizeInput(input: string): string {
  return securityManager.sanitizeInput(input);
}

export function createMemoryCaptureRoutes(memoryService: CaptureMemoryService): IRouter {
  const router: IRouter = Router();

  /**
   * POST /api/memory/capture
   * Store new thought/memory
   */
  router.post('/capture', async (req: Request, res: Response) => {
    try {
      const { rawContent, type, metadata, audioUrl, transcript, durationSeconds } = req.body;

      if (!rawContent || !type) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'rawContent and type are required',
        });
      }

      // Sanitize rawContent to prevent XSS
      const sanitizedContent = sanitizeInput(rawContent);

      const memory = await memoryService.captureMemory({
        rawContent: sanitizedContent,
        type,
        metadata,
        audioUrl,
        transcript,
        durationSeconds,
      });

      logger.info(`Memory captured: ${memory.id}`);
      return res.status(201).json({
        message: 'Memory captured successfully',
        memory,
      });
    } catch (error) {
      logger.error(`Failed to capture memory: ${error}`);
      // Sanitize error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const sanitizedMessage = errorMessage.replace(/postgresql:\/\/[^@]+@/gi, 'postgresql://***:***@')
        .replace(/password['"]?\s*[:=]\s*['"]?[^'"]+/gi, 'password=***');
      
      return res.status(500).json({
        error: 'Failed to capture memory',
        message: sanitizedMessage,
      });
    }
  });

  /**
   * GET /api/memory/recent
   * Get recent captures
   */
  router.get('/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query['limit'] as string) || 10;
      const memories = await memoryService.getRecentMemories(limit);

      return res.json({
        memories,
        count: memories.length,
        limit,
      });
    } catch (error) {
      logger.error(`Failed to get recent memories: ${error}`);
      return res.status(500).json({
        error: 'Failed to get recent memories',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/memory/search
   * Full-text search
   */
  router.get('/search', async (req: Request, res: Response) => {
    try {
      // Support both 'q' and 'query' parameters for compatibility
      const queryParam = (req.query.q || req.query.query) as string | undefined;
      const { limit } = req.query;

      if (!queryParam) {
        return res.status(400).json({
          error: 'Missing query parameter',
          message: 'q or query parameter is required',
        });
      }

      const searchLimit = limit ? parseInt(limit as string) : 50;
      const results = await memoryService.searchMemories(queryParam, searchLimit);

      return res.json({
        query: queryParam,
        results,
        count: results.length,
      });
    } catch (error) {
      logger.error(`Failed to search memories: ${error}`);
      return res.status(500).json({
        error: 'Failed to search memories',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/memory/timeline
   * Chronological view
   * IMPORTANT: Must be defined before /:id route to avoid route conflicts
   */
  router.get('/timeline', async (req: Request, res: Response) => {
    try {
      const { start, end } = req.query;

      const startDate = start ? new Date(start as string) : undefined;
      const endDate = end ? new Date(end as string) : undefined;

      const memories = await memoryService.getTimeline(startDate, endDate);

      return res.json({
        memories,
        count: memories.length,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      });
    } catch (error) {
      logger.error(`Failed to get timeline: ${error}`);
      return res.status(500).json({
        error: 'Failed to get timeline',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/memory/stats
   * Get service statistics
   * IMPORTANT: Must be defined before /:id route to avoid route conflicts
   */
  router.get('/stats', async (_req: Request, res: Response) => {
    try {
      const stats = await memoryService.getStats();
      return res.json(stats);
    } catch (error) {
      logger.error(`Failed to get stats: ${error}`);
      return res.status(500).json({
        error: 'Failed to get stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/memory/:id
   * Get specific memory
   * IMPORTANT: This must be defined AFTER all specific routes like /timeline, /stats, /search
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Memory ID required' });
      }
      const memory = await memoryService.getMemory(id);

      if (!memory) {
        return res.status(404).json({
          error: 'Memory not found',
          id,
        });
      }

      return res.json(memory);
    } catch (error) {
      logger.error(`Failed to get memory: ${error}`);
      return res.status(500).json({
        error: 'Failed to get memory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/memory/status/:status
   * Get memories by status
   */
  router.get('/status/:status', async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      if (!status) {
        return res.status(400).json({ error: 'Status required' });
      }

      if (!['raw', 'processing', 'organized', 'linked'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be one of: raw, processing, organized, linked',
        });
      }

      const memories = await memoryService.getMemoriesByStatus(status as MemoryStatus);

      return res.json({
        status,
        memories,
        count: memories.length,
      });
    } catch (error) {
      logger.error(`Failed to get memories by status: ${error}`);
      return res.status(500).json({
        error: 'Failed to get memories by status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PATCH /api/memory/:id/status
   * Update memory status
   */
  router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Memory ID required' });
      }
      const { status } = req.body;

      if (!status || !['raw', 'processing', 'organized', 'linked'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'status must be one of: raw, processing, organized, linked',
        });
      }

      const updated = await memoryService.updateMemoryStatus(id, status);

      if (!updated) {
        return res.status(404).json({
          error: 'Memory not found',
          id,
        });
      }

      return res.json({
        message: 'Memory status updated',
        id,
        status,
      });
    } catch (error) {
      logger.error(`Failed to update memory status: ${error}`);
      return res.status(500).json({
        error: 'Failed to update memory status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}

