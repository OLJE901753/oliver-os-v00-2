/**
 * Services API Routes
 * Manages microservices and their lifecycle
 */

import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';
import type { ServiceManager } from '../services/service-manager';
import { requestSchemas } from '../middleware/validation';
import { validateBody, validateParams, sendValidationError } from '../utils/route-validation';

const router: IRouter = Router();
const logger = new Logger('ServicesAPI');

// Service manager will be injected via dependency injection or passed during route setup
let serviceManager: ServiceManager | null = null;

/**
 * Initialize services router with ServiceManager instance
 */
export function initializeServicesRouter(manager: ServiceManager): void {
  serviceManager = manager;
  logger.info('Services router initialized with ServiceManager');
}

router.get('/', (_req: Request, res: Response) => {
  logger.info('Services list requested');
  
  if (!serviceManager) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'ServiceManager not initialized'
    });
    return;
  }
  
  try {
    const services = serviceManager.getServices();
    const runningCount = services.filter(s => s.status === 'running').length;
    
    res.json({
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        startTime: s.startTime,
        metadata: s.metadata
      })),
      total: services.length,
      running: runningCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get services:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve services'
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  // Validate route parameters
  const paramValidation = validateParams(requestSchemas.serviceId, req);
  if (!paramValidation.success) {
    sendValidationError(res, paramValidation, req);
    return;
  }
  const { id } = paramValidation.data!;
  
  if (!serviceManager) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'ServiceManager not initialized'
    });
    return;
  }
  
  try {
    const services = serviceManager.getServices();
    const service = services.find(s => s.id === id);
    
    if (!service) {
      logger.warn(`Service not found: ${id}`);
      res.status(404).json({
        error: 'Service not found',
        id,
        message: 'The requested service does not exist'
      });
      return;
    }
    
    logger.info(`Service details requested: ${id}`);
    res.json({
      id: service.id,
      name: service.name,
      status: service.status,
      startTime: service.startTime,
      metadata: service.metadata
    });
  } catch (error) {
    logger.error(`Failed to get service ${id}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve service'
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  // Validate request body
  const bodyValidation = validateBody(requestSchemas.createService, req);
  if (!bodyValidation.success) {
    sendValidationError(res, bodyValidation, req);
    return;
  }
  const { name, metadata = {} } = bodyValidation.data!;
  
  if (!serviceManager) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'ServiceManager not initialized'
    });
    return;
  }
  
  try {
    const serviceId = `service-${Date.now()}`;
    await serviceManager.registerService(serviceId, name, metadata);
    
    const services = serviceManager.getServices();
    const newService = services.find(s => s.id === serviceId);
    
    if (!newService) {
      throw new Error('Service registration failed');
    }
    
    logger.info(`New service created: ${name} (${serviceId})`);
    
    res.status(201).json({
      message: 'Service created successfully',
      service: {
        id: newService.id,
        name: newService.name,
        status: newService.status,
        startTime: newService.startTime,
        metadata: newService.metadata
      }
    });
  } catch (error) {
    logger.error(`Failed to create service:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to create service'
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  // Validate route parameters
  const paramValidation = validateParams(requestSchemas.serviceId, req);
  if (!paramValidation.success) {
    sendValidationError(res, paramValidation, req);
    return;
  }
  const { id } = paramValidation.data!;
  
  if (!serviceManager) {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'ServiceManager not initialized'
    });
    return;
  }
  
  try {
    const services = serviceManager.getServices();
    const service = services.find(s => s.id === id);
    
    if (!service) {
      logger.warn(`Service not found for deletion: ${id}`);
      res.status(404).json({
        error: 'Service not found',
        id,
        message: 'The service to delete does not exist'
      });
      return;
    }
    
    await serviceManager.unregisterService(id);
    
    logger.info(`Service deleted: ${service.name} (${id})`);
    
    res.json({
      message: 'Service deleted successfully',
      service: {
        id: service.id,
        name: service.name,
        status: service.status,
        startTime: service.startTime,
        metadata: service.metadata
      }
    });
  } catch (error) {
    logger.error(`Failed to delete service ${id}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to delete service'
    });
  }
});

export { router as servicesRouter };
