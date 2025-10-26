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

const router = Router();
const logger = new Logger('AgentRoutes');

export function createAgentRoutes(serviceManager: ServiceManager): Router {
  
  // Spawn a single agent
  router.post('/spawn', async (req: Request, res: Response): Promise<void> => {
    try {
      const spawnRequest: SpawnRequest = req.body;
      
      // Validate request
      if (!spawnRequest.agentType || !spawnRequest.prompt) {
        res.status(400).json({
          error: 'Invalid request',
          details: 'agentType and prompt are required'
        });
        return;
      }

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
      const spawnRequests: SpawnRequest[] = req.body.requests || req.body;
      
      // Validate requests
      if (!Array.isArray(spawnRequests) || spawnRequests.length === 0) {
        res.status(400).json({
          error: 'Invalid request',
          details: 'requests array is required and cannot be empty'
        });
        return;
      }

      for (const request of spawnRequests) {
        if (!request.agentType || !request.prompt) {
          res.status(400).json({
            error: 'Invalid request',
            details: 'Each request must have agentType and prompt'
          });
          return;
        }
      }

      const spawnedAgents = await serviceManager.spawnMultipleAgents(spawnRequests);
      
      res.json({
        success: true,
        data: {
          spawned_agents: spawnedAgents,
          count: spawnedAgents.length
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
      
      res.json({
        success: true,
        data: {
          agents,
          count: agents.length
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

  // Get all spawned agent instances
  router.get('/spawned', async (_req: Request, res: Response): Promise<void> => {
    try {
      const spawnedAgents = serviceManager.getSpawnedAgents();
      
      res.json({
        success: true,
        data: {
          spawned_agents: spawnedAgents,
          count: spawnedAgents.length
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

  // Get specific agent type
  router.get('/:agentId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { agentId } = req.params;
      if (!agentId) {
        res.status(400).json({
          error: 'Agent ID required'
        });
        return;
      }
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
      const { spawnedAgentId } = req.params;
      if (!spawnedAgentId) {
        res.status(400).json({
          error: 'Spawned agent ID required'
        });
        return;
      }
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

  // Get agent status and health
  router.get('/health/status', async (_req: Request, res: Response): Promise<void> => {
    try {
      const agents = serviceManager.getAgents();
      const spawnedAgents = serviceManager.getSpawnedAgents();
      
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

  // NEW: Get Python agent context
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

  // NEW: Get latest request from Python agent
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

  return router;
}
