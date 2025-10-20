/**
 * Security Headers Middleware
 * Adds security headers to all responses
 */

import type { Request, Response, NextFunction } from 'express';
import { SecurityManager } from '../core/security';
import { Logger } from '../core/logger';

const logger = new Logger('SecurityHeadersMiddleware');

export class SecurityHeadersMiddleware {
  private securityManager: SecurityManager;

  constructor(securityManager: SecurityManager) {
    this.securityManager = securityManager;
  }

  /**
   * Add security headers to response
   */
  addSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const headers = this.securityManager.getSecurityHeaders();
      
      // Add security headers
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Add custom Oliver-OS headers
      res.setHeader('X-Powered-By', 'Oliver-OS');
      res.setHeader('X-API-Version', '0.0.2');
      
      // Add cache control for sensitive endpoints
      if (req.path.startsWith('/api/auth/') || req.path.startsWith('/api/admin/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      next();
    } catch (error) {
      logger.error('Error adding security headers:', error);
      next();
    }
  };

  /**
   * Remove sensitive headers
   */
  removeSensitiveHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
  };

  /**
   * Add CORS headers
   */
  addCorsHeaders = (req: Request, res: Response, next: NextFunction): void => {
    const config = this.securityManager.getConfig();
    
    res.setHeader('Access-Control-Allow-Origin', config.cors.origin.join(', '));
    res.setHeader('Access-Control-Allow-Credentials', config.cors.credentials.toString());
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  };

  /**
   * Add request ID for tracking
   */
  addRequestId = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.headers['x-request-id'] || this.generateRequestId();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    next();
  };

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add timing headers
   */
  addTimingHeaders = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${duration}ms`);
    });
    
    next();
  };

  /**
   * Add security event logging
   */
  logSecurityEvents = (req: Request, res: Response, next: NextFunction): void => {
    // Log suspicious patterns
    if (this.securityManager.checkSuspiciousActivity(req)) {
      this.securityManager.logSecurityEvent('Suspicious request detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        headers: req.headers,
      });
    }

    // Log authentication attempts
    if (req.path.startsWith('/api/auth/')) {
      this.securityManager.logSecurityEvent('Authentication attempt', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });
    }

    next();
  };
}

/**
 * Create security headers middleware instance
 */
export function createSecurityHeadersMiddleware(securityManager: SecurityManager): SecurityHeadersMiddleware {
  return new SecurityHeadersMiddleware(securityManager);
}
