/**
 * Route Validation Utilities
 * Simple validation helpers for route handlers using Zod
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { z } from 'zod';
import type { Request, Response } from 'express';
import { Logger } from '../core/logger';

const logger = new Logger('RouteValidation');

/**
 * Validation result type
 */
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>, req: Request): ValidationResult<T> {
  try {
    const data = schema.parse(req.body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(`Validation failed for ${req.method} ${req.path}:`, { issues: error.issues });
      return {
        success: false,
        error: {
          message: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      };
    }
    
    logger.error('Validation error:', error);
    return {
      success: false,
      error: {
        message: 'Internal validation error',
      },
    };
  }
}

/**
 * Validate request params against a Zod schema
 */
export function validateParams<T>(schema: z.ZodSchema<T>, req: Request): ValidationResult<T> {
  try {
    const data = schema.parse(req.params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(`Parameter validation failed for ${req.method} ${req.path}:`, { issues: error.issues });
      return {
        success: false,
        error: {
          message: 'Invalid parameters',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      };
    }
    
    logger.error('Parameter validation error:', error);
    return {
      success: false,
      error: {
        message: 'Internal validation error',
      },
    };
  }
}

/**
 * Send validation error response
 * Provides backward-compatible error format matching existing test expectations
 */
export function sendValidationError(res: Response, validationResult: ValidationResult, req?: Request): void {
  if (validationResult.error?.details && validationResult.error.details.length > 0) {
    // Extract the first error detail for backward compatibility
    const firstError = validationResult.error.details[0];
    if (!firstError) {
      res.status(400).json({
        error: validationResult.error.message || 'Validation failed',
      });
      return;
    }
    
    // Determine route context from request path (check both path and originalUrl)
    const routeContext = req ? (req.originalUrl || req.path || req.baseUrl + req.path) : '';
    const isProcessRoute = routeContext.includes('/processes') || routeContext.includes('/api/processes');
    const isServiceRoute = routeContext.includes('/services') || routeContext.includes('/api/services');
    const isAgentRoute = routeContext.includes('/agents') || routeContext.includes('/api/agents');
    const isBackupRoute = routeContext.includes('/backup') || routeContext.includes('/api/backup');
    
    // Map field names to expected error messages for backward compatibility
    const getFieldErrorMessage = (field: string, message: string, allErrors: Array<{ field: string; message: string }>): string => {
      // For agents routes, use "Invalid request" format
      if (isAgentRoute) {
        if (field === 'agentType' || field === 'prompt' || allErrors.some(e => e.field === 'agentType' || e.field === 'prompt')) {
          const missingFields = allErrors
            .filter(e => e.field === 'agentType' || e.field === 'prompt')
            .map(e => e.field === 'agentType' ? 'agentType' : 'prompt');
          if (missingFields.length === 2) {
            return 'Invalid request';
          } else if (missingFields.length === 1) {
            return 'Invalid request';
          }
        }
        if (field === 'requests') {
          return 'Invalid request';
        }
        // For nested errors in spawn-multiple
        if (field.includes('requests') && allErrors.some(e => e.field.includes('requests'))) {
          return 'Invalid request';
        }
      }
      
      if (message.includes('required')) {
        // For backup routes, return the message directly
        if (isBackupRoute && field === 'backupPath') {
          return message;
        }
        return message;
      }
      
      if (message.includes('undefined') || message.includes('expected string') || message.includes('expected array')) {
        // Handle type errors for required fields - use context-aware names
        if (field === 'name') {
          if (isProcessRoute) return 'Process name is required';
          if (isServiceRoute) return 'Service name is required';
          return 'name is required';
        }
        if (field === 'backupPath') return 'backupPath is required';
        if (field === 'agentType' && isAgentRoute) return 'Invalid request';
        if (field === 'prompt' && isAgentRoute) return 'Invalid request';
        if (field === 'requests' && isAgentRoute) return 'Invalid request';
        if (field.includes('requests') && isAgentRoute) return 'Invalid request';
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
      
      return message;
    };
    
    // Format error message to match original route error format
    const allErrors = validationResult.error.details;
    const errorMessage = getFieldErrorMessage(firstError.field, firstError.message, allErrors);
    
    // Create response matching original route format
    if (isAgentRoute) {
      // Agents routes expect: { error: "Invalid request", details: "..." }
      let detailsMessage = '';
      if (firstError.field === 'agentType' || firstError.field === 'prompt' || 
          allErrors.some(e => e.field === 'agentType' || e.field === 'prompt')) {
        // Always return "agentType and prompt are required" for backward compatibility with tests
        // Even if only one is missing, the original route returned this message
        detailsMessage = 'agentType and prompt are required';
      } else if (firstError.field === 'requests' || firstError.field.includes('requests')) {
        if (firstError.message.includes('array is required') || 
            firstError.message.includes('cannot be empty') || 
            firstError.message.includes('At least one request') ||
            firstError.message.includes('too_small')) {
          detailsMessage = 'requests array is required and cannot be empty';
        } else if (firstError.message.includes('not an array') || 
                   firstError.message.includes('expected array') ||
                   firstError.message.includes('Invalid input: expected array')) {
          detailsMessage = 'requests array is required and cannot be empty';
        } else if (firstError.field.includes('agentType') || firstError.field.includes('prompt')) {
          detailsMessage = 'Each request must have agentType and prompt';
        } else {
          detailsMessage = firstError.message;
        }
      }
      
      res.status(400).json({
        error: errorMessage,
        details: detailsMessage || firstError.message,
      });
    } else if (isBackupRoute) {
      // Backup routes expect: { success: false, error: "..." }
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    } else {
      // Services/Processes routes expect: { error: "...", message: "..." }
      const responseBody: { error: string; message?: string; details?: Array<{ field: string; message: string }> } = {
        error: errorMessage,
      };
      
      // Add message field for backward compatibility with existing tests
      if (firstError.field === 'name') {
        if (isProcessRoute) {
          responseBody.message = 'Please provide a name for the process';
        } else if (isServiceRoute) {
          responseBody.message = 'Please provide a name for the service';
        }
      } else if (firstError.field === 'backupPath') {
        responseBody.message = 'Please provide a backup path';
      }
      
      if (validationResult.error.details.length > 1) {
        responseBody.details = validationResult.error.details;
      }
      
      res.status(400).json(responseBody);
    }
  } else {
    res.status(400).json({
      error: validationResult.error?.message || 'Validation failed',
    });
  }
}

/**
 * Validate string input with length constraints
 */
export function validateString(input: unknown, fieldName: string, options?: {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}): { valid: boolean; error?: string } {
  const { minLength = 1, maxLength = 10000, required = true } = options || {};
  
  if (required && (input === undefined || input === null)) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  if (!required && (input === undefined || input === null)) {
    return { valid: true };
  }
  
  if (typeof input !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  
  if (input.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} character(s)` };
  }
  
  if (input.length > maxLength) {
    return { valid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }
  
  return { valid: true };
}

