/**
 * Authentication System Test Script
 * Comprehensive testing of the authentication implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthService } from '../src/services/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock Prisma client for testing
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
} as any;

describe('Authentication System Tests', () => {
  let authService: AuthService;

  beforeAll(() => {
    // Set up test environment
    process.env.JWT_SECRET = 'test-jwt-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';
    
    authService = new AuthService(mockPrisma);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'TestPassword123!',
      };

      const mockUser = {
        id: 'user-123',
        email: userData.email,
        name: userData.name,
        password: 'hashed-password',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        token: 'refresh-token',
        expiresAt: new Date(),
      });

      const result = await authService.register(userData);

      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.tokens.expiresIn).toBeGreaterThan(0);
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'TestPassword123!',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: userData.email,
      });

      await expect(authService.register(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('User Login', () => {
    it('should login user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      const mockUser = {
        id: 'user-123',
        email: credentials.email,
        name: 'Test User',
        password: await bcrypt.hash(credentials.password, 12),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        token: 'refresh-token',
        expiresAt: new Date(),
      });

      const result = await authService.login(credentials);

      expect(result.user.email).toBe(credentials.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockUser = {
        id: 'user-123',
        email: credentials.email,
        name: 'Test User',
        password: await bcrypt.hash('CorrectPassword', 12),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.login(credentials)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should reject login for inactive user', async () => {
      const credentials = {
        email: 'inactive@example.com',
        password: 'TestPassword123!',
      };

      const mockUser = {
        id: 'user-123',
        email: credentials.email,
        name: 'Inactive User',
        password: await bcrypt.hash(credentials.password, 12),
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.login(credentials)).rejects.toThrow(
        'Account is deactivated'
      );
    });
  });

  describe('Token Management', () => {
    it('should refresh access token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockTokenRecord = {
        id: 'token-123',
        userId: 'user-123',
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          isActive: true,
        },
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockTokenRecord);

      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('should reject refresh with expired token', async () => {
      const refreshToken = 'expired-refresh-token';
      const mockTokenRecord = {
        id: 'token-123',
        userId: 'user-123',
        token: refreshToken,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          isActive: true,
        },
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockTokenRecord);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should verify valid access token', async () => {
      const accessToken = jwt.sign(
        { userId: 'user-123', email: 'test@example.com' },
        'test-jwt-secret-key',
        { expiresIn: '15m' }
      );

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.verifyToken(accessToken);

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should reject invalid access token', async () => {
      const invalidToken = 'invalid-token';

      await expect(authService.verifyToken(invalidToken)).rejects.toThrow();
    });
  });

  describe('Logout', () => {
    it('should logout user and invalidate refresh token', async () => {
      const refreshToken = 'valid-refresh-token';

      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await authService.logout(refreshToken);

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: refreshToken },
      });
    });

    it('should logout all sessions for user', async () => {
      const userId = 'user-123';

      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await authService.logoutAll(userId);

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('Password Security', () => {
    it('should hash passwords securely', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 12);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should verify password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hashedPassword);
      const isInvalid = await bcrypt.compare('WrongPassword', hashedPassword);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token Security', () => {
    it('should generate valid JWT tokens', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const secret = 'test-jwt-secret-key';
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify JWT tokens correctly', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const secret = 'test-jwt-secret-key';
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });

      const decoded = jwt.verify(token, secret) as any;

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should reject tokens with wrong secret', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const token = jwt.sign(payload, 'correct-secret', { expiresIn: '15m' });

      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });
  });
});

// Mock jest for vitest compatibility
const jest = {
  fn: () => ({
    mockResolvedValue: ((_value: any) => {},
    mockRejectedValue: ((_value: any) => {},
    toHaveBeenCalledWith: (...args: any[]) => {},
    toHaveBeenCalled: () => {},
  }),
  clearAllMocks: () => {},
};
