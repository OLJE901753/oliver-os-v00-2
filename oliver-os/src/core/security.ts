/**
 * Security Configuration
 * Centralized security settings and utilities
 */

import { Config } from './config';
import { Logger } from './logger';

const logger = new Logger('Security');

export interface SecurityConfig {
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  rateLimiting: {
    general: {
      windowMs: number;
      max: number;
    };
    auth: {
      windowMs: number;
      max: number;
    };
    strict: {
      windowMs: number;
      max: number;
    };
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  helmet: {
    contentSecurityPolicy: any;
  };
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export class SecurityManager {
  private config: SecurityConfig;

  constructor(config: Config) {
    this.config = this.loadSecurityConfig(config);
  }

  /**
   * Load security configuration from environment and config
   */
  private loadSecurityConfig(config: Config): SecurityConfig {
    return {
      jwt: {
        secret: process.env.JWT_SECRET || 'oliver-os-secret-key-change-in-production',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'oliver-os-refresh-secret-change-in-production',
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
      },
      rateLimiting: {
        general: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100, // 100 requests per window
        },
        auth: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 5, // 5 auth requests per window
        },
        strict: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 3, // 3 requests per window
        },
      },
      cors: {
        origin: Array.isArray(config.get('cors.origin'))
          ? config.get('cors.origin')
          : ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
      },
      helmet: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "'nonce-{random}'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'", "https:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        },
      },
      password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      },
    };
  }

  /**
   * Get security configuration
   */
  getConfig(): SecurityConfig {
    return this.config;
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } = this.config.password;

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Get security headers for responses
   */
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };

    if (this.isProduction()) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    return headers;
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, details: any): void {
    logger.warn(`Security Event: ${event}`, details);
  }

  /**
   * Check for suspicious activity
   */
  checkSuspiciousActivity(req: any): boolean {
    const userAgent = req.get('User-Agent') || '';
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /burp/i,
      /w3af/i,
      /acunetix/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
}
