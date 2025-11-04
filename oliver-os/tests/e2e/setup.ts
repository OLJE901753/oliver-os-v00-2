/**
 * End-to-End Test Setup
 * Configures the test environment for full system testing
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { io, Socket } from 'socket.io-client';
import net from 'net';

// Helper function to check if port is available
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// Helper function to kill process on port
async function killProcessOnPort(port: number): Promise<void> {
  try {
    if (process.platform === 'win32') {
      execSync(`netstat -ano | findstr :${port}`, { stdio: 'ignore' });
      // Try to kill any process using the port
      execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`, { stdio: 'ignore' });
    } else {
      const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf-8' }).trim();
      if (pid) {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      }
    }
    // Wait a bit for port to be released
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    // Ignore errors - port might not be in use
  }
}

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
      
      // Check if port is available, kill existing process if needed
      const portAvailable = await isPortAvailable(TEST_CONFIG.BACKEND_PORT);
      if (!portAvailable) {
        console.log(`Port ${TEST_CONFIG.BACKEND_PORT} is in use, attempting to free it...`);
        await killProcessOnPort(TEST_CONFIG.BACKEND_PORT);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for port to be released
      }

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Failed to start server on port ${TEST_CONFIG.BACKEND_PORT} within 10 seconds`));
        }, 10000);

        backendServer.listen(TEST_CONFIG.BACKEND_PORT, () => {
          clearTimeout(timeout);
          console.log(`✅ Backend server running on port ${TEST_CONFIG.BACKEND_PORT}`);
          resolve();
        });

        backendServer.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            clearTimeout(timeout);
            reject(new Error(`Port ${TEST_CONFIG.BACKEND_PORT} is already in use. Please stop the existing server.`));
          } else {
            clearTimeout(timeout);
            reject(error);
          }
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
