/**
 * Vitest Configuration for Smart Assistance Tests
 * Comprehensive testing configuration for the smart assistance system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Test file patterns
    include: [
      'src/tests/smart-assistance/**/*.test.ts',
      'src/tests/smart-assistance/**/*.spec.ts'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts'
    ],
    
    // Test timeout
    testTimeout: 30000, // 30 seconds for complex tests
    
    // Setup files
    setupFiles: [
      'src/tests/smart-assistance/test-setup.ts'
    ],
    
    // Global setup
    globalSetup: 'src/tests/smart-assistance/global-setup.ts',
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: 'coverage/smart-assistance',
      include: [
        'src/services/memory/**',
        'src/services/review/**',
        'src/services/monster-mode/**',
        'src/examples/smart-assistance-example.ts'
      ],
      exclude: [
        'src/tests/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/node_modules/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Performance testing
    benchmark: {
      include: [
        'src/tests/smart-assistance/performance-tests.ts'
      ],
      outputFile: 'benchmark-results.json',
      reporters: ['verbose', 'json']
    },
    
    // Reporter configuration
    reporter: [
      'verbose',
      'json',
      'html'
    ],
    
    // Output directory
    outputFile: {
      json: 'test-results.json',
      html: 'test-report.html'
    },
    
    // Test retry configuration
    retry: 2,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Memory leak detection
    detectLeaks: true,
    
    // Test isolation
    isolate: true,
    
    // Global test configuration
    globals: true,
    
    // TypeScript configuration
    typecheck: {
      tsconfig: './tsconfig.json'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@tests': path.resolve(__dirname, 'src/tests'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@examples': path.resolve(__dirname, 'src/examples')
    }
  },
  
  // Define configuration
  define: {
    'import.meta.vitest': 'undefined'
  }
});
