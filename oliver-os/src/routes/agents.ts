/**
 * Oliver-OS Agent Routes
 * API endpoints for agent spawning and management
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { ServiceManager } from '../services/service-manager';
import type { SpawnRequest } from '../services/agent-manager';
import { agentBridge } from '../integrations/agent-bridge';
import { Logger } from '../core/logger';
import { requestSchemas } from '../middleware/validation';
import { validateBody, validateParams, sendValidationError } from '../utils/route-validation';

const router = Router();
const logger = new Logger('AgentRoutes');

export function createAgentRoutes(serviceManager: ServiceManager): Router {
  
  // Spawn a single agent
  router.post('/spawn', async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const bodyValidation = validateBody(requestSchemas.spawnAgent, req);
      if (!bodyValidation.success) {
        sendValidationError(res, bodyValidation, req);
        return;
      }
      const validatedData = bodyValidation.data!;
      const spawnRequest: SpawnRequest = {
        agentType: validatedData.agentType,
        prompt: validatedData.prompt,
        metadata: validatedData.metadata || {},
      };

      const spawnedAgent = await serviceManager.spawnAgent(spawnRequest);
      
      res.json({
        success: true,
        data: spawnedAgent
      });
    } catch (error) {
      console.error('Error spawning agent:', error);
      res.status(500).json({
        error: 'Failed to spawn agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Spawn multiple agents
  router.post('/spawn-multiple', async (req: Request, res: Response): Promise<void> => {
    try {
      // Handle both { requests: [...] } and [...] formats
      const body = req.body;
      const normalizedBody = Array.isArray(body) ? { requests: body } : body;
      
      // Create a mock request object for validation that doesn't modify the original
      const validationReq = {
        ...req,
        body: normalizedBody,
        originalUrl: req.originalUrl || req.baseUrl + req.path || '/api/agents/spawn-multiple',
        path: req.path || '/spawn-multiple',
        baseUrl: req.baseUrl || '/api/agents',
      } as Request;
      
      // Validate request body
      const bodyValidation = validateBody(requestSchemas.spawnMultipleAgents, validationReq);
      if (!bodyValidation.success) {
        sendValidationError(res, bodyValidation, validationReq);
        return;
      }
      const { requests: validatedRequests } = bodyValidation.data!;
      // Ensure metadata is set for each request if not provided
      const spawnRequests = validatedRequests.map(req => ({
        agentType: req.agentType,
        prompt: req.prompt,
        metadata: req.metadata || {},
      }));

      const spawnedAgents = await serviceManager.spawnMultipleAgents(spawnRequests);
      const spawnedAgentsArray = spawnedAgents || [];
      
      res.json({
        success: true,
        data: {
          spawned_agents: spawnedAgentsArray,
          count: spawnedAgentsArray.length
        }
      });
    } catch (error) {
      console.error('Error spawning multiple agents:', error);
      res.status(500).json({
        error: 'Failed to spawn multiple agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all available agent types
  router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
      const agents = serviceManager.getAgents();
      const agentsArray = agents || [];
      
      res.json({
        success: true,
        data: {
          agents: agentsArray,
          count: agentsArray.length
        }
      });
    } catch (error) {
      console.error('Error getting agents:', error);
      res.status(500).json({
        error: 'Failed to get agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get agent status and health (must come before /:agentId to avoid route conflicts)
  router.get('/health/status', async (_req: Request, res: Response): Promise<void> => {
    try {
      const agents = serviceManager.getAgents() || [];
      const spawnedAgents = serviceManager.getSpawnedAgents() || [];
      
      const status = {
        total_agent_types: agents.length,
        total_spawned_agents: spawnedAgents.length,
        running_agents: spawnedAgents.filter(agent => agent.status === 'running').length,
        completed_agents: spawnedAgents.filter(agent => agent.status === 'completed').length,
        failed_agents: spawnedAgents.filter(agent => agent.status === 'failed').length,
        agent_types: agents.map(agent => ({
          id: agent.id,
          displayName: agent.displayName,
          status: agent.status
        })),
        recent_activity: spawnedAgents
          .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
          .slice(0, 10)
          .map(agent => ({
            id: agent.id,
            agentType: agent.agentType,
            status: agent.status,
            startTime: agent.startTime
          }))
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting agent health status:', error);
      res.status(500).json({
        error: 'Failed to get agent health status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get Python agent context (must come before /:agentId to avoid route conflicts)
  router.get('/python-context', async (_req: Request, res: Response): Promise<void> => {
    try {
      const context = await agentBridge.getPythonAgentContext();
      
      res.json({
        success: true,
        data: context
      });
    } catch (error) {
      logger.error('Error getting Python agent context:', error);
      res.status(500).json({
        error: 'Failed to get Python agent context',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get latest request from Python agent (must come before /:agentId to avoid route conflicts)
  router.get('/cursor-request', async (_req: Request, res: Response): Promise<void> => {
    try {
      const request = await agentBridge.getLatestRequest();
      
      if (!request) {
        res.status(404).json({
          success: false,
          error: 'No request available'
        });
        return;
      }
      
      res.json({
        success: true,
        data: request
      });
    } catch (error) {
      logger.error('Error getting cursor request:', error);
      res.status(500).json({
        error: 'Failed to get cursor request',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all spawned agent instances
  router.get('/spawned', async (_req: Request, res: Response): Promise<void> => {
    try {
      const spawnedAgents = serviceManager.getSpawnedAgents();
      const spawnedAgentsArray = spawnedAgents || [];
      
      res.json({
        success: true,
        data: {
          spawned_agents: spawnedAgentsArray,
          count: spawnedAgentsArray.length
        }
      });
    } catch (error) {
      console.error('Error getting spawned agents:', error);
      res.status(500).json({
        error: 'Failed to get spawned agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get specific agent type (must come after all specific routes)
  router.get('/:agentId', async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate route parameters
      const paramValidation = validateParams(requestSchemas.agentId, req);
      if (!paramValidation.success) {
        sendValidationError(res, paramValidation, req);
        return;
      }
      const { agentId } = paramValidation.data!;
      
      const agent = serviceManager.getAgent(agentId);
      
      if (!agent) {
        res.status(404).json({
          error: 'Agent not found',
          details: `No agent found with ID: ${agentId}`
        });
        return;
      }

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      console.error('Error getting agent:', error);
      res.status(500).json({
        error: 'Failed to get agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get specific spawned agent instance
  router.get('/spawned/:spawnedAgentId', async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate route parameters
      const paramValidation = validateParams(requestSchemas.spawnedAgentId, req);
      if (!paramValidation.success) {
        sendValidationError(res, paramValidation, req);
        return;
      }
      const { spawnedAgentId } = paramValidation.data!;
      
      const spawnedAgent = serviceManager.getSpawnedAgent(spawnedAgentId);
      
      if (!spawnedAgent) {
        res.status(404).json({
          error: 'Spawned agent not found',
          details: `No spawned agent found with ID: ${spawnedAgentId}`
        });
        return;
      }

      res.json({
        success: true,
        data: spawnedAgent
      });
    } catch (error) {
      console.error('Error getting spawned agent:', error);
      res.status(500).json({
        error: 'Failed to get spawned agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // NEW: Receive messages from Python agent
  router.post('/messages', async (req: Request, res: Response): Promise<void> => {
    try {
      const message = req.body;
      
      logger.info(`📨 Received message from Python agent: ${message.sender}`);
      
      await agentBridge.sendToAgents(
        message.sender,
        message.type,
        message.content,
        message.recipient
      );
      
      res.json({
        success: true,
        status: 'received'
      });
    } catch (error) {
      logger.error('Error receiving message from Python agent:', error);
      res.status(500).json({
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

