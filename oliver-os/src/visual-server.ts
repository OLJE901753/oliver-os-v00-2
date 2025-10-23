/**
 * Oliver-OS Visual Interface Server
 * Enhanced server with Socket.io for real-time visual interface
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { Logger } from './core/logger';
import { Config } from './core/config';

const logger = new Logger('Visual-Server');

// Mock data functions (replace with real implementation)
const getSystemStatus = () => ({
  processes: [
    { id: '1', name: 'Visual Interface', status: 'running', cpu: 25, memory: 512 },
    { id: '2', name: 'BMAD Engine', status: 'running', cpu: 10, memory: 128 },
    { id: '3', name: 'System Monitor', status: 'running', cpu: 15, memory: 256 },
    { id: '4', name: 'Neural Network', status: 'running', cpu: 35, memory: 1024 },
    { id: '5', name: 'Data Processor', status: 'running', cpu: 20, memory: 512 },
  ],
  services: [
    { id: 'deepfake', name: 'DeepFake Service', enabled: true, status: 'active' },
    { id: 'ai-core', name: 'AI Core', enabled: true, status: 'active' },
    { id: 'visual', name: 'Visual Interface', enabled: true, status: 'active' },
    { id: 'neural', name: 'Neural Network', enabled: true, status: 'active' },
  ],
  health: {
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    uptime: Date.now(),
    status: 'healthy',
  },
});

const generateLogMessage = () => {
  const messages = [
    'Neural pathways synchronized',
    'Data stream processing complete',
    'AI consciousness expanding',
    'System optimization in progress',
    'Deep learning algorithms active',
    'Visual cortex processing data',
    'Neural network training complete',
    'System status: All green',
    'Processing quantum data streams',
    'AI decision matrix updated',
  ];
  
  const levels = ['info', 'warn', 'debug', 'error'];
  
  return {
    timestamp: new Date().toISOString(),
    level: levels[Math.floor(Math.random() * levels.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
  };
};

export function createVisualServer() {
  const app = express();
  const httpServer = createServer(app);

  // Socket.io with CORS
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
      credentials: true,
    },
  });

  // Middleware
  app.use(helmet());
  app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173' }));
  app.use(express.json());

  // WebSocket handlers
  io.on('connection', (socket) => {
    logger.info('🎨 Visual interface connected:', socket.id);
    
    const statusInterval = setInterval(() => {
      socket.emit('system:status', getSystemStatus());
    }, parseInt(process.env.VISUAL_UPDATE_INTERVAL || '1000'));
    
    const logInterval = setInterval(() => {
      socket.emit('system:logs', generateLogMessage());
    }, 2000);
    
    socket.on('disconnect', () => {
      logger.info('Visual interface disconnected');
      clearInterval(statusInterval);
      clearInterval(logInterval);
    });
  });

  // API Routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok', ...getSystemStatus().health }));
  app.get('/api/processes', (req, res) => res.json({ processes: getSystemStatus().processes }));
  app.get('/api/services', (req, res) => res.json({ services: getSystemStatus().services }));
  app.get('/api/status', (req, res) => res.json(getSystemStatus()));

  // Serve React app in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
  }

  const PORT = process.env.PORT || 3000;
  
  return { app, httpServer, io, PORT };
}

// Start server if run directly
if (require.main === module) {
  const { httpServer, PORT } = createVisualServer();
  
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Oliver-OS Visual Interface running on :${PORT}`);
    logger.info(`📡 WebSocket server active`);
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`🎨 Frontend dev server: http://localhost:5173`);
    }
  });
}
