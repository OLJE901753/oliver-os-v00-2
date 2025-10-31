/**
 * Thought Organizer API Routes
 * Express routes for organizing raw memories into structured knowledge
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';
import type { ThoughtOrganizerService, OrganizeOptions } from '../services/organizer/organizer-service';
import type { BusinessIdeaStructurer } from '../services/organizer/business-structurer';
import type { BusinessIdeaStructurerOptions } from '../services/organizer/business-idea.types';

const logger = new Logger('ThoughtOrganizerAPI');

export function createOrganizerRoutes(
  organizerService: ThoughtOrganizerService,
  businessStructurer?: BusinessIdeaStructurer
): IRouter {
  const router: IRouter = Router();

  /**
   * POST /api/organizer/organize/:memoryId
   * Organize a specific memory
   */
  router.post('/organize/:memoryId', async (req: Request, res: Response) => {
    try {
      const { memoryId } = req.params;
      const options: OrganizeOptions = {
        autoLink: req.body.autoLink !== false,
        extractBusinessIdea: req.body.extractBusinessIdea === true,
        includeEntities: req.body.includeEntities === true,
      };

      const result = await organizerService.organizeMemory(memoryId, options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error(`Failed to organize memory: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/organizer/organize-batch
   * Organize multiple memories
   */
  router.post('/organize-batch', async (req: Request, res: Response) => {
    try {
      const { memoryIds } = req.body;
      if (!Array.isArray(memoryIds) || memoryIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'memoryIds must be a non-empty array',
        });
      }

      const options: OrganizeOptions = {
        autoLink: req.body.autoLink !== false,
        extractBusinessIdea: req.body.extractBusinessIdea === true,
        includeEntities: req.body.includeEntities === true,
      };

      const results = await organizerService.organizeMemories(memoryIds, options);

      res.json({
        success: true,
        data: results,
        stats: {
          total: memoryIds.length,
          successful: results.length,
          failed: memoryIds.length - results.length,
        },
      });
    } catch (error) {
      logger.error(`Failed to organize memories: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/organizer/organize-all-raw
   * Organize all raw memories
   */
  router.post('/organize-all-raw', async (req: Request, res: Response) => {
    try {
      const options: OrganizeOptions = {
        autoLink: req.body.autoLink !== false,
        extractBusinessIdea: req.body.extractBusinessIdea === true,
        includeEntities: req.body.includeEntities === true,
      };

      const results = await organizerService.organizeAllRawMemories(options);

      res.json({
        success: true,
        data: results,
        stats: {
          organized: results.length,
        },
      });
    } catch (error) {
      logger.error(`Failed to organize all raw memories: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/organizer/extract-business-idea
   * Extract business idea structure from raw text
   */
  if (businessStructurer) {
    router.post('/extract-business-idea', async (req: Request, res: Response) => {
      try {
        const { text } = req.body;
        if (!text || typeof text !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'text is required and must be a string',
          });
        }

        const options: BusinessIdeaStructurerOptions = {
          includeCanvas: req.body.includeCanvas !== false,
          extractFinancials: req.body.extractFinancials === true,
          detectCompetitors: req.body.detectCompetitors === true,
          extractTimeline: req.body.extractTimeline === true,
        };

        const extraction = await businessStructurer.extractBusinessIdea(text, options);

        res.json({
          success: true,
          data: extraction,
        });
      } catch (error) {
        logger.error(`Failed to extract business idea: ${error}`);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  return router;
}

