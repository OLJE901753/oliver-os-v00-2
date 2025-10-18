/**
 * MCP Server Configuration Manager
 * Handles MCP-specific configuration and validation
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { z } from 'zod';
import { Logger } from '../core/logger';

const mcpConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  server: z.object({
    name: z.string(),
    version: z.string(),
    description: z.string(),
    port: z.number(),
    host: z.string(),
    transports: z.object({
      stdio: z.object({
        enabled: z.boolean(),
        description: z.string()
      }),
      websocket: z.object({
        enabled: z.boolean(),
        port: z.number(),
        description: z.string()
      }),
      http: z.object({
        enabled: z.boolean(),
        port: z.number(),
        description: z.string()
      })
    })
  }),
  tools: z.object({
    'thought-processing': z.object({
      enabled: z.boolean(),
      tools: z.array(z.string())
    }),
    collaboration: z.object({
      enabled: z.boolean(),
      tools: z.array(z.string())
    }),
    bmad: z.object({
      enabled: z.boolean(),
      tools: z.array(z.string())
    }),
    system: z.object({
      enabled: z.boolean(),
      tools: z.array(z.string())
    })
  }),
  resources: z.object({
    'system-architecture': z.object({
      uri: z.string(),
      enabled: z.boolean(),
      description: z.string()
    }),
    'system-logs': z.object({
      uri: z.string(),
      enabled: z.boolean(),
      description: z.string()
    }),
    'current-config': z.object({
      uri: z.string(),
      enabled: z.boolean(),
      description: z.string()
    })
  }),
  integration: z.object({
    'ai-services': z.object({
      enabled: z.boolean(),
      endpoint: z.string(),
      timeout: z.number()
    }),
    database: z.object({
      enabled: z.boolean(),
      type: z.string(),
      timeout: z.number()
    }),
    websocket: z.object({
      enabled: z.boolean(),
      port: z.number(),
      timeout: z.number()
    })
  }),
  logging: z.object({
    level: z.string(),
    format: z.string(),
    includeTimestamp: z.boolean(),
    includeMetadata: z.boolean()
  }),
  security: z.object({
    authentication: z.object({
      enabled: z.boolean(),
      type: z.string(),
      secret: z.string()
    }),
    rateLimiting: z.object({
      enabled: z.boolean(),
      requestsPerMinute: z.number(),
      burstLimit: z.number()
    }),
    cors: z.object({
      enabled: z.boolean(),
      origins: z.array(z.string())
    })
  })
});

type MCPConfigType = z.infer<typeof mcpConfigSchema>;

export class MCPConfig {
  private config: MCPConfigType;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('MCP-Config');
    this.config = this.getDefaultConfig();
  }

  async load(): Promise<void> {
    try {
      // Load MCP config file
      await this.loadMCPConfigFile();
      
      // Validate configuration
      this.config = mcpConfigSchema.parse(this.config);
      
      this.logger.info('✅ MCP Configuration loaded successfully');
    } catch (error) {
      this.logger.error('❌ Failed to load MCP configuration', error);
      throw error;
    }
  }

  private async loadMCPConfigFile(): Promise<void> {
    const configPath = path.join(process.cwd(), 'mcp-config.json');
    
    if (await fs.pathExists(configPath)) {
      const configData = await fs.readJSON(configPath);
      this.config = { ...this.config, ...configData };
      this.logger.info('📄 Loaded MCP configuration file');
    } else {
      this.logger.warn('⚠️ No MCP configuration file found, using defaults');
    }
  }

  private getDefaultConfig(): MCPConfigType {
    return {
      name: 'oliver-os-mcp-server',
      version: '1.0.0',
      description: 'MCP Server for Oliver-OS AI-brain interface system',
      server: {
        name: 'oliver-os-mcp-server',
        version: '1.0.0',
        description: 'MCP Server for Oliver-OS AI-brain interface system',
        port: 4000,
        host: 'localhost',
        transports: {
          stdio: {
            enabled: true,
            description: 'Standard I/O transport for CLI integration'
          },
          websocket: {
            enabled: true,
            port: 4001,
            description: 'WebSocket transport for real-time communication'
          },
          http: {
            enabled: true,
            port: 4002,
            description: 'HTTP transport for REST API integration'
          }
        }
      },
      tools: {
        'thought-processing': {
          enabled: true,
          tools: [
            'analyze_thought_patterns',
            'enhance_thought',
            'generate_thought_connections',
            'stream_thought_processing'
          ]
        },
        collaboration: {
          enabled: true,
          tools: [
            'get_workspace_status',
            'join_workspace',
            'leave_workspace',
            'share_thought',
            'get_collaboration_history',
            'create_workspace',
            'sync_workspace_state'
          ]
        },
        bmad: {
          enabled: true,
          tools: [
            'bmad_break',
            'bmad_map',
            'bmad_automate',
            'bmad_document',
            'bmad_analyze',
            'bmad_validate'
          ]
        },
        system: {
          enabled: true,
          tools: [
            'get_system_status',
            'process_thought',
            'get_agent_status',
            'spawn_agent',
            'get_collaboration_data',
            'execute_bmad_command'
          ]
        }
      },
      resources: {
        'system-architecture': {
          uri: 'oliver-os://system/architecture',
          enabled: true,
          description: 'Current Oliver-OS system architecture and component relationships'
        },
        'system-logs': {
          uri: 'oliver-os://logs/system',
          enabled: true,
          description: 'Recent system logs and error reports'
        },
        'current-config': {
          uri: 'oliver-os://config/current',
          enabled: true,
          description: 'Current system configuration and environment settings'
        }
      },
      integration: {
        'ai-services': {
          enabled: true,
          endpoint: 'http://localhost:8000',
          timeout: 30000
        },
        database: {
          enabled: true,
          type: 'supabase',
          timeout: 10000
        },
        websocket: {
          enabled: true,
          port: 3000,
          timeout: 5000
        }
      },
      logging: {
        level: 'info',
        format: 'json',
        includeTimestamp: true,
        includeMetadata: true
      },
      security: {
        authentication: {
          enabled: false,
          type: 'jwt',
          secret: 'your-secret-key'
        },
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 100,
          burstLimit: 20
        },
        cors: {
          enabled: true,
          origins: ['http://localhost:3000', 'http://localhost:4000']
        }
      }
    };
  }

  get<K extends keyof MCPConfigType>(key: K): MCPConfigType[K] {
    return this.config[key];
  }

  getAll(): MCPConfigType {
    return { ...this.config };
  }

  getEnabledTools(): string[] {
    const enabledTools: string[] = [];
    
    Object.entries(this.config.tools).forEach(([_category, config]) => {
      if (config.enabled) {
        enabledTools.push(...config.tools);
      }
    });
    
    return enabledTools;
  }

  getEnabledResources(): Array<{ uri: string; description: string }> {
    const enabledResources: Array<{ uri: string; description: string }> = [];
    
    Object.entries(this.config.resources).forEach(([_key, config]) => {
      if (config.enabled) {
        enabledResources.push({
          uri: config.uri,
          description: config.description
        });
      }
    });
    
    return enabledResources;
  }

  isTransportEnabled(transport: 'stdio' | 'websocket' | 'http'): boolean {
    return this.config.server.transports[transport].enabled;
  }

  getTransportPort(transport: 'stdio' | 'websocket' | 'http'): number {
    if (transport === 'stdio') {
      return 0; // STDIO doesn't use a port
    }
    return this.config.server.transports[transport].port;
  }
}
