/**
 * Rate Limiting Middleware
 * Implements rate limiting and slow-down protection
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import slowDown from 'express-slow-down';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';

const logger = new Logger('RateLimitMiddleware');

/**
 * General rate limiter for API endpoints
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too Many Authentication Attempts',
    message: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Authentication Attempts',
      message: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Very strict rate limiter for sensitive operations
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests for this sensitive operation, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests for this sensitive operation, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Slow down middleware for gradual rate limiting
 */
export const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes, then...
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

/**
 * Per-user rate limiter (requires authentication)
 */
export const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each user to 200 requests per windowMs
  keyGenerator: (req: Request) => {
    // Use user ID if available, otherwise fall back to IP with proper IPv6 handling
    if (req.user?.id) {
      return req.user.id;
    }
    // For IP-based rate limiting, use proper IPv6 handling
    return ipKeyGenerator(req as any);
  },
  message: {
    error: 'User Rate Limit Exceeded',
    message: 'Too many requests for this user, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const identifier = req.user?.id || req.ip;
    logger.warn(`User rate limit exceeded for: ${identifier}`);
    res.status(429).json({
      error: 'User Rate Limit Exceeded',
      message: 'Too many requests for this user, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * WebSocket rate limiter (for real-time events)
 */
export const websocketRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 WebSocket events per minute
  message: {
    error: 'WebSocket Rate Limit Exceeded',
    message: 'Too many WebSocket events, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`WebSocket rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'WebSocket Rate Limit Exceeded',
      message: 'Too many WebSocket events, please slow down.',
      retryAfter: '1 minute'
    });
  }
});

/**
 * File upload rate limiter
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: 'Upload Rate Limit Exceeded',
    message: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Upload Rate Limit Exceeded',
      message: 'Too many file uploads, please try again later.',
      retryAfter: '1 hour'
    });
  }
});
