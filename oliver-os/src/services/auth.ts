/**
 * Authentication Service
 * Handles user authentication, JWT tokens, and password management
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import type { User } from '@prisma/client';
import { Logger } from '../core/logger';

const logger = new Logger('AuthService');

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export class AuthService {
  private prisma: PrismaClient;
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.jwtSecret = process.env['JWT_SECRET'] || 'oliver-os-secret-key-change-in-production';
    this.jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'] || 'oliver-os-refresh-secret-change-in-production';
    this.accessTokenExpiry = process.env['JWT_ACCESS_EXPIRY'] || '15m';
    this.refreshTokenExpiry = process.env['JWT_REFRESH_EXPIRY'] || '7d';
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
        }
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      logger.info(`User registered: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        tokens
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      logger.info(`User logged in: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        tokens
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      // Verify refresh token
      jwt.verify(refreshToken, this.jwtRefreshSecret) as { userId: string; tokenId: string };
      
      // Find refresh token in database
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      if (!tokenRecord.user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { 
          userId: tokenRecord.user.id, 
          email: tokenRecord.user.email 
        },
        this.jwtSecret!,
        { expiresIn: this.accessTokenExpiry } as jwt.SignOptions
      );

      const expiresIn = this.getTokenExpiry(this.accessTokenExpiry);

      logger.info(`Token refreshed for user: ${tokenRecord.user.email}`);

      return { accessToken, expiresIn };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });

      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Logout all sessions for user
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      await this.prisma.refreshToken.deleteMany({
        where: { userId }
      });

      logger.info(`All sessions logged out for user: ${userId}`);
    } catch (error) {
      logger.error('Logout all failed:', error);
      throw error;
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; email: string };
      
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid or inactive user');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    // Generate access token
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      this.jwtSecret!,
      { expiresIn: this.accessTokenExpiry } as jwt.SignOptions
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        tokenId: crypto.randomUUID() 
      },
      this.jwtRefreshSecret!,
      { expiresIn: this.refreshTokenExpiry } as jwt.SignOptions
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt
      }
    });

    const expiresIn = this.getTokenExpiry(this.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  /**
   * Sanitize user data (remove password)
   */
  private sanitizeUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || '',
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt || new Date(),
      createdAt: user.createdAt
    };
  }

  /**
   * Get token expiry in seconds
   */
  private getTokenExpiry(expiry: string): number {
    const match = expiry.match(/(\d+)([smhd])/);
    if (!match) return 900; // 15 minutes default

    const value = parseInt(match[1]!);
    const unit = match[2]!;

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 900;
    }
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      logger.info(`Cleaned up ${result.count} expired refresh tokens`);
      return result.count;
    } catch (error) {
      logger.error('Token cleanup failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService(new PrismaClient());
