/**
 * Oliver-OS - Main Entry Point
 * For the honor, not the glory—by the people, for the people.
 * 
 * A rebellious operating system designed to disrupt bureaucracy
 * through clean, efficient microservices architecture.
 */

import { createServer } from './core/server';
import { Logger } from './core/logger';
import { Config } from './core/config';
import { ServiceManager } from './services/service-manager';
import { ProcessManager } from './core/process-manager';
import { BureaucracyDisruptorService } from './services/bureaucracy-disruptor';

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
    
    // Create and start server
    const server = createServer(config, serviceManager);
    const port = config.get('port', 3000);
    
    server.listen(port, () => {
      logger.info(`🎯 Oliver-OS running on port ${port}`);
      logger.info('🔥 Ready to disrupt bureaucracy with clean code!');
      
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
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('🛑 Shutting down Oliver-OS...');
      
      await serviceManager.shutdown();
      await processManager.shutdown();
      
      server.close(() => {
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
