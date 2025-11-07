/**
 * Oliver-OS API Accounts Setup Wizard
 * Interactive setup script for configuring all API accounts
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as readline from 'readline';
import { generateSecret } from './generate-secrets';
import { ApiAccountVerifier } from './verify-api-accounts';
import { Logger } from '../src/core/logger';

const logger = new Logger('SetupWizard');

interface SetupOption {
  id: string;
  name: string;
  description: string;
  required: boolean;
  envVar: string;
  setupUrl?: string;
}

const SETUP_OPTIONS: SetupOption[] = [
  {
    id: 'minimax',
    name: 'Minimax API',
    description: 'Primary LLM provider for agent orchestration',
    required: false,
    envVar: 'MINIMAX_API_KEY',
    setupUrl: 'https://platform.minimax.chat/console/account'
  },
  {
    id: 'openai',
    name: 'OpenAI API',
    description: 'Alternative LLM provider',
    required: false,
    envVar: 'OPENAI_API_KEY',
    setupUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'anthropic',
    name: 'Anthropic API',
    description: 'Claude models provider',
    required: false,
    envVar: 'ANTHROPIC_API_KEY',
    setupUrl: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Local LLM provider (no API key needed)',
    required: false,
    envVar: 'LLM_PROVIDER',
    setupUrl: 'https://ollama.ai/'
  }
];

class SetupWizard {
  private rl: readline.Interface;
  private envPath: string;
  private env: Map<string, string> = new Map();

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.envPath = path.join(process.cwd(), '.env');
  }

  /**
   * Load existing environment variables
   */
  async loadEnv(): Promise<void> {
    if (await fs.pathExists(this.envPath)) {
      const content = await fs.readFile(this.envPath, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (key) {
            this.env.set(key.trim(), value.trim());
          }
        }
      }
    }
  }

  /**
   * Save environment variables to .env file
   */
  async saveEnv(): Promise<void> {
    let content = '';
    
    if (await fs.pathExists(this.envPath)) {
      content = await fs.readFile(this.envPath, 'utf-8');
    } else {
      // Use env.example as template if it exists
      const examplePath = path.join(process.cwd(), 'env.example');
      if (await fs.pathExists(examplePath)) {
        content = await fs.readFile(examplePath, 'utf-8');
      }
    }

    const lines = content.split('\n');
    const updatedLines: string[] = [];
    const updatedKeys = new Set<string>();

    // Update existing lines
    for (const line of lines) {
      let updated = false;
      
      for (const [key, value] of this.env.entries()) {
        const regex = new RegExp(`^\\s*${key}\\s*=.*$`);
        if (regex.test(line)) {
          updatedLines.push(`${key}="${value}"`);
          updated = true;
          updatedKeys.add(key);
          break;
        }
      }
      
      if (!updated) {
        updatedLines.push(line);
      }
    }

    // Add new keys
    for (const [key, value] of this.env.entries()) {
      if (!updatedKeys.has(key)) {
        updatedLines.push(`${key}="${value}"`);
      }
    }

    await fs.writeFile(this.envPath, updatedLines.join('\n'), 'utf-8');
    logger.info(`✅ Updated .env file`);
  }

  /**
   * Ask a question and return the answer
   */
  async question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Ask yes/no question
   */
  async yesNo(prompt: string, defaultValue: boolean = false): Promise<boolean> {
    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.question(`${prompt} [${defaultText}]: `);
    
    if (!answer) return defaultValue;
    return answer.toLowerCase().startsWith('y');
  }

  /**
   * Generate and update security secrets
   */
  async setupSecrets(): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 SECURITY SECRETS SETUP');
    console.log('='.repeat(80) + '\n');

    const generate = await this.yesNo('Generate new security secrets?', true);
    
    if (generate) {
      console.log('\nGenerating secure random secrets...\n');
      
      this.env.set('JWT_SECRET', generateSecret(64));
      this.env.set('JWT_REFRESH_SECRET', generateSecret(64));
      this.env.set('SECRET_KEY', generateSecret(64));
      
      console.log('✅ Generated JWT_SECRET');
      console.log('✅ Generated JWT_REFRESH_SECRET');
      console.log('✅ Generated SECRET_KEY');
      console.log('\n⚠️  These secrets have been saved to .env file');
    } else {
      console.log('Skipping secret generation');
    }
  }

  /**
   * Setup AI providers
   */
  async setupAiProviders(): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('🤖 AI PROVIDER SETUP');
    console.log('='.repeat(80) + '\n');

    console.log('Configure at least one AI provider:\n');

    for (const option of SETUP_OPTIONS) {
      if (option.id === 'ollama') {
        // Special handling for Ollama
        const useOllama = await this.yesNo(`Use ${option.name}? (No API key needed)`, true);
        if (useOllama) {
          this.env.set('LLM_PROVIDER', 'ollama');
          this.env.set('OLLAMA_BASE_URL', 'http://localhost:11434');
          this.env.set('OLLAMA_MODEL', 'llama3.1:8b');
          console.log(`✅ Configured ${option.name}`);
        }
        continue;
      }

      const configure = await this.yesNo(`Configure ${option.name}?`, false);
      
      if (configure) {
        console.log(`\n${option.description}`);
        if (option.setupUrl) {
          console.log(`Setup URL: ${option.setupUrl}`);
        }
        
        const apiKey = await this.question(`Enter ${option.envVar}: `);
        
        if (apiKey) {
          this.env.set(option.envVar, apiKey);
          console.log(`✅ Configured ${option.name}`);
          
          // Set as primary provider if not set
          if (!this.env.has('LLM_PROVIDER')) {
            this.env.set('LLM_PROVIDER', option.id);
            console.log(`✅ Set ${option.name} as primary LLM provider`);
          }
        } else {
          console.log(`⚠️  Skipped ${option.name} (no API key provided)`);
        }
      }
    }

    // Ensure LLM_PROVIDER is set
    if (!this.env.has('LLM_PROVIDER')) {
      this.env.set('LLM_PROVIDER', 'ollama');
      console.log('\n⚠️  No LLM provider selected, defaulting to Ollama');
    }
  }

  /**
   * Setup databases
   */
  async setupDatabases(): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('🗄️  DATABASE SETUP');
    console.log('='.repeat(80) + '\n');

    const useDocker = await this.yesNo('Use Docker Compose for databases?', true);

    if (useDocker) {
      console.log('\n📦 Docker Compose setup:');
      console.log('   Run: pnpm run db:setup');
      console.log('   Or: .\\scripts\\setup-databases.ps1 -Start\n');
      
      // Set default Docker database URLs
      this.env.set('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/oliver_os');
      this.env.set('POSTGRES_URL', 'postgresql://postgres:postgres@localhost:5432/oliver_os');
      this.env.set('REDIS_URL', 'redis://localhost:6379');
      this.env.set('NEO4J_URL', 'bolt://localhost:7687');
      this.env.set('NEO4J_USER', 'neo4j');
      this.env.set('NEO4J_PASSWORD', 'password');
      this.env.set('CHROMA_HOST', 'localhost');
      this.env.set('CHROMA_PORT', '8001');
      this.env.set('ELASTICSEARCH_URL', 'http://localhost:9200');
      
      console.log('✅ Set default Docker database URLs');
    } else {
      console.log('\n📝 Manual database setup:');
      
      const postgresUrl = await this.question('PostgreSQL URL [postgresql://postgres:postgres@localhost:5432/oliver_os]: ');
      this.env.set('DATABASE_URL', postgresUrl || 'postgresql://postgres:postgres@localhost:5432/oliver_os');
      
      const redisUrl = await this.question('Redis URL [redis://localhost:6379]: ');
      this.env.set('REDIS_URL', redisUrl || 'redis://localhost:6379');
    }
  }

  /**
   * Run the setup wizard
   */
  async run(): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 OLIVER-OS API ACCOUNTS SETUP WIZARD');
    console.log('='.repeat(80));
    console.log('\nThis wizard will help you configure all API accounts and services.\n');

    await this.loadEnv();

    try {
      // Step 1: Security Secrets
      await this.setupSecrets();

      // Step 2: AI Providers
      await this.setupAiProviders();

      // Step 3: Databases
      await this.setupDatabases();

      // Save all changes
      await this.saveEnv();

      console.log('\n' + '='.repeat(80));
      console.log('✅ SETUP COMPLETE!');
      console.log('='.repeat(80) + '\n');

      console.log('📋 Next Steps:');
      console.log('1. Review your .env file');
      console.log('2. Start databases: pnpm run db:setup');
      console.log('3. Verify setup: pnpm verify:api-accounts');
      console.log('4. Start the application: pnpm dev\n');

    } catch (error) {
      logger.error('Setup failed:', error);
      console.error('\n❌ Setup failed:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.rl.close();
    }
  }
}

// Main execution
async function main() {
  const wizard = new SetupWizard();
  await wizard.run();
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
                     process.argv[1]?.includes('setup-api-accounts.ts');

if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { SetupWizard };

