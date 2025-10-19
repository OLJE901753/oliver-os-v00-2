/**
 * Enhanced BMAD Configuration Manager
 * Unified configuration system with environment-specific overrides
 */

import * as fs from 'fs-extra';
import { BMADConfig, EnvironmentConfig, ProjectType } from '../types/bmad';

export interface EnhancedBMADConfig extends BMADConfig {
  environments: {
    development: EnvironmentConfig;
    testing: EnvironmentConfig;
    staging: EnvironmentConfig;
    production: EnvironmentConfig;
  };
  projectType: ProjectType;
  integrations: {
    mcp: boolean;
    codebuff: boolean;
    aiServices: boolean;
    collaboration: boolean;
    github: boolean;
    docker: boolean;
    ci: boolean;
  };
  automation: {
    autoCommit: boolean;
    autoTest: boolean;
    autoDeploy: boolean;
    qualityGates: boolean;
    codeReview: boolean;
    dependencyUpdates: boolean;
  };
  metrics: {
    tracking: boolean;
    reporting: boolean;
    dashboards: boolean;
    alerts: boolean;
    retention: number;
  };
}

export class EnhancedConfigManager {
  private configPath: string;
  private config: EnhancedBMADConfig | null = null;
  private environment: string;

  constructor(configPath?: string, environment?: string) {
    this.configPath = configPath || './bmad-config.json';
    this.environment = environment || process.env['NODE_ENV'] || 'development';
  }

