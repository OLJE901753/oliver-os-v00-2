/**
 * Disruptor Route Tests
 * Comprehensive tests for bureaucracy disruptor endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { disruptorRouter, initializeDisruptorRouter } from '../../routes/disruptor';
import type { BureaucracyDisruptorService } from '../../services/bureaucracy-disruptor';
import type { BureaucracyReport } from '../../services/bureaucracy-disruptor';

describe('Disruptor Route Tests', () => {
  let app: express.Application;
  let mockDisruptorService: BureaucracyDisruptorService;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create mock disruptor service
    mockDisruptorService = {
      getDisruptionStats: vi.fn(),
      getLatestReport: vi.fn(),
      getReports: vi.fn(),
    } as any;

    // Initialize router with mock service
    initializeDisruptorRouter(mockDisruptorService);
    
    // Register routes
    app.use('/api/disruptor', disruptorRouter);
  });

  describe('GET /api/disruptor', () => {
    it('should return disruptor status with stats and latest report', async () => {
      const mockStats = {
        totalDisruptions: 5,
        averageEfficiencyGained: 85,
        totalRedTapeEliminated: 25,
        activeDisruptions: 1
      };

      const mockLatestReport: BureaucracyReport = {
        id: 'disrupt-123',
        timestamp: new Date(),
        disruptionLevel: 'high',
        efficiencyGained: 85,
        redTapeEliminated: ['Unnecessary approval layers', 'Redundant documentation'],
        status: 'active'
      };

      (mockDisruptorService.getDisruptionStats as ReturnType<typeof vi.fn>).mockReturnValue(mockStats);
      (mockDisruptorService.getLatestReport as ReturnType<typeof vi.fn>).mockReturnValue(mockLatestReport);

      const response = await request(app)
        .get('/api/disruptor')
        .expect(200);

      expect(response.body.status).toBe('operational');
      expect(response.body.motto).toBe('For the honor, not the glory—by the people, for the people.');
      expect(response.body.disruptionStats).toEqual(mockStats);
      expect(response.body.latestReport).toBeDefined();
      expect(response.body.latestReport.id).toBe('disrupt-123');
      expect(response.body.latestReport.disruptionLevel).toBe('high');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return null for latestReport when no reports exist', async () => {
      const mockStats = {
        totalDisruptions: 0,
        averageEfficiencyGained: 0,
        totalRedTapeEliminated: 0,
        activeDisruptions: 0
      };

      (mockDisruptorService.getDisruptionStats as ReturnType<typeof vi.fn>).mockReturnValue(mockStats);
      (mockDisruptorService.getLatestReport as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const response = await request(app)
        .get('/api/disruptor')
        .expect(200);

      expect(response.body.status).toBe('operational');
      expect(response.body.latestReport).toBeNull();
      expect(response.body.disruptionStats).toEqual(mockStats);
    });

    it('should return 503 when DisruptorService not initialized', async () => {
      initializeDisruptorRouter(null as any);

      const response = await request(app)
        .get('/api/disruptor')
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('BureaucracyDisruptorService not initialized');
    });

    it('should handle service errors gracefully', async () => {
      (mockDisruptorService.getDisruptionStats as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Service lookup failed');
      });

      const response = await request(app)
        .get('/api/disruptor')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Failed to retrieve disruption status');
    });
  });

  describe('GET /api/disruptor/reports', () => {
    it('should return all disruption reports', async () => {
      const mockReports: BureaucracyReport[] = [
        {
          id: 'disrupt-1',
          timestamp: new Date(),
          disruptionLevel: 'high',
          efficiencyGained: 85,
          redTapeEliminated: ['Approval layers'],
          status: 'completed'
        },
        {
          id: 'disrupt-2',
          timestamp: new Date(),
          disruptionLevel: 'medium',
          efficiencyGained: 60,
          redTapeEliminated: ['Documentation'],
          status: 'active'
        }
      ];

      (mockDisruptorService.getReports as ReturnType<typeof vi.fn>).mockReturnValue(mockReports);

      const response = await request(app)
        .get('/api/disruptor/reports')
        .expect(200);

      expect(Array.isArray(response.body.reports)).toBe(true);
      expect(response.body.reports.length).toBe(2);
      expect(response.body.total).toBe(2);
      expect(response.body.reports[0].id).toBe('disrupt-1');
      expect(response.body.reports[0].disruptionLevel).toBe('high');
      expect(response.body.reports[0].efficiencyGained).toBe(85);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return empty array when no reports exist', async () => {
      (mockDisruptorService.getReports as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const response = await request(app)
        .get('/api/disruptor/reports')
        .expect(200);

      expect(response.body.reports).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return 503 when DisruptorService not initialized', async () => {
      initializeDisruptorRouter(null as any);

      const response = await request(app)
        .get('/api/disruptor/reports')
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('BureaucracyDisruptorService not initialized');
    });

    it('should handle service errors gracefully', async () => {
      (mockDisruptorService.getReports as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Failed to get reports');
      });

      const response = await request(app)
        .get('/api/disruptor/reports')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Failed to retrieve disruption reports');
    });
  });

  describe('GET /api/disruptor/stats', () => {
    it('should return disruption statistics', async () => {
      const mockStats = {
        totalDisruptions: 10,
        averageEfficiencyGained: 82,
        totalRedTapeEliminated: 50,
        activeDisruptions: 2
      };

      (mockDisruptorService.getDisruptionStats as ReturnType<typeof vi.fn>).mockReturnValue(mockStats);

      const response = await request(app)
        .get('/api/disruptor/stats')
        .expect(200);

      expect(response.body.statistics).toEqual(mockStats);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 503 when DisruptorService not initialized', async () => {
      initializeDisruptorRouter(null as any);

      const response = await request(app)
        .get('/api/disruptor/stats')
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('BureaucracyDisruptorService not initialized');
    });

    it('should handle service errors gracefully', async () => {
      (mockDisruptorService.getDisruptionStats as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Failed to get stats');
      });

      const response = await request(app)
        .get('/api/disruptor/stats')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Failed to retrieve disruption statistics');
    });
  });
});

