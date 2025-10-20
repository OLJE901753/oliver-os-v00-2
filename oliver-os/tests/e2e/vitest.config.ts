/**
 * Vitest Configuration for E2E Tests
 * Special configuration for end-to-end testing
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    testTimeout: 120000, // 2 minutes for E2E tests
    hookTimeout: 60000,  // 1 minute for setup/teardown
    teardownTimeout: 30000, // 30 seconds for cleanup
    coverage: {
      enabled: false, // Disable coverage for E2E tests
    },
    // E2E specific settings
    pool: 'forks', // Use separate processes for each test file
    poolOptions: {
      forks: {
        singleFork: false, // Allow multiple forks for parallel execution
      }
    },
    // Retry failed tests
    retry: 2,
    // Reporter configuration
    reporter: ['verbose', 'json'],
    outputFile: {
      json: 'test-results/e2e-results.json'
    },
    // Environment variables for E2E tests
    env: {
      NODE_ENV: 'test',
      E2E_TEST: 'true',
      // Database configuration for tests
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/oliver_os_test',
      REDIS_URL: 'redis://localhost:6379/1',
      // Test ports
      TEST_BACKEND_PORT: '3001',
      TEST_FRONTEND_PORT: '3002',
      TEST_AI_SERVICES_PORT: '8001',
    },
    // Setup files
    setupFiles: ['./tests/e2e/setup.ts'],
    // Global test configuration
    globalSetup: './tests/e2e/global-setup.ts',
    globalTeardown: './tests/e2e/global-teardown.ts',
  },
  // Resolve configuration
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@tests': new URL('./tests', import.meta.url).pathname,
    }
  },
  // Define configuration
  define: {
    'import.meta.env.E2E_TEST': 'true',
    'import.meta.env.NODE_ENV': '"test"',
  }
});
