/**
 * End-to-End Test Setup
 * Configures the test environment for full system testing
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { io, Socket } from 'socket.io-client';

// Test configuration
const TEST_CONFIG = {
  BACKEND_PORT: 3001,
  FRONTEND_PORT: 3002,
  AI_SERVICES_PORT: 8001,
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/oliver_os_test',
  REDIS_URL: 'redis://localhost:6379/1', // Use different Redis DB for tests
  TIMEOUT: 30000,
};

// Global test state
let backendServer: any;
let frontendServer: any;
let aiServicesProcess: any;
let testSocket: Socket | null = null;

export const setupE2E = () => {
  beforeAll(async () => {
    console.log('🚀 Setting up E2E test environment...');
    
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = TEST_CONFIG.BACKEND_PORT.toString();
    process.env.DATABASE_URL = TEST_CONFIG.DATABASE_URL;
    process.env.REDIS_URL = TEST_CONFIG.REDIS_URL;
    process.env.AI_SERVICES_URL = `http://localhost:${TEST_CONFIG.AI_SERVICES_PORT}`;
    
    // Start backend server
    console.log('📡 Starting backend server...');
    try {
      const { createHttpServerWithWebSocket } = await import('../../src/core/server');
      const { Config } = await import('../../src/core/config');
      const { ServiceManager } = await import('../../src/services/service-manager');
      
      const config = new Config();
      await config.load();
      const serviceManager = new ServiceManager(config);
      
      const { httpServer } = createHttpServerWithWebSocket(config, serviceManager);
      backendServer = httpServer;
      
      await new Promise<void>((resolve) => {
        backendServer.listen(TEST_CONFIG.BACKEND_PORT, () => {
          console.log(`✅ Backend server running on port ${TEST_CONFIG.BACKEND_PORT}`);
          resolve();
        });
      });
    } catch (error) {
      console.error('❌ Failed to start backend server:', error);
      throw error;
    }
    
    // Start AI services (mock)
    console.log('🤖 Starting AI services...');
    try {
      // For E2E tests, we'll use a simple mock server
      aiServicesProcess = createMockAIServices();
      console.log(`✅ AI services running on port ${TEST_CONFIG.AI_SERVICES_PORT}`);
    } catch (error) {
      console.error('❌ Failed to start AI services:', error);
      throw error;
    }
    
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ E2E test environment ready!');
  }, TEST_CONFIG.TIMEOUT);

  afterAll(async () => {
    console.log('🧹 Cleaning up E2E test environment...');
    
    // Close WebSocket connection
    if (testSocket) {
      testSocket.disconnect();
      testSocket = null;
    }
    
    // Stop servers
    if (backendServer) {
      await new Promise<void>((resolve) => {
        backendServer.close(() => {
          console.log('✅ Backend server stopped');
          resolve();
        });
      });
    }
    
    if (aiServicesProcess) {
      aiServicesProcess.close();
      console.log('✅ AI services stopped');
    }
    
    console.log('✅ E2E test environment cleaned up');
  }, TEST_CONFIG.TIMEOUT);

  beforeEach(async () => {
    // Connect WebSocket for each test
    testSocket = io(`http://localhost:${TEST_CONFIG.BACKEND_PORT}`, {
      transports: ['websocket'],
      timeout: 5000,
    });
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);
      
      testSocket!.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      testSocket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  });

  afterEach(async () => {
    // Disconnect WebSocket after each test
    if (testSocket) {
      testSocket.disconnect();
      testSocket = null;
    }
  });
};

// Mock AI services for testing
function createMockAIServices() {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // Mock thought processing endpoint
  app.post('/api/thoughts/process', (req: any, res: any) => {
    const { content, user_id, metadata, tags } = req.body;
    
    // Simulate processing delay
    setTimeout(() => {
      res.json({
        id: `thought_${Date.now()}`,
        content,
        user_id,
        metadata: { ...metadata, processed_at: new Date().toISOString() },
        tags: [...(tags || []), 'processed'],
        insights: ['This is a test insight'],
        confidence: 0.95,
        processing_time_ms: Math.random() * 1000 + 500
      });
    }, 100);
  });
  
  // Mock agent spawning endpoint
  app.post('/api/agents/spawn', (req: any, res: any) => {
    const { agent_type, prompt, metadata } = req.body;
    
    setTimeout(() => {
      res.json({
        id: `agent_${Date.now()}`,
        agent_type,
        prompt,
        metadata: { ...metadata, spawned_at: new Date().toISOString() },
        status: 'active'
      });
    }, 50);
  });
  
  // Mock voice processing endpoint
  app.post('/api/voice/process', (req: any, res: any) => {
    const { audio_data, user_id, metadata } = req.body;
    
    setTimeout(() => {
      res.json({
        id: `voice_${Date.now()}`,
        transcription: 'This is a test transcription',
        user_id,
        metadata: { ...metadata, processed_at: new Date().toISOString() },
        confidence: 0.92,
        language: 'en'
      });
    }, 200);
  });
  
  // Health check
  app.get('/health', (req: any, res: any) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  const server = app.listen(TEST_CONFIG.AI_SERVICES_PORT, () => {
    console.log(`Mock AI services running on port ${TEST_CONFIG.AI_SERVICES_PORT}`);
  });
  
  return server;
}

export { TEST_CONFIG, testSocket };
