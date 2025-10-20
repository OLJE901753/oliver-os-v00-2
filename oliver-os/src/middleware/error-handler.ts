/**
 * Error Handling Middleware
 * Centralized error handling with proper logging and responses
 */

import type { Request, Response, NextFunction } from 'express';
import { Logger } from '../core/logger';

const logger = new Logger('ErrorHandler');

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Unhandled error', error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Determine status code
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  // Prepare error response
  const errorResponse = {
    error: {
      message: isOperational ? error.message : 'Internal Server Error',
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      ...errorResponse.error,
      stack: error.stack,
      details: error
    };
  }

  res.status(statusCode).json(errorResponse);
}

export function createError(message: string, statusCode: number = 500): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
