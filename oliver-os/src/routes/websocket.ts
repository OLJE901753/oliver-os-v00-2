/**
 * WebSocket Routes
 * API endpoints for WebSocket management and status
 */

import { Router, type Request, type Response } from 'express';
import { Logger } from '../core/logger';

const logger = new Logger('WebSocketRoutes');
const router: Router = Router();

// Store WebSocket manager reference (will be set by the server)
let wsManager: any = null;

export function setWebSocketManager(manager: any): void {
  wsManager = manager;
}

/**
 * Get WebSocket connection status
 */
router.get('/status', (_req: Request, res: Response) => {
  try {
    if (!wsManager) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'WebSocket manager not initialized'
      });
    }

    const healthStatus = wsManager.getHealthStatus();
    return res.json(healthStatus);
  } catch (error) {
    logger.error('Error getting WebSocket status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get WebSocket status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get connected clients
 */
router.get('/clients', (_req: Request, res: Response) => {
  try {
    if (!wsManager) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'WebSocket manager not initialized'
      });
    }

    const clients = wsManager.getConnectedClients();
    return res.json({
      clients: clients.map((client: any) => ({
        id: client.id,
        user_id: client.user_id,
        last_seen: client.last_seen,
        subscriptions: client.subscriptions
      })),
      count: clients.length
    });
  } catch (error) {
    logger.error('Error getting connected clients:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get connected clients',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get thought sessions
 */
router.get('/sessions', (_req: Request, res: Response) => {
  try {
    if (!wsManager) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'WebSocket manager not initialized'
      });
    }

    const sessions = wsManager.getThoughtSessions();
    return res.json({
      sessions: sessions.map((session: any) => ({
        client_id: session.client_id,
        thought_count: session.thoughts.length,
        created_at: session.created_at,
        last_activity: session.last_activity
      })),
      count: sessions.length
    });
  } catch (error) {
    logger.error('Error getting thought sessions:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get thought sessions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Send message to specific client
 */
router.post('/send/:clientId', (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const { event, data } = req.body;

    if (!event || !data) {
      return res.status(400).json({
        status: 'error',
        message: 'Event and data are required'
      });
    }

    if (!wsManager) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'WebSocket manager not initialized'
      });
    }

    const success = wsManager.sendToClient(clientId, event, data);
    
    if (success) {
      return res.json({
        status: 'success',
        message: 'Message sent successfully',
        client_id: clientId,
        event
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Client not found',
        client_id: clientId
      });
    }
  } catch (error) {
    logger.error('Error sending message to client:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Broadcast message to channel
 */
router.post('/broadcast/channel', (req: Request, res: Response) => {
  try {
    const { channel, event, data } = req.body;

    if (!channel || !event || !data) {
      return res.status(400).json({
        status: 'error',
        message: 'Channel, event, and data are required'
      });
    }

    if (!wsManager) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'WebSocket manager not initialized'
      });
    }

    wsManager.sendToChannel(channel, event, data);
    
    return res.json({
      status: 'success',
      message: 'Message broadcasted successfully',
      channel,
      event
    });
  } catch (error) {
    logger.error('Error broadcasting to channel:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to broadcast message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as websocketRouter };
