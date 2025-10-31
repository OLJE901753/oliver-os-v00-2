/**
 * Architecture Configuration Manager
 * Handles loading, saving, and default configuration for architecture improvements
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../../../core/logger';
import type { ArchitectureConfig } from '../types';

export class ArchitectureConfigManager {
  private _logger: Logger;
  private configPath: string;

  constructor() {
    this._logger = new Logger('ArchitectureConfigManager');
    this.configPath = path.join(process.cwd(), 'architecture-improvement-config.json');
  }

  /**
   * Get default architecture configuration
   */
  getDefaultConfig(): ArchitectureConfig {
    return {
      enabled: true,
      analysis: {
        enabled: true,
        interval: 300000, // 5 minutes
        depth: 'medium'
      },
      suggestions: {
        enabled: true,
        categories: {
          scalability: true,
          maintainability: true,
          performance: true,
          security: true,
          reliability: true,
          flexibility: true
        }
      },
      implementation: {
        enabled: true,
        autoApply: false,
        approvalRequired: true
      },
      learning: {
        enabled: true,
        adaptationRate: 0.1,
        historyWeight: 0.3
      }
    };
  }

  /**
   * Load architecture configuration from file
   */
  async loadConfig(): Promise<ArchitectureConfig> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const config = await fs.readJson(this.configPath);
        this._logger.info('📋 Architecture improvement configuration loaded');
        return config as ArchitectureConfig;
      } else {
        const defaultConfig = this.getDefaultConfig();
        await this.saveConfig(defaultConfig);
        this._logger.info('📋 Using default architecture improvement configuration');
        return defaultConfig;
      }
    } catch (error) {
      this._logger.warn('Failed to load architecture improvement configuration, using defaults');
      return this.getDefaultConfig();
    }
  }

  /**
   * Save architecture configuration to file
   */
  async saveConfig(config: ArchitectureConfig): Promise<void> {
    try {
      await fs.writeJson(this.configPath, config, { spaces: 2 });
      this._logger.info('💾 Architecture improvement configuration saved');
    } catch (error) {
      this._logger.error('Failed to save architecture improvement configuration:', error);
      throw error;
    }
  }
}

