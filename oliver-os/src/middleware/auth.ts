/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import type { AuthUser } from '../services/auth';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../core/logger';

const logger = new Logger('AuthMiddleware');

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor(prisma: PrismaClient) {
    this.authService = new AuthService(prisma);
  }

  /**
   * Verify JWT token and attach user to request
   */
  verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No valid authorization header provided'
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      const user = await this.authService.verifyToken(token);
      req.user = user;
      
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
  };

  /**
   * Optional token verification (doesn't fail if no token)
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const user = await this.authService.verifyToken(token);
        req.user = user;
      }
      
      next();
    } catch (error) {
      // Log but don't fail for optional auth
      logger.warn('Optional auth failed:', error);
      next();
    }
  };

  /**
   * Require active user (not deactivated)
   */
  requireActiveUser = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    if (!req.user.isActive) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Account is deactivated'
      });
      return;
    }

    next();
  };

  /**
   * Require specific user (for user-specific operations)
   */
  requireUser = (userId: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.id !== userId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied to this resource'
        });
        return;
      }

      next();
    };
  };

  /**
   * Get auth service instance
   */
  getAuthService(): AuthService {
    return this.authService;
  }
}

/**
 * Create auth middleware instance
 */
export function createAuthMiddleware(prisma: PrismaClient): AuthMiddleware {
  return new AuthMiddleware(prisma);
}
