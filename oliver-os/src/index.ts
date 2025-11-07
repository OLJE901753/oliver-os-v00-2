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
import { MonitoringService } from './services/monitoring-service';
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
    
    // Validate API accounts and configurations
    try {
      const { ApiValidator } = await import('./core/api-validation');
      const validator = new ApiValidator(config);
      const report = await validator.validate();
      validator.logReport(report);
      
      if (report.errors.length > 0) {
        logger.warn('⚠️  Some configuration issues detected - check the validation report above');
        logger.warn('💡 Run "pnpm setup:api-accounts" to fix configuration issues');
      }
    } catch (error) {
      const meta = error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { value: String(error) };
      logger.warn('⚠️  Could not validate API accounts:', { error: meta });
      // Don't fail startup if validation fails
    }
    
    // Initialize database (skip if SKIP_DB_INIT is set)
    let prisma: PrismaClient | null = null;
    if (!process.env['SKIP_DB_INIT']) {
      prisma = new PrismaClient();
      await prisma.$connect();
      logger.info('✅ Database connected');
    } else {
      logger.info('⚠️ Database initialization skipped (SKIP_DB_INIT=true)');
    }
    
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
    
    // Initialize monitoring service
    const monitoringService = new MonitoringService();
    logger.info('✅ Monitoring service initialized');
    
    // Create and start server with WebSocket support
    const { httpServer, wsManager } = createHttpServerWithWebSocket(
      config, 
      serviceManager, 
      prisma as PrismaClient,
      processManager,
      disruptorService
    );
    
    // Connect monitoring service to WebSocket manager
    wsManager.setMonitoringService(monitoringService);
    
    const port = config.get('port', 3000);
    
    httpServer.listen(port, () => {
      logger.info(`🎯 Oliver-OS running on port ${port}`);
      logger.info('🔥 Ready to disrupt bureaucracy with clean code!');
      logger.info('🌐 WebSocket server enabled for real-time communication');
      
      // Open browser automatically
      import('child_process').then(({ exec }) => {
        const url = `http://localhost:${port}`;
        exec(`start firefox ${url}`, (error: unknown) => {
          if (error) {
            // Fallback to default browser if Firefox is not available
            exec(`start ${url}`, (fallbackError: unknown) => {
              if (fallbackError) {
                logger.info(`🌐 Server running at ${url}`);
              }
            });
          }
        });
      });
      
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
      logger.info(`   POST /api/unified/route - Unified routing (Python agent → Monster Mode)`);
      logger.info(`   GET  /api/unified/status - Unified router status`);
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
      
      if (prisma) {
        await prisma.$disconnect();
        logger.info('✅ Database disconnected');
      }
      
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
