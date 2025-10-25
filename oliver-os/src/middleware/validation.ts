/**
 * Input Validation Middleware
 * Validates and sanitizes user input
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SecurityManager } from '../core/security';
import { Logger } from '../core/logger';

const logger = new Logger('ValidationMiddleware');

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  uuid: z.string().uuid('Invalid UUID format'),
  positiveInt: z.number().int().positive('Must be a positive integer'),
  nonEmptyString: z.string().min(1, 'Field cannot be empty'),
  optionalString: z.string().optional(),
  optionalEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
};

// Request validation schemas
export const requestSchemas = {
  register: z.object({
    email: commonSchemas.email,
    name: commonSchemas.name,
    password: commonSchemas.password,
  }),
  
  login: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
  }),
  
  refreshToken: z.object({
    refreshToken: commonSchemas.nonEmptyString,
  }),
  
  updateProfile: z.object({
    name: commonSchemas.name.optional(),
    avatarUrl: commonSchemas.optionalString,
  }),
  
  changePassword: z.object({
    currentPassword: commonSchemas.password,
    newPassword: commonSchemas.password,
  }),
  
  createThought: z.object({
    content: z.string().min(1, 'Thought content cannot be empty').max(10000, 'Thought content too long'),
    type: z.enum(['text', 'voice', 'image']).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  
  createCollaborationSession: z.object({
    name: commonSchemas.nonEmptyString,
    description: commonSchemas.optionalString,
    settings: z.record(z.string(), z.any()).optional(),
  }),
};

export class ValidationMiddleware {
  private securityManager!: SecurityManager;

  constructor(securityManager: SecurityManager) {
    this.securityManager = securityManager;
  }

  /**
   * Generic validation middleware
   */
  validate = (schema: z.ZodSchema, target: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const data = req[target];
        const validatedData = schema.parse(data);
        
        // Sanitize string inputs
        if (target === 'body') {
          this.sanitizeRequestBody(validatedData);
        }
        
        req[target] = validatedData;
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          logger.warn(`Validation failed for ${req.method} ${req.path}:`, { issues: error.issues });
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error.issues.map((err: z.ZodIssue) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
          return;
        }
        
        logger.error('Validation error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal validation error',
        });
      }
    };
  };

  /**
   * Sanitize request body
   */
  private sanitizeRequestBody(data: any): void {
    if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (typeof data[key] === 'string') {
          data[key] = this.securityManager.sanitizeInput(data[key]);
        } else if (typeof data[key] === 'object') {
          this.sanitizeRequestBody(data[key]);
        }
      }
    }
  }

  /**
   * Validate email format
   */
  validateEmail = (req: Request, res: Response, next: NextFunction): void => {
    const { email } = req.body;
    
    if (email && !this.securityManager.validateEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
      return;
    }
    
    next();
  };

  /**
   * Validate password strength
   */
  validatePassword = (req: Request, res: Response, next: NextFunction): void => {
    const { password } = req.body;
    
    if (password) {
      const validation = this.securityManager.validatePassword(password);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Password validation failed',
          details: validation.errors,
        });
        return;
      }
    }
    
    next();
  };

  /**
   * Check for suspicious activity
   */
  checkSuspiciousActivity = (req: Request, res: Response, next: NextFunction): void => {
    if (this.securityManager.checkSuspiciousActivity(req)) {
      this.securityManager.logSecurityEvent('Suspicious activity detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Suspicious activity detected',
      });
      return;
    }
    
    next();
  };

  /**
   * Validate file upload
   */
  validateFileUpload = (maxSize: number = 10 * 1024 * 1024, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif']) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!(req as any).file) {
        next();
        return;
      }

      const { size, mimetype } = (req as any).file;

      if (size > maxSize) {
        res.status(400).json({
          success: false,
          error: 'File too large',
          message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        });
        return;
      }

      if (!allowedTypes.includes(mimetype)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file type',
          message: `Allowed types: ${allowedTypes.join(', ')}`,
        });
        return;
      }

      next();
    };
  };

  /**
   * Validate pagination parameters
   */
  validatePagination = (req: Request, res: Response, next: NextFunction): void => {
    const { page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({
        success: false,
        error: 'Invalid page parameter',
        message: 'Page must be a positive integer',
      });
      return;
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 100',
      });
      return;
    }
    
    req.query['page'] = pageNum.toString();
    req.query['limit'] = limitNum.toString();
    
    next();
  };
}

/**
 * Create validation middleware instance
 */
export function createValidationMiddleware(securityManager: SecurityManager): ValidationMiddleware {
  return new ValidationMiddleware(securityManager);
}
