/**
 * Request Logging Middleware
 * Logs all incoming requests with timing and metadata
 */

import type { Request, Response, NextFunction } from 'express';
import { Logger } from '../core/logger';

const logger = new Logger('RequestLogger');

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Add request start time to headers for response time calculation
  req.headers['x-request-start'] = startTime.toString();
  
  // Log the incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, _cb?: any): any {
    const responseTime = Date.now() - startTime;
    
    logger.info('Response sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || '0',
      timestamp: new Date().toISOString()
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
}
