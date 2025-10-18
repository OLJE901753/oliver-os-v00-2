/**
 * Oliver-OS Configuration Manager
 * Handles environment-aware configuration with validation
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { z } from 'zod';
import { Logger } from './logger';

const configSchema = z.object({
  port: z.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  cors: z.object({
    origin: z.array(z.string()).default(['http://localhost:3000'])
  }).default(() => ({ origin: ['http://localhost:3000'] })),
  version: z.string().default('0.0.2'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  codebuff: z.object({
    apiKey: z.string().default(''),
    timeout: z.number().default(300000),
    retries: z.number().default(3),
    maxConcurrentAgents: z.number().default(10),
    defaultModel: z.string().default('openai/gpt-4'),
    enableMetrics: z.boolean().default(true)
  }).default(() => ({
    apiKey: '',
    timeout: 300000,
    retries: 3,
    maxConcurrentAgents: 10,
    defaultModel: 'openai/gpt-4',
    enableMetrics: true
  }))
});

type ConfigType = z.infer<typeof configSchema>;

export class Config {
  private config: ConfigType;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('Config');
    this.config = this.getDefaultConfig();
  }

  async load(): Promise<void> {
    try {
      // Load environment variables
      await this.loadEnvironment();
      
      // Load config file if exists
      await this.loadConfigFile();
      
      // Validate configuration
      this.config = configSchema.parse(this.config);
      
      this.logger.info('✅ Configuration loaded successfully');
    } catch (error) {
      this.logger.error('❌ Failed to load configuration', error);
      throw error;
    }
  }

  private async loadEnvironment(): Promise<void> {
    const envFile = process.env['NODE_ENV'] === 'production' ? '.env.production' : '.env.local';
    
    if (await fs.pathExists(envFile)) {
      require('dotenv').config({ path: envFile });
      this.logger.info(`📄 Loaded environment from ${envFile}`);
    }
  }

  private async loadConfigFile(): Promise<void> {
    const configPath = path.join(process.cwd(), 'config.json');
    
    if (await fs.pathExists(configPath)) {
      const configData = await fs.readJSON(configPath);
      this.config = { ...this.config, ...configData };
      this.logger.info('📄 Loaded configuration file');
    }
  }

  private getDefaultConfig(): ConfigType {
    return {
      port: parseInt(process.env['PORT'] || '3000', 10),
      nodeEnv: (process.env['NODE_ENV'] as any) || 'development',
      cors: {
        origin: process.env['CORS_ORIGIN'] ? process.env['CORS_ORIGIN'].split(',') : ['http://localhost:3000']
      },
      version: process.env['VERSION'] || '0.0.2',
      logLevel: (process.env['LOG_LEVEL'] as any) || 'info',
      codebuff: {
        apiKey: process.env['CODEBUFF_API_KEY'] || '',
        timeout: parseInt(process.env['CODEBUFF_TIMEOUT'] || '300000', 10),
        retries: parseInt(process.env['CODEBUFF_RETRIES'] || '3', 10),
        maxConcurrentAgents: parseInt(process.env['CODEBUFF_MAX_AGENTS'] || '10', 10),
        defaultModel: process.env['CODEBUFF_DEFAULT_MODEL'] || 'openai/gpt-4',
        enableMetrics: process.env['CODEBUFF_ENABLE_METRICS'] !== 'false'
      }
    };
  }

  get<K extends keyof ConfigType>(key: K): ConfigType[K];
  get<T = any>(key: string, defaultValue?: T): T;
  get(key: string, defaultValue?: any): any {
    const keys = key.split('.');
    let value: any = this.config;
    for (const k of keys) {
      value = value?.[k];
    }
    return value !== undefined ? value : defaultValue;
  }

  set<K extends keyof ConfigType>(key: K, value: ConfigType[K]): void;
  set(key: string, value: any): void;
  set(key: string, value: any): void {
    const keys = key.split('.');
    let target: any = this.config;
    
    // Navigate to the parent of the target key
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!k) continue;
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k] as any;
    }
    
    // Set the final value
    const finalKey = keys[keys.length - 1];
    if (finalKey) {
      target[finalKey] = value;
    }
  }

  getAll(): ConfigType {
    return { ...this.config };
  }
}
