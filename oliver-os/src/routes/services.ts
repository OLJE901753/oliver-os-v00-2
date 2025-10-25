/**
 * Services API Routes
 * Manages microservices and their lifecycle
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';

const router = Router();
const logger = new Logger('ServicesAPI');

// Mock service manager for now
const mockServices = [
  { id: 'system-health', name: 'System Health Monitor', status: 'running', startTime: new Date() },
  { id: 'process-manager', name: 'Process Manager', status: 'running', startTime: new Date() },
  { id: 'api-gateway', name: 'API Gateway', status: 'running', startTime: new Date() },
  { id: 'security-service', name: 'Security Service', status: 'running', startTime: new Date() }
];

router.get('/', (_req: Request, res: Response) => {
  logger.info('Services list requested');
  
  res.json({
    services: mockServices,
    total: mockServices.length,
    running: mockServices.filter(s => s.status === 'running').length,
    timestamp: new Date().toISOString()
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const service = mockServices.find(s => s.id === id);
  
  if (!service) {
    logger.warn(`Service not found: ${id}`);
    return res.status(404).json({
      error: 'Service not found',
      id,
      message: 'The requested service does not exist'
    });
  }
  
  logger.info(`Service details requested: ${id}`);
  return res.json(service);
});

router.post('/', (req: Request, res: Response) => {
  const { name, metadata = {} } = req.body;
  
  if (!name) {
    return res.status(400).json({
      error: 'Service name is required',
      message: 'Please provide a name for the service'
    });
  }
  
  const newService = {
    id: `service-${Date.now()}`,
    name,
    status: 'starting' as const,
    startTime: new Date(),
    metadata
  };
  
  mockServices.push(newService);
  
  logger.info(`New service created: ${name} (${newService.id})`);
  
  return res.status(201).json({
    message: 'Service created successfully',
    service: newService
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const serviceIndex = mockServices.findIndex(s => s.id === id);
  
  if (serviceIndex === -1) {
    logger.warn(`Service not found for deletion: ${id}`);
    return res.status(404).json({
      error: 'Service not found',
      id,
      message: 'The service to delete does not exist'
    });
  }
  
  const deletedService = mockServices.splice(serviceIndex, 1)[0];
  
  if (!deletedService) {
    logger.warn(`Service deletion failed: ${id}`);
    return res.status(500).json({
      error: 'Service deletion failed',
      message: 'Failed to delete the service'
    });
  }
  
  logger.info(`Service deleted: ${deletedService.name} (${id})`);
  
  return res.json({
    message: 'Service deleted successfully',
    service: deletedService
  });
});

export { router as servicesRouter };
