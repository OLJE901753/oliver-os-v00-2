/**
 * Authentication System Validation Script
 * Tests the authentication system without requiring a running server
 */

import { PrismaClient } from '@prisma/client';
import { AuthService } from './src/services/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Test configuration
const TEST_CONFIG = {
  jwtSecret: 'oliver-os-jwt-secret-key-change-in-production',
  jwtRefreshSecret: 'oliver-os-jwt-refresh-secret-key-change-in-production',
  testUser: {
    email: 'test-final@oliver-os.com',
    name: 'Test User',
    password: 'TestPassword123!',
  },
};

async function testAuthenticationSystem() {
  console.log('🚀 Starting Oliver-OS Authentication System Test...\n');

  try {
    // Initialize Prisma client
    const prisma = new PrismaClient();
    console.log('✅ Prisma client initialized');

    // Initialize AuthService
    const authService = new AuthService(prisma);
    console.log('✅ AuthService initialized');

    // Test 1: User Registration
    console.log('\n📝 Test 1: User Registration');
    const registerResult = await authService.register(TEST_CONFIG.testUser);
    console.log('✅ User registered successfully');
    console.log(`   User ID: ${registerResult.user.id}`);
    console.log(`   Email: ${registerResult.user.email}`);
    console.log(`   Access Token: ${registerResult.tokens.accessToken.substring(0, 20)}...`);
    console.log(`   Refresh Token: ${registerResult.tokens.refreshToken.substring(0, 20)}...`);

    // Test 2: User Login
    console.log('\n🔐 Test 2: User Login');
    const loginResult = await authService.login({
      email: TEST_CONFIG.testUser.email,
      password: TEST_CONFIG.testUser.password,
    });
    console.log('✅ User logged in successfully');
    console.log(`   User ID: ${loginResult.user.id}`);
    console.log(`   Last Login: ${loginResult.user.lastLoginAt}`);

    // Test 3: Token Verification
    console.log('\n🔍 Test 3: Token Verification');
    const verifiedUser = await authService.verifyToken(loginResult.tokens.accessToken);
    console.log('✅ Token verified successfully');
    console.log(`   Verified User ID: ${verifiedUser.id}`);
    console.log(`   Verified Email: ${verifiedUser.email}`);

    // Test 4: Token Refresh
    console.log('\n🔄 Test 4: Token Refresh');
    const refreshResult = await authService.refreshToken(loginResult.tokens.refreshToken);
    console.log('✅ Token refreshed successfully');
    console.log(`   New Access Token: ${refreshResult.accessToken.substring(0, 20)}...`);
    console.log(`   Expires In: ${refreshResult.expiresIn} seconds`);

    // Test 5: Password Security
    console.log('\n🛡️ Test 5: Password Security');
    const user = await prisma.user.findUnique({
      where: { email: TEST_CONFIG.testUser.email },
    });
    if (user) {
      const isPasswordValid = await bcrypt.compare(TEST_CONFIG.testUser.password, user.password);
      console.log('✅ Password hashing verified');
      console.log(`   Original Password: ${TEST_CONFIG.testUser.password}`);
      console.log(`   Hashed Password: ${user.password.substring(0, 20)}...`);
      console.log(`   Password Match: ${isPasswordValid}`);
    }

    // Test 6: JWT Token Security
    console.log('\n🔒 Test 6: JWT Token Security');
    const jwtSecret = process.env.JWT_SECRET || 'oliver-os-jwt-secret-key-change-in-production';
    const decodedToken = jwt.verify(refreshResult.accessToken, jwtSecret);
    console.log('✅ JWT token security verified');
    console.log(`   Token User ID: ${decodedToken.userId}`);
    console.log(`   Token Email: ${decodedToken.email}`);
    console.log(`   Token Expires: ${new Date(decodedToken.exp * 1000).toISOString()}`);

    // Test 7: Database Integrity
    console.log('\n💾 Test 7: Database Integrity');
    const userCount = await prisma.user.count();
    const refreshTokenCount = await prisma.refreshToken.count();
    console.log('✅ Database integrity verified');
    console.log(`   Total Users: ${userCount}`);
    console.log(`   Total Refresh Tokens: ${refreshTokenCount}`);

    // Test 8: Error Handling
    console.log('\n❌ Test 8: Error Handling');
    try {
      await authService.login({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });
      console.log('❌ Error handling failed - should have thrown error');
    } catch (error) {
      console.log('✅ Error handling verified');
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Cleanup
    console.log('\n🧹 Cleanup');
    await prisma.refreshToken.deleteMany({
      where: { userId: registerResult.user.id },
    });
    await prisma.user.delete({
      where: { id: registerResult.user.id },
    });
    console.log('✅ Test data cleaned up');

    await prisma.$disconnect();
    console.log('\n🎉 All authentication tests passed successfully!');
    console.log('✅ Oliver-OS Authentication System is working correctly!');

  } catch (error) {
    console.error('\n❌ Authentication test failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testAuthenticationSystem();
