/**
 * Simple Oliver-OS Backend Server
 * Minimal server for testing
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Oliver-OS Backend Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '0.0.2'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/auth/test', (req, res) => {
  res.json({
    message: 'Authentication system ready',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/refresh',
      'POST /api/auth/logout',
      'GET /api/auth/profile'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Oliver-OS Backend Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth test: http://localhost:${PORT}/api/auth/test`);
});