  /**
   * Load configuration with environment-specific overrides
   */
  async loadConfig(): Promise<EnhancedBMADConfig> {
    try {
      // Load base configuration
      const baseConfig = await this.loadBaseConfig();
      
      // Load environment-specific overrides
      const envOverrides = await this.loadEnvironmentOverrides();
      
      // Merge configurations
      this.config = this.mergeConfigurations(baseConfig, envOverrides);
      
      // Validate final configuration
      this.validateConfig(this.config);
      
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load BMAD configuration: ${error}`);
    }
  }

  /**
   * Create project-specific BMAD configuration
   */
  async createProjectConfig(projectType: ProjectType, options: any): Promise<void> {
    const config = this.generateProjectConfig(projectType, options);
    
    // Write base config
    await fs.writeJSON(this.configPath, config, { spaces: 2 });
    
    // Create environment-specific configs
    await this.createEnvironmentConfigs(config);
    
    // Create project structure
    await this.createProjectStructure(projectType);
    
    this.logger.info(`✅ Created BMAD configuration for ${projectType} project`);
  }

  /**
   * Generate configuration based on project type
   */
  private generateProjectConfig(projectType: ProjectType, options: any): EnhancedBMADConfig {
    const baseConfig = this.getBaseConfig();
    
    switch (projectType) {
      case 'ai-brain-interface':
        return this.generateAIBrainConfig(baseConfig, options);
      case 'microservices':
        return this.generateMicroservicesConfig(baseConfig, options);
      case 'fullstack':
        return this.generateFullstackConfig(baseConfig, options);
      case 'api-only':
        return this.generateAPIConfig(baseConfig, options);
      default:
        return baseConfig;
    }
  }

  /**
   * Generate AI-brain interface specific configuration
   */
  private generateAIBrainConfig(baseConfig: EnhancedBMADConfig, options: any): EnhancedBMADConfig {
    return {
      ...baseConfig,
      projectType: 'ai-brain-interface',
      bmadMethod: {
        break: {
          taskDecomposition: {
            enabled: true,
            maxTaskSize: "2-4 hours",
            breakdownCriteria: [
              'AI-brain interface component',
              'Real-time collaboration feature',
              'Thought processing service',
              'Knowledge graph node',
              'Mind visualization element'
            ]
          },
          codeAnalysis: {
            enabled: true,
            dependencyMapping: true,
            complexityThreshold: 15,
            fileSizeLimit: 300
          }
        },
        map: {
          architecture: {
            enabled: true,
            visualization: true,
            dependencyGraph: true,
            serviceMapping: true
          },
          navigation: {
            symbolSearch: true,
            fileRelationships: true,
            codeFlowAnalysis: true
          }
        },
        automate: {
          codeGeneration: {
            enabled: true,
            boilerplateReduction: true,
            patternRecognition: true,
            refactoringSuggestions: true
          },
          processes: {
            testGeneration: true,
            documentationGeneration: true,
            errorHandling: true,
            validationRules: true
          }
        },
        document: {
          inlineDocumentation: {
            enabled: true,
            autoGenerate: true,
            includeExamples: true,
            updateOnChange: true
          },
          testing: {
            unitTests: true,
            integrationTests: true,
            errorCaseTests: true,
            coverageTracking: true
          }
        }
      },
      integrations: {
        mcp: true,
        codebuff: true,
        aiServices: true,
        collaboration: true,
        github: false,
        docker: false,
        ci: false
      },
      automation: {
        autoCommit: true,
        autoTest: true,
        autoDeploy: false,
        qualityGates: true,
        codeReview: true,
        dependencyUpdates: false
      }
    };
  }

  /**
   * Get current environment configuration
   */
  getCurrentEnvironmentConfig(): EnvironmentConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config.environments[this.environment as keyof typeof this.config.environments];
  }

  /**
   * Update configuration dynamically
   */
  async updateConfig(updates: Partial<EnhancedBMADConfig>): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    this.config = { ...this.config, ...updates };
    await fs.writeJSON(this.configPath, this.config, { spaces: 2 });
    
    this.logger.info('✅ Configuration updated successfully');
  }

  private async loadBaseConfig(): Promise<EnhancedBMADConfig> {
    if (!await fs.pathExists(this.configPath)) {
      return this.getBaseConfig();
    }
    
    const configData = await fs.readJSON(this.configPath);
    return configData as EnhancedBMADConfig;
  }

  private async loadEnvironmentOverrides(): Promise<Partial<EnhancedBMADConfig>> {
    const envConfigPath = this.configPath.replace('.json', `-${this.environment}.json`);
    
    if (await fs.pathExists(envConfigPath)) {
      return await fs.readJSON(envConfigPath);
    }
    
    return {};
  }

  private mergeConfigurations(base: EnhancedBMADConfig, overrides: Partial<EnhancedBMADConfig>): EnhancedBMADConfig {
    // Deep merge configuration objects
    return this.deepMerge(base, overrides) as EnhancedBMADConfig;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private validateConfig(config: EnhancedBMADConfig): void {
    if (!config.bmadMethod || !config.workflow || !config.preferences) {
      throw new Error('Invalid BMAD configuration structure');
    }
    
    if (!config.environments || !config.projectType) {
      throw new Error('Missing required configuration sections');
    }
  }

  private getBaseConfig(): EnhancedBMADConfig {
    return {
      bmadMethod: {
        break: {
          taskDecomposition: {
            enabled: true,
            maxTaskSize: "2-4 hours",
            breakdownCriteria: [
              "Single responsibility",
              "Testable unit",
              "Clear input/output",
              "Independent functionality"
            ]
          },
          codeAnalysis: {
            enabled: true,
            dependencyMapping: true,
            complexityThreshold: 10,
            fileSizeLimit: 300
          }
        },
        map: {
          architecture: {
            enabled: true,
            visualization: true,
            dependencyGraph: true,
            serviceMapping: true
          },
          navigation: {
            symbolSearch: true,
            fileRelationships: true,
            codeFlowAnalysis: true
          }
        },
        automate: {
          codeGeneration: {
            enabled: true,
            boilerplateReduction: true,
            patternRecognition: true,
            refactoringSuggestions: true
          },
          processes: {
            testGeneration: true,
            documentationGeneration: true,
            errorHandling: true,
            validationRules: true
          }
        },
        document: {
          inlineDocumentation: {
            enabled: true,
            autoGenerate: true,
            includeExamples: true,
            updateOnChange: true
          },
          testing: {
            unitTests: true,
            integrationTests: true,
            errorCaseTests: true,
            coverageTracking: true
          }
        }
      },
      workflow: {
        phases: [
          {
            name: "Break",
            description: "Decompose complex tasks",
            tools: ["taskAnalysis", "dependencyMapping", "complexityAnalysis"]
          },
          {
            name: "Map",
            description: "Understand architecture and relationships",
            tools: ["symbolSearch", "visualization", "flowAnalysis"]
          },
          {
            name: "Automate",
            description: "Generate code and automate processes",
            tools: ["codeGeneration", "refactoring", "testGeneration"]
          },
          {
            name: "Document",
            description: "Document and test everything",
            tools: ["documentation", "testing", "validation"]
          }
        ]
      },
      preferences: {
        language: "TypeScript",
        framework: "React",
        backend: "Node.js",
        database: "Supabase",
        testing: "Vitest",
        documentation: "JSDoc"
      },
      environments: {
        development: {
          debugMode: true,
          logLevel: 'debug',
          autoReload: true,
          mockServices: true
        },
        testing: {
          debugMode: false,
          logLevel: 'warn',
          autoReload: false,
          mockServices: true
        },
        staging: {
          debugMode: false,
          logLevel: 'info',
          autoReload: false,
          mockServices: false
        },
        production: {
          debugMode: false,
          logLevel: 'error',
          autoReload: false,
          mockServices: false
        }
      },
      projectType: 'fullstack',
      integrations: {
        mcp: false,
        codebuff: false,
        aiServices: false,
        collaboration: false,
        github: false,
        docker: false,
        ci: false
      },
      automation: {
        autoCommit: false,
        autoTest: false,
        autoDeploy: false,
        qualityGates: false,
        codeReview: false,
        dependencyUpdates: false
      },
      metrics: {
        tracking: false,
        reporting: false,
        dashboards: false,
        alerts: false,
        retention: 30
      }
    };
  }

  private async createEnvironmentConfigs(baseConfig: EnhancedBMADConfig): Promise<void> {
    const environments = ['development', 'testing', 'production'];
    
    for (const env of environments) {
      const envConfigPath = this.configPath.replace('.json', `-${env}.json`);
      const envConfig = baseConfig.environments[env as keyof typeof baseConfig.environments];
      
      await fs.writeJSON(envConfigPath, envConfig, { spaces: 2 });
    }
  }

  private async createProjectStructure(projectType: ProjectType): Promise<void> {
    const directories = this.getProjectDirectories(projectType);
    
    for (const dir of directories) {
      await fs.ensureDir(dir);
    }
  }

  private getProjectDirectories(projectType: ProjectType): string[] {
    const baseDirs = ['src', 'tests', 'docs', 'scripts'];
    
    switch (projectType) {
      case 'ai-brain-interface':
        return [
          ...baseDirs,
          'src/core',
          'src/ai-services',
          'src/collaboration',
          'src/visualization',
          'src/thought-processing',
          'ai-services',
          'frontend',
          'database'
        ];
      case 'microservices':
        return [
          ...baseDirs,
          'src/services',
          'src/gateway',
          'src/shared',
          'services',
          'gateway'
        ];
      case 'fullstack':
        return [
          ...baseDirs,
          'src/frontend',
          'src/backend',
          'src/shared',
          'frontend',
          'backend'
        ];
      case 'api-only':
        return [
          ...baseDirs,
          'src/routes',
          'src/middleware',
          'src/services',
          'src/utils'
        ];
      default:
        return baseDirs;
    }
  }

  private generateMicroservicesConfig(baseConfig: EnhancedBMADConfig, options: any): EnhancedBMADConfig {
    return {
      ...baseConfig,
      projectType: 'microservices',
      integrations: {
        mcp: true,
        codebuff: true,
        aiServices: false,
        collaboration: false,
        github: false,
        docker: false,
        ci: false
      }
    };
  }

  private generateFullstackConfig(baseConfig: EnhancedBMADConfig, options: any): EnhancedBMADConfig {
    return {
      ...baseConfig,
      projectType: 'fullstack',
      integrations: {
        mcp: false,
        codebuff: false,
        aiServices: false,
        collaboration: false,
        github: false,
        docker: false,
        ci: false
      }
    };
  }

  private generateAPIConfig(baseConfig: EnhancedBMADConfig, options: any): EnhancedBMADConfig {
    return {
      ...baseConfig,
      projectType: 'api-only',
      integrations: {
        mcp: false,
        codebuff: false,
        aiServices: false,
        collaboration: false,
        github: false,
        docker: false,
        ci: false
      }
    };
  }

  private logger = {
    info: (message: string, ...args: any[]) => console.log(`[BMAD-Config] ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[BMAD-Config] ${message}`, ...args)
  };
}
