/**
 * Processes API Routes
 * Manages system processes and their lifecycle
 */

import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';
import type { ProcessManager } from '../core/process-manager';
import { requestSchemas } from '../middleware/validation';
import { validateBody, validateParams, sendValidationError } from '../utils/route-validation';

const router: IRouter = Router();
const logger = new Logger('ProcessesAPI');

// Process manager will be injected via dependency injection or passed during route setup
let processManager: ProcessManager | null = null;

/**
 * Initialize processes router with ProcessManager instance
 */
export function initializeProcessesRouter(manager: ProcessManager): void {
  processManager = manager;
  logger.info('Processes router initialized with ProcessManager');
}

router.get('/', (_req: Request, res: Response) => {
  logger.info('Processes list requested');
  
  if (!processManager) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'ProcessManager not initialized'
    });
    return;
  }
  
  try {
    const processes = processManager.getProcesses();
    const runningCount = processes.filter(p => p.status === 'running').length;
    
    res.json({
      processes: processes.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        pid: p.pid,
        startTime: p.startTime,
        endTime: p.endTime,
        metadata: p.metadata
      })),
      total: processes.length,
      running: runningCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get processes:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve processes'
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  // Validate route parameters
  const paramValidation = validateParams(requestSchemas.processId, req);
  if (!paramValidation.success) {
    sendValidationError(res, paramValidation, req);
    return;
  }
  const { id } = paramValidation.data!;
  
  if (!processManager) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'ProcessManager not initialized'
    });
    return;
  }
  
  try {
    const processes = processManager.getProcesses();
    const process = processes.find(p => p.id === id);
    
    if (!process) {
      logger.warn(`Process not found: ${id}`);
      res.status(404).json({
        error: 'Process not found',
        id,
        message: 'The requested process does not exist'
      });
      return;
    }
    
    logger.info(`Process details requested: ${id}`);
    res.json({
      id: process.id,
      name: process.name,
      status: process.status,
      pid: process.pid,
      startTime: process.startTime,
      endTime: process.endTime,
      metadata: process.metadata
    });
  } catch (error) {
    logger.error(`Failed to get process ${id}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve process'
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  // Validate request body
  const bodyValidation = validateBody(requestSchemas.createProcess, req);
  if (!bodyValidation.success) {
    sendValidationError(res, bodyValidation, req);
    return;
  }
  const { name, description, metadata = {} } = bodyValidation.data!;
  
  if (!processManager) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'ProcessManager not initialized'
    });
    return;
  }
  
  try {
    const processId = await processManager.startProcess(name, description, metadata);
    const processes = processManager.getProcesses();
    const newProcess = processes.find(p => p.id === processId);
    
    if (!newProcess) {
      throw new Error('Process creation failed');
    }
    
    logger.info(`New process created: ${name} (${processId})`);
    
    res.status(201).json({
      message: 'Process created successfully',
      process: {
        id: newProcess.id,
        name: newProcess.name,
        status: newProcess.status,
        pid: newProcess.pid,
        startTime: newProcess.startTime,
        metadata: newProcess.metadata
      }
    });
  } catch (error) {
    logger.error(`Failed to create process:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to create process'
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  // Validate route parameters
  const paramValidation = validateParams(requestSchemas.processId, req);
  if (!paramValidation.success) {
    sendValidationError(res, paramValidation, req);
    return;
  }
  const { id } = paramValidation.data!;
  
  if (!processManager) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'ProcessManager not initialized'
    });
    return;
  }
  
  try {
    const processes = processManager.getProcesses();
    const process = processes.find(p => p.id === id);
    
    if (!process) {
      logger.warn(`Process not found for deletion: ${id}`);
      res.status(404).json({
        error: 'Process not found',
        id,
        message: 'The process to delete does not exist'
      });
      return;
    }
    
    await processManager.stopProcess(id);
    
    logger.info(`Process deleted: ${process.name} (${id})`);
    
    res.json({
      message: 'Process deleted successfully',
      process: {
        id: process.id,
        name: process.name,
        status: process.status,
        pid: process.pid,
        startTime: process.startTime,
        endTime: process.endTime,
        metadata: process.metadata
      }
    });
  } catch (error) {
    logger.error(`Failed to delete process ${id}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to delete process'
    });
  }
});

export { router as processesRouter };
