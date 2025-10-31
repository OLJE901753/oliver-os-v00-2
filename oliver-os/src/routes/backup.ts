/**
 * Backup API Routes
 * Phase 5.4: REST API endpoints for backup management
 */

import { Router, type IRouter, type Request, type Response } from 'express';
import { Logger } from '../core/logger';
import { BackupService } from '../services/backup/backup-service';

const router: IRouter = Router();
const logger = new Logger('BackupAPI');
const backupService = new BackupService();

/**
 * Create a new backup
 * POST /api/backup/create
 */
router.post('/create', async (_req: Request, res: Response) => {
  try {
    logger.info('Backup creation requested via API');
    const result = await backupService.createBackup();
    
    if (result.success) {
      res.status(201).json({
        success: true,
        backup: {
          path: result.backupPath,
          timestamp: result.timestamp,
          size: result.size,
          sizeMB: (result.size / 1024 / 1024).toFixed(2),
          components: result.components
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error('Backup creation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List all backups
 * GET /api/backup/list
 */
router.get('/list', async (_req: Request, res: Response) => {
  try {
    const backups = await backupService.listBackups();
    res.json({
      success: true,
      backups: backups.map(b => ({
        path: b.path,
        timestamp: b.timestamp,
        size: b.size,
        sizeMB: (b.size / 1024 / 1024).toFixed(2)
      }))
    });
  } catch (error: any) {
    logger.error('Failed to list backups', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Restore from a backup
 * POST /api/backup/restore
 * Body: { backupPath: string }
 */
router.post('/restore', async (req: Request, res: Response) => {
  try {
    const { backupPath } = req.body;
    
    if (!backupPath) {
      return res.status(400).json({
        success: false,
        error: 'backupPath is required'
      });
    }

    logger.info('Backup restore requested via API', { backupPath });
    const result = await backupService.restoreBackup(backupPath);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup restored successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error('Backup restore failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as backupRouter };

