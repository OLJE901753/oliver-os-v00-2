/**
 * Oliver-OS - Main Entry Point
 * For the honor, not the glory—by the people, for the people.
 * 
 * A rebellious operating system designed to disrupt bureaucracy
 * through clean, efficient microservices architecture.
 */

import { createHttpServerWithWebSocket } from './core/server';
import { Logger } from './core/logger';
import { Config } from './core/config';
import { ServiceManager } from './services/service-manager';
import { ProcessManager } from './core/process-manager';
import { BureaucracyDisruptorService } from './services/bureaucracy-disruptor';
import { PrismaClient } from '@prisma/client';

const logger = new Logger('Oliver-OS');
const config = new Config();

/**
 * Initialize Oliver-OS
 */
async function initialize(): Promise<void> {
  try {
    logger.info('🚀 Initializing Oliver-OS...');
    
    // Load configuration
    await config.load();
    logger.info('✅ Configuration loaded');
    
    // Initialize database
    const prisma = new PrismaClient();
    await prisma.$connect();
    logger.info('✅ Database connected');
    
    // Initialize service manager
    const serviceManager = new ServiceManager(config);
    await serviceManager.initialize();
    logger.info('✅ Services initialized');
    
    // Initialize process manager
    const processManager = new ProcessManager(config);
    await processManager.initialize();
    logger.info('✅ Process manager initialized');
    
    // Initialize bureaucracy disruptor service
    const disruptorService = new BureaucracyDisruptorService(config);
    await disruptorService.initialize();
    logger.info('✅ Bureaucracy disruptor service initialized');
    
    // Create and start server with WebSocket support
    const { httpServer, wsManager } = createHttpServerWithWebSocket(config, serviceManager, prisma);
    const port = config.get('port', 3000);
    
    httpServer.listen(port, () => {
      logger.info(`🎯 Oliver-OS running on port ${port}`);
      logger.info('🔥 Ready to disrupt bureaucracy with clean code!');
      logger.info('🌐 WebSocket server enabled for real-time communication');
      
      // Log available endpoints
      logger.info('📡 Available endpoints:');
      logger.info(`   GET  /api/health - System health check`);
      logger.info(`   GET  /api/services - List active services`);
      logger.info(`   GET  /api/processes - List running processes`);
      logger.info(`   POST /api/processes - Start new process`);
      logger.info(`   GET  /api/status - System status`);
      logger.info(`   GET  /api/disruptor - Bureaucracy disruption status`);
      logger.info(`   GET  /api/agents - List available agent types`);
      logger.info(`   POST /api/agents/spawn - Spawn a new agent`);
      logger.info(`   POST /api/agents/spawn-multiple - Spawn multiple agents`);
      logger.info(`   POST /api/auth/register - Register new user`);
      logger.info(`   POST /api/auth/login - Login user`);
      logger.info(`   POST /api/auth/refresh - Refresh access token`);
      logger.info(`   POST /api/auth/logout - Logout user`);
      logger.info(`   GET  /api/auth/me - Get current user info`);
      logger.info('🔌 WebSocket endpoints:');
      logger.info(`   WS   /ws/{client_id} - Real-time communication`);
      logger.info(`   Events: thought:create, thought:analyze, collaboration:event, agent:spawn, voice:data`);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('🛑 Shutting down Oliver-OS...');
      
      await serviceManager.shutdown();
      await processManager.shutdown();
      await wsManager.shutdown();
      await prisma.$disconnect();
      
      httpServer.close(() => {
        logger.info('✅ Oliver-OS shutdown complete');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('❌ Failed to initialize Oliver-OS:', error);
    process.exit(1);
  }
}

// Start the system
initialize().catch((error) => {
  logger.error('💥 Critical error during initialization:', error);
  process.exit(1);
});
