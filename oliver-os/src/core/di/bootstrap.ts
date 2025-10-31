/**
 * Service Bootstrap
 * Sets up DI container with all service registrations
 */

import { DIContainer } from './container';
import { Config } from '../config';
import { Logger } from '../logger';
import { MinimaxProvider } from '../../services/llm/minimax-provider';
import { KnowledgeGraphService } from '../../services/knowledge/knowledge-graph-service';
import { CaptureMemoryService } from '../../services/memory/capture/capture-memory-service';
import { ThoughtOrganizerService } from '../../services/organizer/organizer-service';
import { BusinessIdeaStructurer } from '../../services/organizer/business-structurer';
import { AssistantService } from '../../services/assistant/assistant-service';
import { AgentManager } from '../../services/agent-manager';
import { GitHubMCPServer } from '../../mcp/servers/github';
import { DatabaseMCPServer } from '../../mcp/servers/database';
import { PrismaClient } from '@prisma/client';
import * as ServiceIds from './service-identifiers';

/**
 * Bootstrap DI container with all services
 */
export async function bootstrapContainer(container: DIContainer): Promise<void> {
  const logger = new Logger('DIBootstrap');
  logger.info('🚀 Bootstrapping DI container...');

  // Register core services first
  container.registerInstance(ServiceIds.CONFIG, new Config());
  container.registerInstance(ServiceIds.LOGGER, new Logger('Global'));

  // Register Config and Logger factories for context-specific instances
  container.register(ServiceIds.CONFIG, () => container.get(ServiceIds.CONFIG));
  container.register(ServiceIds.LOGGER, (c) => {
    const baseLogger = c.get<Logger>(ServiceIds.LOGGER);
    return baseLogger; // Return base logger or create context-specific logger
  });

  // Register Database (Prisma)
  container.register(
    ServiceIds.DATABASE,
    async () => {
      const prisma = new PrismaClient();
      await prisma.$connect();
      logger.info('✅ Database connected via DI');
      return prisma;
    },
    { singleton: true }
  );

  // Register MinimaxProvider
  container.register(
    ServiceIds.MINIMAX_PROVIDER,
    async (c) => {
      const config = c.get<Config>(ServiceIds.CONFIG);
      const minimaxConfig = config.get('minimax') as {
        apiKey: string;
        baseURL?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
      };

      if (!minimaxConfig?.apiKey) {
        throw new Error('Minimax API key not configured');
      }

      return new MinimaxProvider({
        apiKey: minimaxConfig.apiKey,
        baseURL: minimaxConfig.baseURL,
        model: minimaxConfig.model,
        temperature: minimaxConfig.temperature,
        maxTokens: minimaxConfig.maxTokens,
      });
    },
    { 
      singleton: true,
      dependencies: [ServiceIds.CONFIG]
    }
  );

  // Register KnowledgeGraphService
  container.register(
    ServiceIds.KNOWLEDGE_GRAPH_SERVICE,
    async (c) => {
      const config = c.get<Config>(ServiceIds.CONFIG);
      const service = new KnowledgeGraphService(config);
      await service.initialize();
      return service;
    },
    { 
      singleton: true,
      dependencies: [ServiceIds.CONFIG]
    }
  );

  // Register CaptureMemoryService
  container.register(
    ServiceIds.CAPTURE_MEMORY_SERVICE,
    async (c) => {
      const config = c.get<Config>(ServiceIds.CONFIG);
      const service = new CaptureMemoryService(config);
      await service.initialize();
      return service;
    },
    { 
      singleton: true,
      dependencies: [ServiceIds.CONFIG]
    }
  );

  // Register ThoughtOrganizerService
  container.register(
    ServiceIds.THOUGHT_ORGANIZER_SERVICE,
    async (c) => {
      const config = c.get<Config>(ServiceIds.CONFIG);
      const knowledgeGraph = await c.resolve(ServiceIds.KNOWLEDGE_GRAPH_SERVICE);
      const memoryService = await c.resolve(ServiceIds.CAPTURE_MEMORY_SERVICE);
      const llmProvider = await c.resolve(ServiceIds.MINIMAX_PROVIDER);
      
      return new ThoughtOrganizerService(
        config,
        knowledgeGraph,
        memoryService,
        llmProvider
      );
    },
    {
      singleton: true,
      dependencies: [
        ServiceIds.CONFIG,
        ServiceIds.KNOWLEDGE_GRAPH_SERVICE,
        ServiceIds.CAPTURE_MEMORY_SERVICE,
        ServiceIds.MINIMAX_PROVIDER
      ]
    }
  );

  // Register BusinessIdeaStructurer
  container.register(
    ServiceIds.BUSINESS_STRUCTURER,
    async (c) => {
      const llmProvider = await c.resolve(ServiceIds.MINIMAX_PROVIDER);
      const knowledgeGraph = await c.resolve(ServiceIds.KNOWLEDGE_GRAPH_SERVICE);
      
      return new BusinessIdeaStructurer(llmProvider, knowledgeGraph);
    },
    {
      singleton: true,
      dependencies: [ServiceIds.MINIMAX_PROVIDER, ServiceIds.KNOWLEDGE_GRAPH_SERVICE]
    }
  );

  // Register AssistantService
  container.register(
    ServiceIds.ASSISTANT_SERVICE,
    async (c) => {
      const config = c.get<Config>(ServiceIds.CONFIG);
      const knowledgeGraph = await c.resolve(ServiceIds.KNOWLEDGE_GRAPH_SERVICE);
      const llmProvider = await c.resolve(ServiceIds.MINIMAX_PROVIDER);
      
      return new AssistantService(config, knowledgeGraph, llmProvider);
    },
    {
      singleton: true,
      dependencies: [
        ServiceIds.CONFIG,
        ServiceIds.KNOWLEDGE_GRAPH_SERVICE,
        ServiceIds.MINIMAX_PROVIDER
      ]
    }
  );

  // Register AgentManager
  container.register(
    ServiceIds.AGENT_MANAGER,
    async (c) => {
      const config = c.get<Config>(ServiceIds.CONFIG);
      const manager = new AgentManager(config);
      await manager.initialize();
      return manager;
    },
    {
      singleton: true,
      dependencies: [ServiceIds.CONFIG]
    }
  );

  // Register GitHub MCP Server
  container.register(
    ServiceIds.GITHUB_MCP_SERVER,
    async () => {
      const token = process.env['GITHUB_TOKEN'] || process.env['GITHUB_API_TOKEN'];
      return new GitHubMCPServer(token);
    },
    { singleton: true }
  );

  // Register Database MCP Server
  container.register(
    ServiceIds.DATABASE_MCP_SERVER,
    async () => {
      const supabaseUrl = process.env['SUPABASE_URL'];
      const supabaseKey = process.env['SUPABASE_KEY'];
      return new DatabaseMCPServer(supabaseUrl, supabaseKey);
    },
    { singleton: true }
  );

  logger.info('✅ DI container bootstrapped');
}

/**
 * Initialize all services in dependency order
 */
export async function initializeServices(container: DIContainer): Promise<void> {
  const logger = new Logger('ServiceInitializer');
  logger.info('🚀 Initializing all services...');

  try {
    await container.initialize();
    logger.info('✅ All services initialized');
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

