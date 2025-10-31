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
  })),
  minimax: z.object({
    apiKey: z.string().default(''),
    baseURL: z.string().default('https://api.minimax.io/v1'),
    model: z.string().default('MiniMax-M2'),
    temperature: z.number().default(0.7),
    maxTokens: z.number().default(1024)
  }).default(() => ({
    apiKey: '',
    baseURL: 'https://api.minimax.io/v1',
    model: 'MiniMax-M2',
    temperature: 0.7,
    maxTokens: 1024
  }))
});

type ConfigType = z.infer<typeof configSchema>;

export class Config {
  private config: ConfigType;
  private _logger: Logger;

  constructor() {
    this._logger = new Logger('Config');
    this.config = this.getDefaultConfig();
  }

  async load(): Promise<void> {
    try {
      await this.loadEnvironment().catch((error) => {
        this._logger.error('❌ Failed to load environment', error);
        throw new Error(`Environment loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      });
      await this.loadConfigFile().catch((error) => {
        this._logger.error('❌ Failed to load config file', error);
        throw new Error(`Config file loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      });
      this.config = configSchema.parse(this.config);
      this._logger.info('✅ Configuration loaded successfully');
    } catch (error) {
      this._logger.error('❌ Failed to load configuration', error);
      throw new Error(`Configuration loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async loadEnvironment(): Promise<void> {
    try {
      const envFile = process.env['NODE_ENV'] === 'production' ? '.env.production' : '.env.local';
      const pathExists = await fs.pathExists(envFile).catch((error) => {
        this._logger.warn(`⚠️ Could not check path for environment file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
      });
      
      if (pathExists) {
        require('dotenv').config({ path: envFile });
        this._logger.info(`📄 Loaded environment from ${envFile}`);
      }
    } catch (error) {
      this._logger.warn(`⚠️ Could not load environment file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue without environment file
    }
  }

  private async loadConfigFile(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'config.json');
      const pathExists = await fs.pathExists(configPath).catch((error) => {
        this._logger.warn(`⚠️ Could not check path for config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
      });
      
      if (pathExists) {
        const configData = await fs.readJSON(configPath).catch((error) => {
          this._logger.warn(`⚠️ Could not read config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return null;
        });
        
        if (configData) {
          this.config = { ...this.config, ...configData };
          this._logger.info('📄 Loaded configuration file');
        }
      }
    } catch (error) {
      this._logger.warn(`⚠️ Could not load config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue without config file
    }
  }

  private getDefaultConfig(): ConfigType {
    return {
      port: parseInt(process.env['PORT'] || '3000', 10),
      nodeEnv: (process.env['NODE_ENV'] as 'development' | 'production' | 'test') || 'development',
      cors: {
        origin: process.env['CORS_ORIGIN'] ? process.env['CORS_ORIGIN'].split(',') : ['http://localhost:3000']
      },
      version: process.env['VERSION'] || '0.0.2',
      logLevel: (process.env['LOG_LEVEL'] as 'error' | 'warn' | 'info' | 'debug') || 'info',
      codebuff: {
        apiKey: process.env['CODEBUFF_API_KEY'] || '',
        timeout: parseInt(process.env['CODEBUFF_TIMEOUT'] || '300000', 10),
        retries: parseInt(process.env['CODEBUFF_RETRIES'] || '3', 10),
        maxConcurrentAgents: parseInt(process.env['CODEBUFF_MAX_AGENTS'] || '10', 10),
        defaultModel: process.env['CODEBUFF_DEFAULT_MODEL'] || 'openai/gpt-4',
        enableMetrics: process.env['CODEBUFF_ENABLE_METRICS'] !== 'false'
      },
      minimax: {
        apiKey: process.env['MINIMAX_API_KEY'] || '',
        baseURL: process.env['MINIMAX_BASE_URL'] || 'https://api.minimax.io/v1',
        model: process.env['MINIMAX_MODEL'] || 'MiniMax-M2',
        temperature: parseFloat(process.env['MINIMAX_TEMPERATURE'] || '0.7'),
        maxTokens: parseInt(process.env['MINIMAX_MAX_TOKENS'] || '1024', 10)
      }
    };
  }

  get(key: string, defaultValue?: unknown): unknown {
    const keys = key.split('.');
    let value: unknown = this.config;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value !== undefined ? value : defaultValue;
  }

  set(key: string, value: unknown): void {
    const keys = key.split('.');
    let target: Record<string, unknown> = this.config as Record<string, unknown>;
    
    // Navigate to the parent of the target key (optimized with reduce)
    const parentKeys = keys.slice(0, -1);
    target = parentKeys.reduce((current, k) => {
      if (!k) return current;
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      return current[k] as Record<string, unknown>;
    }, target);
    
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
