/**
 * Authentication Routes
 * Handles user registration, login, logout, and token management
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth';
import type { LoginCredentials, RegisterData } from '../services/auth';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../core/logger';

const logger = new Logger('AuthRoutes');

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export function createAuthRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const authService = new AuthService(prisma);

  /**
   * POST /api/auth/register
   * Register a new user
   */
  router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);
      
      const result = await authService.register(validatedData as RegisterData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error('Registration failed:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.issues
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/auth/login
   * Login user
   */
  router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      
      const result = await authService.login(validatedData as LoginCredentials);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error('Login failed:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.issues
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Invalid credentials'
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validatedData = refreshTokenSchema.parse(req.body);
      
      const result = await authService.refreshToken(validatedData.refreshToken);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.issues
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Invalid refresh token'
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout user (invalidate refresh token)
   */
  router.post('/logout', async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
        return;
      }

      await authService.logout(refreshToken);
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/auth/logout-all
   * Logout all sessions for user
   */
  router.post('/logout-all', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      await authService.logoutAll(userId);
      
      res.json({
        success: true,
        message: 'All sessions logged out successfully'
      });
    } catch (error) {
      logger.error('Logout all failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Logout all failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user info (requires authentication)
   */
  router.get('/me', async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'No valid authorization header provided'
        });
        return;
      }

      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get user info failed:', error);
      
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Invalid token'
      });
    }
  });

  /**
   * POST /api/auth/cleanup-tokens
   * Clean up expired refresh tokens (admin endpoint)
   */
  router.post('/cleanup-tokens', async (_req: Request, res: Response): Promise<void> => {
    try {
      const count = await authService.cleanupExpiredTokens();
      
      res.json({
        success: true,
        message: `Cleaned up ${count} expired tokens`,
        data: { cleanedCount: count }
      });
    } catch (error) {
      logger.error('Token cleanup failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Token cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
