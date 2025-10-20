/**
 * Processes API Routes
 * Manages system processes and their lifecycle
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';

const router = Router();
const logger = new Logger('ProcessesAPI');

// Mock processes for now
const mockProcesses = [
  { id: 'proc-1', name: 'System Monitor', status: 'running', pid: 1234, startTime: new Date() },
  { id: 'proc-2', name: 'Log Manager', status: 'running', pid: 1235, startTime: new Date() }
];

router.get('/', (req: Request, res: Response) => {
  logger.info('Processes list requested');
  
  res.json({
    processes: mockProcesses,
    total: mockProcesses.length,
    running: mockProcesses.filter(p => p.status === 'running').length,
    timestamp: new Date().toISOString()
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const process = mockProcesses.find(p => p.id === id);
  
  if (!process) {
    logger.warn(`Process not found: ${id}`);
    return res.status(404).json({
      error: 'Process not found',
      id,
      message: 'The requested process does not exist'
    });
  }
  
  logger.info(`Process details requested: ${id}`);
  res.json(process);
});

router.post('/', (req: Request, res: Response) => {
  const { name, metadata = {} } = req.body;
  
  if (!name) {
    return res.status(400).json({
      error: 'Process name is required',
      message: 'Please provide a name for the process'
    });
  }
  
  const newProcess = {
    id: `proc-${Date.now()}`,
    name,
    status: 'starting' as const,
    pid: Math.floor(Math.random() * 10000) + 1000,
    startTime: new Date(),
    metadata
  };
  
  mockProcesses.push(newProcess);
  
  logger.info(`New process created: ${name} (${newProcess.id})`);
  
  res.status(201).json({
    message: 'Process created successfully',
    process: newProcess
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const processIndex = mockProcesses.findIndex(p => p.id === id);
  
  if (processIndex === -1) {
    logger.warn(`Process not found for deletion: ${id}`);
    return res.status(404).json({
      error: 'Process not found',
      id,
      message: 'The process to delete does not exist'
    });
  }
  
  const deletedProcess = mockProcesses.splice(processIndex, 1)[0];
  
  logger.info(`Process deleted: ${deletedProcess.name} (${id})`);
  
  res.json({
    message: 'Process deleted successfully',
    process: deletedProcess
  });
});

export { router as processesRouter };
