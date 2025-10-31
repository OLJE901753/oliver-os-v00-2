/**
 * Knowledge Graph API Routes
 * Express routes for knowledge graph operations
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';
import type { KnowledgeGraphService } from '../services/knowledge/knowledge-graph-service';

const logger = new Logger('KnowledgeGraphAPI');

export function createKnowledgeGraphRoutes(knowledgeGraphService: KnowledgeGraphService): IRouter {
  const router: IRouter = Router();

  /**
   * POST /api/knowledge/nodes
   * Create a new node
   */
  router.post('/nodes', async (req: Request, res: Response) => {
    try {
      const { type, title, content, metadata, tags } = req.body;

      if (!type || !title || !content) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'type, title, and content are required',
        });
      }

      const node = await knowledgeGraphService.createNode({
        type,
        title,
        content,
        metadata,
        tags,
      });

      logger.info(`Created node: ${node.id}`);
      return res.status(201).json({
        message: 'Node created successfully',
        node,
      });
    } catch (error) {
      logger.error(`Failed to create node: ${error}`);
      return res.status(500).json({
        error: 'Failed to create node',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/knowledge/nodes/:id
   * Get a node by ID with relationships
   */
  router.get('/nodes/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const node = await knowledgeGraphService.getNode(id);

      if (!node) {
        return res.status(404).json({
          error: 'Node not found',
          id,
        });
      }

      return res.json(node);
    } catch (error) {
      logger.error(`Failed to get node: ${error}`);
      return res.status(500).json({
        error: 'Failed to get node',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/knowledge/nodes/:id/related
   * Get related nodes
   */
  router.get('/nodes/:id/related', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const depth = parseInt(req.query.depth as string) || 1;

      const relatedNodes = await knowledgeGraphService.getRelatedNodes(id, depth);

      return res.json({
        nodeId: id,
        depth,
        relatedNodes,
        count: relatedNodes.length,
      });
    } catch (error) {
      logger.error(`Failed to get related nodes: ${error}`);
      return res.status(500).json({
        error: 'Failed to get related nodes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PUT /api/knowledge/nodes/:id
   * Update a node
   */
  router.put('/nodes/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, content, metadata, tags } = req.body;

      const updated = await knowledgeGraphService.updateNode(id, {
        title,
        content,
        metadata,
        tags,
      });

      logger.info(`Updated node: ${id}`);
      return res.json({
        message: 'Node updated successfully',
        node: updated,
      });
    } catch (error) {
      logger.error(`Failed to update node: ${error}`);
      return res.status(500).json({
        error: 'Failed to update node',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * DELETE /api/knowledge/nodes/:id
   * Delete a node
   */
  router.delete('/nodes/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await knowledgeGraphService.deleteNode(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Node not found',
          id,
        });
      }

      logger.info(`Deleted node: ${id}`);
      return res.json({
        message: 'Node deleted successfully',
        id,
      });
    } catch (error) {
      logger.error(`Failed to delete node: ${error}`);
      return res.status(500).json({
        error: 'Failed to delete node',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/knowledge/nodes
   * Get all nodes (with optional type filter)
   */
  router.get('/nodes', async (req: Request, res: Response) => {
    try {
      const { type } = req.query;

      let nodes;
      if (type) {
        nodes = await knowledgeGraphService.getNodesByType(type as string);
      } else {
        nodes = await knowledgeGraphService.getAllNodes();
      }

      return res.json({
        nodes,
        count: nodes.length,
        type: type || 'all',
      });
    } catch (error) {
      logger.error(`Failed to get nodes: ${error}`);
      return res.status(500).json({
        error: 'Failed to get nodes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/knowledge/relationships
   * Create a relationship between nodes
   */
  router.post('/relationships', async (req: Request, res: Response) => {
    try {
      const { fromNodeId, toNodeId, type, strength, metadata } = req.body;

      if (!fromNodeId || !toNodeId || !type) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'fromNodeId, toNodeId, and type are required',
        });
      }

      const relationship = await knowledgeGraphService.createRelationship({
        fromNodeId,
        toNodeId,
        type,
        strength,
        metadata,
      });

      logger.info(`Created relationship: ${relationship.id}`);
      return res.status(201).json({
        message: 'Relationship created successfully',
        relationship,
      });
    } catch (error) {
      logger.error(`Failed to create relationship: ${error}`);
      return res.status(500).json({
        error: 'Failed to create relationship',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/knowledge/relationships/:nodeId
   * Get relationships for a node
   */
  router.get('/relationships/:nodeId', async (req: Request, res: Response) => {
    try {
      const { nodeId } = req.params;
      const relationships = await knowledgeGraphService.getRelationships(nodeId);

      return res.json({
        nodeId,
        relationships,
        count: relationships.length,
      });
    } catch (error) {
      logger.error(`Failed to get relationships: ${error}`);
      return res.status(500).json({
        error: 'Failed to get relationships',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/knowledge/search
   * Search nodes (full-text + semantic)
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
      const results = await knowledgeGraphService.searchNodes(q as string, searchLimit);

      return res.json({
        query: q,
        results,
        count: results.length,
      });
    } catch (error) {
      logger.error(`Failed to search nodes: ${error}`);
      return res.status(500).json({
        error: 'Failed to search nodes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/knowledge/stats
   * Get graph statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await knowledgeGraphService.getGraphStats();
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

