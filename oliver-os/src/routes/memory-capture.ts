/**
 * Memory Capture API Routes
 * Express routes for memory capture operations
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';
import type { CaptureMemoryService } from '../services/memory/capture/capture-memory-service';

const logger = new Logger('MemoryCaptureAPI');

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

      const memory = await memoryService.captureMemory({
        rawContent,
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
      return res.status(500).json({
        error: 'Failed to capture memory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/memory/recent
   * Get recent captures
   */
  router.get('/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
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
      const { q, limit } = req.query;

      if (!q) {
        return res.status(400).json({
          error: 'Missing query parameter',
          message: 'q parameter is required',
        });
      }

      const searchLimit = limit ? parseInt(limit as string) : 50;
      const results = await memoryService.searchMemories(q as string, searchLimit);

      return res.json({
        query: q,
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
   * GET /api/memory/:id
   * Get specific memory
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
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
   * GET /api/memory/timeline
   * Chronological view
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
   * GET /api/memory/status/:status
   * Get memories by status
   */
  router.get('/status/:status', async (req: Request, res: Response) => {
    try {
      const { status } = req.params;

      if (!['raw', 'processing', 'organized', 'linked'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be one of: raw, processing, organized, linked',
        });
      }

      const memories = await memoryService.getMemoriesByStatus(status as any);

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

  /**
   * GET /api/memory/stats
   * Get service statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
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

  return router;
}

