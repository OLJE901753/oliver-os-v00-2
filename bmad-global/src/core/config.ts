/**
 * BMAD Configuration Manager
 * Handles loading, validation, and management of BMAD configurations
 */

import * as fs from 'fs-extra';
import { BMADConfig } from '../types/bmad';

export class ConfigManager {
  private configPath: string;
  private config: BMADConfig | null = null;

  constructor(configPath?: string) {
    this.configPath = configPath || './bmad-config.json';
  }

  /**
   * Initialize BMAD in a project
   */
  async initializeProject(configPath?: string): Promise<void> {
    const targetPath = configPath || this.configPath;
    
    // Create default config if it doesn't exist
    if (!await fs.pathExists(targetPath)) {
      const defaultConfig = this.createDefaultConfig();
      await fs.writeJSON(targetPath, defaultConfig, { spaces: 2 });
    }

    // Load and validate config
    this.config = await this.loadConfig(targetPath);
    
    // Create necessary directories
    await this.createProjectStructure();
    
    // Generate initial files
    await this.generateInitialFiles();
  }

  /**
   * Load configuration from file
   */
  async loadConfig(configPath: string): Promise<BMADConfig> {
    try {
      const configData = await fs.readJSON(configPath);
      return this.validateConfig(configData);
    } catch (error) {
      throw new Error(`Failed to load BMAD config: ${error}`);
    }
  }

  /**
   * Create default BMAD configuration
   */
  private createDefaultConfig(): BMADConfig {
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
      }
    };
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(config: any): BMADConfig {
    // Basic validation - in production, use a proper schema validator
    if (!config.bmadMethod || !config.workflow || !config.preferences) {
      throw new Error('Invalid BMAD configuration structure');
    }
    
    return config as BMADConfig;
  }

  /**
   * Create project directory structure
   */
  private async createProjectStructure(): Promise<void> {
    const directories = [
      'src',
      'src/core',
      'src/commands', 
      'src/utils',
      'tests',
      'docs',
      'scripts'
    ];

    for (const dir of directories) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * Generate initial project files
   */
  private async generateInitialFiles(): Promise<void> {
    // Create .bmadignore file
    const bmadIgnore = [
      'node_modules/',
      '.git/',
      'dist/',
      'build/',
      'coverage/',
      '*.log',
      '.env.local',
      '.env.production'
    ].join('\n');

    await fs.writeFile('.bmadignore', bmadIgnore);

    // Create README template
    const readmeTemplate = this.generateReadmeTemplate();
    if (!await fs.pathExists('README.md')) {
      await fs.writeFile('README.md', readmeTemplate);
    }
  }

  /**
   * Generate README template
   */
  private generateReadmeTemplate(): string {
    return `# Project Name

> For the honor, not the glory—by the people, for the people.

## BMAD Methodology

This project follows the BMAD (Break, Map, Automate, Document) methodology:

- **Break**: Complex tasks broken into manageable pieces
- **Map**: Architecture and dependencies clearly mapped
- **Automate**: Repetitive processes automated
- **Document**: Everything documented and tested

## Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
\`\`\`

## Architecture

[Add architecture overview here]

## Development

[Add development guidelines here]

## Contributing

[Add contribution guidelines here]
`;
  }

  /**
   * Get current configuration
   */
  getConfig(): BMADConfig | null {
    return this.config;
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<BMADConfig>): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    this.config = { ...this.config, ...updates };
    await fs.writeJSON(this.configPath, this.config, { spaces: 2 });
  }
}
