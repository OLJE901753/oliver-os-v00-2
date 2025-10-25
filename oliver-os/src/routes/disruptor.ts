/**
 * Bureaucracy Disruptor API Routes
 * Provides bureaucracy disruption status and reports
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';
// import { BureaucracyDisruptorService } from '../services/bureaucracy-disruptor';
// import { Config } from '../core/config';

const router = Router();
const logger = new Logger('DisruptorAPI');
// const config = new Config();

// Mock disruptor service for now
const mockDisruptor = {
  getReports: () => [
    {
      id: 'disrupt-1703123456789',
      timestamp: new Date(),
      disruptionLevel: 'high',
      efficiencyGained: 85,
      redTapeEliminated: [
        'Unnecessary approval layers',
        'Redundant documentation', 
        'Inefficient workflows',
        'Manual data entry',
        'Paper-based processes'
      ],
      status: 'completed'
    }
  ],
  getLatestReport: () => ({
    id: 'disrupt-1703123456789',
    timestamp: new Date(),
    disruptionLevel: 'high',
    efficiencyGained: 85,
    redTapeEliminated: [
      'Unnecessary approval layers',
      'Redundant documentation',
      'Inefficient workflows', 
      'Manual data entry',
      'Paper-based processes'
    ],
    status: 'completed'
  }),
  getDisruptionStats: () => ({
    totalDisruptions: 1,
    averageEfficiencyGained: 85,
    totalRedTapeEliminated: 5,
    activeDisruptions: 0
  })
};

router.get('/', (_req: Request, res: Response) => {
  logger.info('Bureaucracy disruptor status requested');
  
  const stats = mockDisruptor.getDisruptionStats();
  const latestReport = mockDisruptor.getLatestReport();
  
  res.json({
    status: 'operational',
    motto: 'For the honor, not the glory—by the people, for the people.',
    disruptionStats: stats,
    latestReport,
    timestamp: new Date().toISOString()
  });
});

router.get('/reports', (_req: Request, res: Response) => {
  logger.info('Bureaucracy disruption reports requested');
  
  const reports = mockDisruptor.getReports();
  
  res.json({
    reports,
    total: reports.length,
    timestamp: new Date().toISOString()
  });
});

router.get('/stats', (_req: Request, res: Response) => {
  logger.info('Bureaucracy disruption statistics requested');
  
  const stats = mockDisruptor.getDisruptionStats();
  
  res.json({
    statistics: stats,
    timestamp: new Date().toISOString()
  });
});

export { router as disruptorRouter };
