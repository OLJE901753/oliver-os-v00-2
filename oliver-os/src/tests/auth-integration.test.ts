/**
 * Authentication Integration Test Script
 * End-to-end testing of the complete authentication flow
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthService } from '../src/services/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Integration test configuration
const TEST_CONFIG = {
  jwtSecret: 'integration-test-jwt-secret-key',
  jwtRefreshSecret: 'integration-test-jwt-refresh-secret-key',
  testUser: {
    email: 'integration-test@oliver-os.com',
    name: 'Integration Test User',
    password: 'IntegrationTest123!',
  },
};

describe('Authentication Integration Tests', () => {
  let authService: AuthService;
  let prisma: PrismaClient;
  let testUserId: string;
  let testTokens: { accessToken: string; refreshToken: string; expiresIn: number };

  beforeAll(async () => {
    // Set up test environment
    process.env.JWT_SECRET = TEST_CONFIG.jwtSecret;
    process.env.JWT_REFRESH_SECRET = TEST_CONFIG.jwtRefreshSecret;
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';

    // Initialize Prisma client (this would connect to a test database in real tests)
    prisma = new PrismaClient();
    authService = new AuthService(prisma);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await prisma.refreshToken.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
    await prisma.$disconnect();
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full user registration flow', async () => {
      // Step 1: Register new user
      const registerResult = await authService.register(TEST_CONFIG.testUser);
      
      expect(registerResult.user.email).toBe(TEST_CONFIG.testUser.email);
      expect(registerResult.user.name).toBe(TEST_CONFIG.testUser.name);
      expect(registerResult.tokens.accessToken).toBeDefined();
      expect(registerResult.tokens.refreshToken).toBeDefined();
      expect(registerResult.tokens.expiresIn).toBeGreaterThan(0);

      testUserId = registerResult.user.id;
      testTokens = registerResult.tokens;

      // Step 2: Verify user was created in database
      const createdUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(createdUser).toBeDefined();
      expect(createdUser?.email).toBe(TEST_CONFIG.testUser.email);
      expect(createdUser?.isActive).toBe(true);

      // Step 3: Verify password was hashed
      expect(createdUser?.password).not.toBe(TEST_CONFIG.testUser.password);
      const isPasswordValid = await bcrypt.compare(
        TEST_CONFIG.testUser.password,
        createdUser?.password || ''
      );
      expect(isPasswordValid).toBe(true);

      // Step 4: Verify refresh token was stored
      const refreshTokenRecord = await prisma.refreshToken.findFirst({
        where: { userId: testUserId },
      });

      expect(refreshTokenRecord).toBeDefined();
      expect(refreshTokenRecord?.token).toBe(testTokens.refreshToken);
    });

    it('should complete full user login flow', async () => {
      // Step 1: Login with credentials
      const loginResult = await authService.login({
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password,
      });

      expect(loginResult.user.email).toBe(TEST_CONFIG.testUser.email);
      expect(loginResult.tokens.accessToken).toBeDefined();
      expect(loginResult.tokens.refreshToken).toBeDefined();

      // Step 2: Verify access token is valid
      const decodedToken = jwt.verify(
        loginResult.tokens.accessToken,
        TEST_CONFIG.jwtSecret
      ) as any;

      expect(decodedToken.userId).toBe(testUserId);
      expect(decodedToken.email).toBe(TEST_CONFIG.testUser.email);

      // Step 3: Verify last login was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(updatedUser?.lastLoginAt).toBeDefined();
      expect(updatedUser?.lastLoginAt).not.toBeNull();
    });

    it('should complete token refresh flow', async () => {
      // Step 1: Get refresh token from database
      const refreshTokenRecord = await prisma.refreshToken.findFirst({
        where: { userId: testUserId },
      });

      expect(refreshTokenRecord).toBeDefined();

      // Step 2: Refresh access token
      const refreshResult = await authService.refreshToken(
        refreshTokenRecord!.token
      );

      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.expiresIn).toBeGreaterThan(0);

      // Step 3: Verify new access token is valid
      const decodedToken = jwt.verify(
        refreshResult.accessToken,
        TEST_CONFIG.jwtSecret
      ) as any;

      expect(decodedToken.userId).toBe(testUserId);
      expect(decodedToken.email).toBe(TEST_CONFIG.testUser.email);
    });

    it('should complete token verification flow', async () => {
      // Step 1: Generate a valid access token
      const accessToken = jwt.sign(
        { userId: testUserId, email: TEST_CONFIG.testUser.email },
        TEST_CONFIG.jwtSecret,
        { expiresIn: '15m' }
      );

      // Step 2: Verify token
      const verifiedUser = await authService.verifyToken(accessToken);

      expect(verifiedUser.id).toBe(testUserId);
      expect(verifiedUser.email).toBe(TEST_CONFIG.testUser.email);
      expect(verifiedUser.name).toBe(TEST_CONFIG.testUser.name);
    });

    it('should complete logout flow', async () => {
      // Step 1: Get refresh token from database
      const refreshTokenRecord = await prisma.refreshToken.findFirst({
        where: { userId: testUserId },
      });

      expect(refreshTokenRecord).toBeDefined();

      // Step 2: Logout user
      await authService.logout(refreshTokenRecord!.token);

      // Step 3: Verify refresh token was removed
      const deletedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshTokenRecord!.token },
      });

      expect(deletedToken).toBeNull();
    });

    it('should complete logout all sessions flow', async () => {
      // Step 1: Create multiple refresh tokens for the user
      const refreshTokens = [
        jwt.sign({ userId: testUserId, tokenId: '1' }, TEST_CONFIG.jwtRefreshSecret, { expiresIn: '7d' }),
        jwt.sign({ userId: testUserId, tokenId: '2' }, TEST_CONFIG.jwtRefreshSecret, { expiresIn: '7d' }),
        jwt.sign({ userId: testUserId, tokenId: '3' }, TEST_CONFIG.jwtRefreshSecret, { expiresIn: '7d' }),
      ];

      for (const token of refreshTokens) {
        await prisma.refreshToken.create({
          data: {
            userId: testUserId,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Step 2: Verify tokens were created
      const tokenCount = await prisma.refreshToken.count({
        where: { userId: testUserId },
      });
      expect(tokenCount).toBeGreaterThanOrEqual(3);

      // Step 3: Logout all sessions
      await authService.logoutAll(testUserId);

      // Step 4: Verify all tokens were removed
      const remainingTokens = await prisma.refreshToken.count({
        where: { userId: testUserId },
      });
      expect(remainingTokens).toBe(0);
    });
  });

  describe('Security Integration Tests', () => {
    it('should prevent duplicate user registration', async () => {
      // Try to register the same user again
      await expect(
        authService.register(TEST_CONFIG.testUser)
      ).rejects.toThrow('User with this email already exists');
    });

    it('should prevent login with wrong password', async () => {
      await expect(
        authService.login({
          email: TEST_CONFIG.testUser.email,
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should prevent login with non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: TEST_CONFIG.testUser.password,
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should prevent token refresh with invalid token', async () => {
      await expect(
        authService.refreshToken('invalid-refresh-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should prevent token verification with invalid token', async () => {
      await expect(
        authService.verifyToken('invalid-access-token')
      ).rejects.toThrow();
    });

    it('should handle expired tokens correctly', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: testUserId, email: TEST_CONFIG.testUser.email },
        TEST_CONFIG.jwtSecret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      await expect(
        authService.verifyToken(expiredToken)
      ).rejects.toThrow();
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle multiple concurrent logins', async () => {
      const loginPromises = Array.from({ length: 10 }, () =>
        authService.login({
          email: TEST_CONFIG.testUser.email,
          password: TEST_CONFIG.testUser.password,
        })
      );

      const results = await Promise.all(loginPromises);

      // All logins should succeed
      results.forEach((result) => {
        expect(result.user.email).toBe(TEST_CONFIG.testUser.email);
        expect(result.tokens.accessToken).toBeDefined();
      });
    });

    it('should handle multiple concurrent token refreshes', async () => {
      // Create multiple refresh tokens
      const refreshTokens = await Promise.all(
        Array.from({ length: 5 }, async () => {
          const token = jwt.sign(
            { userId: testUserId, tokenId: Math.random().toString() },
            TEST_CONFIG.jwtRefreshSecret,
            { expiresIn: '7d' }
          );

          await prisma.refreshToken.create({
            data: {
              userId: testUserId,
              token,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });

          return token;
        })
      );

      // Refresh all tokens concurrently
      const refreshPromises = refreshTokens.map((token) =>
        authService.refreshToken(token)
      );

      const results = await Promise.all(refreshPromises);

      // All refreshes should succeed
      results.forEach((result) => {
        expect(result.accessToken).toBeDefined();
        expect(result.expiresIn).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain data consistency across operations', async () => {
      // Step 1: Register user
      const registerResult = await authService.register({
        email: 'integrity-test@example.com',
        name: 'Integrity Test User',
        password: 'IntegrityTest123!',
      });

      const userId = registerResult.user.id;

      // Step 2: Verify user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(user?.email).toBe('integrity-test@example.com');
      expect(user?.name).toBe('Integrity Test User');
      expect(user?.isActive).toBe(true);

      // Step 3: Login and verify last login update
      await authService.login({
        email: 'integrity-test@example.com',
        password: 'IntegrityTest123!',
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(updatedUser?.lastLoginAt).toBeDefined();
      expect(updatedUser?.lastLoginAt).not.toBeNull();

      // Step 4: Clean up
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
      await prisma.user.delete({
        where: { id: userId },
      });
    });
  });
});
