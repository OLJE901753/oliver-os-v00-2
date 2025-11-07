/**
 * Bureaucracy Disruptor API Routes
 * Provides bureaucracy disruption status and reports
 */

import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';
import type { BureaucracyDisruptorService } from '../services/bureaucracy-disruptor';

const router: IRouter = Router();
const logger = new Logger('DisruptorAPI');

// Bureaucracy disruptor service will be injected via dependency injection or passed during route setup
let disruptorService: BureaucracyDisruptorService | null = null;

/**
 * Initialize disruptor router with BureaucracyDisruptorService instance
 */
export function initializeDisruptorRouter(service: BureaucracyDisruptorService): void {
  disruptorService = service;
  logger.info('Disruptor router initialized with BureaucracyDisruptorService');
}

router.get('/', (_req: Request, res: Response) => {
  logger.info('Bureaucracy disruptor status requested');
  
  if (!disruptorService) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'BureaucracyDisruptorService not initialized'
    });
    return;
  }
  
  try {
    const stats = disruptorService.getDisruptionStats();
    const latestReport = disruptorService.getLatestReport();
    
    res.json({
      status: 'operational',
      motto: 'For the honor, not the glory—by the people, for the people.',
      disruptionStats: stats,
      latestReport: latestReport ? {
        id: latestReport.id,
        timestamp: latestReport.timestamp,
        disruptionLevel: latestReport.disruptionLevel,
        efficiencyGained: latestReport.efficiencyGained,
        redTapeEliminated: latestReport.redTapeEliminated,
        status: latestReport.status
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get disruptor status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve disruption status'
    });
  }
});

router.get('/reports', (_req: Request, res: Response) => {
  logger.info('Bureaucracy disruption reports requested');
  
  if (!disruptorService) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'BureaucracyDisruptorService not initialized'
    });
    return;
  }
  
  try {
    const reports = disruptorService.getReports();
    
    res.json({
      reports: reports.map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        disruptionLevel: r.disruptionLevel,
        efficiencyGained: r.efficiencyGained,
        redTapeEliminated: r.redTapeEliminated,
        status: r.status
      })),
      total: reports.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get disruption reports:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve disruption reports'
    });
  }
});

router.get('/stats', (_req: Request, res: Response) => {
  logger.info('Bureaucracy disruption statistics requested');
  
  if (!disruptorService) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'BureaucracyDisruptorService not initialized'
    });
    return;
  }
  
  try {
    const stats = disruptorService.getDisruptionStats();
    
    res.json({
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get disruption statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve disruption statistics'
    });
  }
});

export { router as disruptorRouter };
