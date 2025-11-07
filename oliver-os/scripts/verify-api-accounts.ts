/**
 * API Accounts Setup Verification Script
 * Verifies all API accounts and external service configurations
 * Following BMAD principles: Break, Map, Automate, Document
 */

import fs from 'fs-extra';
import * as path from 'path';
import { Config } from '../src/core/config';
import { Logger } from '../src/core/logger';

interface ApiAccountStatus {
  name: string;
  required: boolean;
  configured: boolean;
  value?: string;
  status: 'configured' | 'missing' | 'invalid' | 'optional';
  message: string;
  setupUrl?: string;
}

interface ServiceConnectionStatus {
  name: string;
  type: 'database' | 'api' | 'service';
  url?: string;
  configured: boolean;
  status: 'connected' | 'disconnected' | 'unknown';
  message: string;
}

class ApiAccountVerifier {
  private logger: Logger;
  private config: Config;
  private env: Record<string, string | undefined>;

  constructor() {
    this.logger = new Logger('ApiAccountVerifier');
    this.config = new Config();
    // Create a copy of process.env so we can override with .env file values
    this.env = { ...process.env };
  }

  /**
   * Load environment variables from .env files
   */
  private async loadEnvironment(): Promise<void> {
    // Load .env file manually since dotenv might not be in process.env
    const envFiles = ['.env', '.env.local', '.env.production'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(process.cwd(), envFile);
      try {
        const pathExists = await fs.pathExists(envPath);
        if (pathExists) {
          const envContent = await fs.readFile(envPath, 'utf-8');
          const lines = envContent.split('\n');
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
              const match = trimmed.match(/^([^=]+)=(.*)$/);
              if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                value = value.replace(/^["']|["']$/g, '').trim();
                // Always override with .env file values (they take precedence)
                this.env[key] = value;
              }
            }
          }
          this.logger.info(`Loaded environment from ${envFile}`);
          break; // Use first found file
        }
      } catch (error) {
        // Silently skip if file doesn't exist or can't be read
        this.logger.warn(`Could not load ${envFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Also try dotenv as a fallback
    try {
      const dotenv = await import('dotenv');
      const result = dotenv.config();
      if (!result.error && result.parsed) {
        Object.assign(this.env, result.parsed);
      }
    } catch (error) {
      // dotenv not available, that's okay
    }
  }

  /**
   * Verify AI Provider API accounts
   */
  private verifyAiProviders(): ApiAccountStatus[] {
    const providers: ApiAccountStatus[] = [];

    // Minimax API
    const minimaxKey = this.env['MINIMAX_API_KEY'] || '';
    providers.push({
      name: 'Minimax API',
      required: false, // Optional if using Ollama
      configured: !!minimaxKey && minimaxKey.length > 0,
      value: minimaxKey ? `${minimaxKey.substring(0, 8)}...` : undefined,
      status: minimaxKey ? 'configured' : 'optional',
      message: minimaxKey 
        ? 'Minimax API key is configured'
        : 'Minimax API key is not set (optional if using Ollama)',
      setupUrl: 'https://platform.minimax.chat/console/account'
    });

    // OpenAI API
    const openaiKey = this.env['OPENAI_API_KEY'] || '';
    providers.push({
      name: 'OpenAI API',
      required: false,
      configured: !!openaiKey && openaiKey.length > 0,
      value: openaiKey ? `${openaiKey.substring(0, 8)}...` : undefined,
      status: openaiKey ? 'configured' : 'optional',
      message: openaiKey
        ? 'OpenAI API key is configured'
        : 'OpenAI API key is not set (optional)',
      setupUrl: 'https://platform.openai.com/api-keys'
    });

    // Anthropic API
    const anthropicKey = this.env['ANTHROPIC_API_KEY'] || '';
    providers.push({
      name: 'Anthropic API',
      required: false,
      configured: !!anthropicKey && anthropicKey.length > 0,
      value: anthropicKey ? `${anthropicKey.substring(0, 8)}...` : undefined,
      status: anthropicKey ? 'configured' : 'optional',
      message: anthropicKey
        ? 'Anthropic API key is configured'
        : 'Anthropic API key is not set (optional)',
      setupUrl: 'https://console.anthropic.com/settings/keys'
    });

    // CodeBuff API (if used)
    const codebuffKey = this.env['CODEBUFF_API_KEY'] || '';
    providers.push({
      name: 'CodeBuff API',
      required: false,
      configured: !!codebuffKey && codebuffKey.length > 0,
      value: codebuffKey ? `${codebuffKey.substring(0, 8)}...` : undefined,
      status: codebuffKey ? 'configured' : 'optional',
      message: codebuffKey
        ? 'CodeBuff API key is configured'
        : 'CodeBuff API key is not set (optional)',
      setupUrl: 'https://codebuff.ai/settings'
    });

    return providers;
  }

  /**
   * Verify Database connections
   */
  private verifyDatabases(): ServiceConnectionStatus[] {
    const databases: ServiceConnectionStatus[] = [];

    // PostgreSQL
    const postgresUrl = this.env['DATABASE_URL'] || this.env['POSTGRES_URL'] || '';
    databases.push({
      name: 'PostgreSQL',
      type: 'database',
      url: postgresUrl ? this.maskUrl(postgresUrl) : undefined,
      configured: !!postgresUrl,
      status: 'unknown',
      message: postgresUrl
        ? 'PostgreSQL URL is configured'
        : 'PostgreSQL URL is not set'
    });

    // Redis
    const redisUrl = this.env['REDIS_URL'] || '';
    databases.push({
      name: 'Redis',
      type: 'database',
      url: redisUrl ? this.maskUrl(redisUrl) : undefined,
      configured: !!redisUrl,
      status: 'unknown',
      message: redisUrl
        ? 'Redis URL is configured'
        : 'Redis URL is not set'
    });

    // Neo4j
    const neo4jUrl = this.env['NEO4J_URL'] || '';
    const neo4jUser = this.env['NEO4J_USER'] || '';
    const neo4jPassword = this.env['NEO4J_PASSWORD'] || '';
    databases.push({
      name: 'Neo4j',
      type: 'database',
      url: neo4jUrl ? this.maskUrl(neo4jUrl) : undefined,
      configured: !!neo4jUrl && !!neo4jUser && !!neo4jPassword,
      status: 'unknown',
      message: (neo4jUrl && neo4jUser && neo4jPassword)
        ? 'Neo4j configuration is complete'
        : 'Neo4j configuration is incomplete'
    });

    // ChromaDB
    const chromaHost = this.env['CHROMA_HOST'] || '';
    const chromaPort = this.env['CHROMA_PORT'] || '';
    databases.push({
      name: 'ChromaDB',
      type: 'database',
      url: chromaHost ? `${chromaHost}:${chromaPort || '8000'}` : undefined,
      configured: !!chromaHost,
      status: 'unknown',
      message: chromaHost
        ? 'ChromaDB is configured'
        : 'ChromaDB is not configured'
    });

    // Elasticsearch
    const elasticsearchUrl = this.env['ELASTICSEARCH_URL'] || '';
    databases.push({
      name: 'Elasticsearch',
      type: 'database',
      url: elasticsearchUrl ? this.maskUrl(elasticsearchUrl) : undefined,
      configured: !!elasticsearchUrl,
      status: 'unknown',
      message: elasticsearchUrl
        ? 'Elasticsearch URL is configured'
        : 'Elasticsearch URL is not set'
    });

    return databases;
  }

  /**
   * Verify Security credentials
   */
  private verifySecurity(): ApiAccountStatus[] {
    const security: ApiAccountStatus[] = [];

    // JWT Secret
    const jwtSecret = this.env['JWT_SECRET'] || '';
    // Remove quotes if present
    const cleanJwtSecret = jwtSecret.replace(/^["']|["']$/g, '').trim();
    const isDefaultJwtSecret = cleanJwtSecret === 'your-jwt-secret-change-in-production' || 
                               cleanJwtSecret.length < 32 ||
                               cleanJwtSecret === '';
    security.push({
      name: 'JWT Secret',
      required: true,
      configured: !!cleanJwtSecret && !isDefaultJwtSecret,
      status: isDefaultJwtSecret ? 'invalid' : (cleanJwtSecret ? 'configured' : 'missing'),
      message: isDefaultJwtSecret 
        ? '⚠️ JWT Secret is using default value - CHANGE IN PRODUCTION!'
        : cleanJwtSecret.length < 32
          ? `⚠️ JWT Secret is too short (${cleanJwtSecret.length} chars, need 32+)`
          : cleanJwtSecret
            ? '✅ JWT Secret is configured'
            : 'JWT Secret is missing',
    });

    // JWT Refresh Secret
    const jwtRefreshSecret = this.env['JWT_REFRESH_SECRET'] || '';
    const cleanJwtRefreshSecret = jwtRefreshSecret.replace(/^["']|["']$/g, '').trim();
    const isDefaultJwtRefreshSecret = cleanJwtRefreshSecret === 'your-jwt-refresh-secret-change-in-production' || 
                                     cleanJwtRefreshSecret.length < 32 ||
                                     cleanJwtRefreshSecret === '';
    security.push({
      name: 'JWT Refresh Secret',
      required: true,
      configured: !!cleanJwtRefreshSecret && !isDefaultJwtRefreshSecret,
      status: isDefaultJwtRefreshSecret ? 'invalid' : (cleanJwtRefreshSecret ? 'configured' : 'missing'),
      message: isDefaultJwtRefreshSecret 
        ? '⚠️ JWT Refresh Secret is using default value - CHANGE IN PRODUCTION!'
        : cleanJwtRefreshSecret.length < 32
          ? `⚠️ JWT Refresh Secret is too short (${cleanJwtRefreshSecret.length} chars, need 32+)`
          : cleanJwtRefreshSecret
            ? '✅ JWT Refresh Secret is configured'
            : 'JWT Refresh Secret is missing',
    });

    // Secret Key (Python services)
    const secretKey = this.env['SECRET_KEY'] || '';
    const cleanSecretKey = secretKey.replace(/^["']|["']$/g, '').trim();
    const isDefaultSecretKey = cleanSecretKey === 'your-secret-key-change-in-production' || 
                              cleanSecretKey.length < 32 ||
                              cleanSecretKey === '';
    security.push({
      name: 'Secret Key (AI Services)',
      required: true,
      configured: !!cleanSecretKey && !isDefaultSecretKey,
      status: isDefaultSecretKey ? 'invalid' : (cleanSecretKey ? 'configured' : 'missing'),
      message: isDefaultSecretKey 
        ? '⚠️ Secret Key is using default value - CHANGE IN PRODUCTION!'
        : cleanSecretKey.length < 32
          ? `⚠️ Secret Key is too short (${cleanSecretKey.length} chars, need 32+)`
          : cleanSecretKey
            ? '✅ Secret Key is configured'
            : 'Secret Key is missing',
    });

    return security;
  }

  /**
   * Verify Optional Services
   */
  private verifyOptionalServices(): ApiAccountStatus[] {
    const services: ApiAccountStatus[] = [];

    // Supabase
    const supabaseUrl = this.env['SUPABASE_URL'] || '';
    const supabaseKey = this.env['SUPABASE_ANON_KEY'] || '';
    services.push({
      name: 'Supabase',
      required: false,
      configured: !!supabaseUrl && !!supabaseKey,
      status: (supabaseUrl && supabaseKey) ? 'configured' : 'optional',
      message: (supabaseUrl && supabaseKey)
        ? 'Supabase is configured'
        : 'Supabase is not configured (optional)',
      setupUrl: 'https://supabase.com/dashboard'
    });

    // AI Services URL
    const aiServicesUrl = this.env['AI_SERVICES_URL'] || '';
    services.push({
      name: 'AI Services URL',
      required: false,
      configured: !!aiServicesUrl,
      status: aiServicesUrl ? 'configured' : 'optional',
      message: aiServicesUrl
        ? `AI Services URL is configured: ${aiServicesUrl}`
        : 'AI Services URL is not set (using default: http://localhost:8000)',
    });

    return services;
  }

  /**
   * Mask sensitive URLs
   */
  private maskUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.password) {
        urlObj.password = '***';
      }
      if (urlObj.username && urlObj.username !== 'postgres' && urlObj.username !== 'neo4j') {
        urlObj.username = '***';
      }
      return urlObj.toString();
    } catch {
      // If URL parsing fails, mask after @ symbol
      return url.replace(/(:\/\/)([^:]+):([^@]+@)/, '$1***:***@');
    }
  }

  /**
   * Generate verification report
   */
  async verify(): Promise<{
    aiProviders: ApiAccountStatus[];
    databases: ServiceConnectionStatus[];
    security: ApiAccountStatus[];
    optionalServices: ApiAccountStatus[];
    summary: {
      total: number;
      configured: number;
      missing: number;
      invalid: number;
      optional: number;
    };
  }> {
    await this.loadEnvironment();

    const aiProviders = this.verifyAiProviders();
    const databases = this.verifyDatabases();
    const security = this.verifySecurity();
    const optionalServices = this.verifyOptionalServices();

    const allAccounts = [...aiProviders, ...security, ...optionalServices];
    
    // Only count invalid/missing from required items
    const requiredAccounts = [...security, ...aiProviders.filter(p => p.required)];
    const optionalAccounts = [...optionalServices, ...aiProviders.filter(p => !p.required)];
    
    const summary = {
      total: allAccounts.length,
      configured: allAccounts.filter(a => a.status === 'configured').length,
      missing: requiredAccounts.filter(a => a.status === 'missing').length,
      invalid: requiredAccounts.filter(a => a.status === 'invalid').length,
      optional: optionalAccounts.length,
    };

    return {
      aiProviders,
      databases,
      security,
      optionalServices,
      summary
    };
  }

  /**
   * Print verification report
   */
  printReport(report: Awaited<ReturnType<typeof this.verify>>): void {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 OLIVER-OS API ACCOUNTS VERIFICATION REPORT');
    console.log('='.repeat(80) + '\n');

    // Summary
    console.log('📊 SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Total Accounts: ${report.summary.total}`);
    console.log(`✅ Configured: ${report.summary.configured}`);
    console.log(`⚠️  Invalid: ${report.summary.invalid}`);
    console.log(`❌ Missing: ${report.summary.missing}`);
    console.log(`ℹ️  Optional: ${report.summary.optional}`);
    console.log('');

    // AI Providers
    console.log('🤖 AI PROVIDERS');
    console.log('-'.repeat(80));
    report.aiProviders.forEach(provider => {
      const icon = provider.status === 'configured' ? '✅' : 
                   provider.status === 'invalid' ? '⚠️' : 'ℹ️';
      console.log(`${icon} ${provider.name}: ${provider.message}`);
      if (provider.setupUrl) {
        console.log(`   Setup: ${provider.setupUrl}`);
      }
    });
    console.log('');

    // Security
    console.log('🔒 SECURITY CREDENTIALS');
    console.log('-'.repeat(80));
    report.security.forEach(cred => {
      const icon = cred.status === 'configured' ? '✅' : '⚠️';
      console.log(`${icon} ${cred.name}: ${cred.message}`);
    });
    console.log('');

    // Databases
    console.log('🗄️  DATABASES');
    console.log('-'.repeat(80));
    report.databases.forEach(db => {
      const icon = db.configured ? '✅' : '❌';
      console.log(`${icon} ${db.name}: ${db.message}`);
      if (db.url) {
        console.log(`   URL: ${db.url}`);
      }
    });
    console.log('');

    // Optional Services
    if (report.optionalServices.length > 0) {
      console.log('🔧 OPTIONAL SERVICES');
      console.log('-'.repeat(80));
      report.optionalServices.forEach(service => {
        const icon = service.status === 'configured' ? '✅' : 'ℹ️';
        console.log(`${icon} ${service.name}: ${service.message}`);
        if (service.setupUrl) {
          console.log(`   Setup: ${service.setupUrl}`);
        }
      });
      console.log('');
    }

    // Recommendations
    console.log('💡 RECOMMENDATIONS');
    console.log('-'.repeat(80));
    
    const hasInvalid = report.summary.invalid > 0;
    const hasMissing = report.summary.missing > 0;
    const hasAiProvider = report.aiProviders.some(p => p.configured || p.service === 'LLM Provider');
    const allSecurityValid = report.security.every(s => s.status === 'configured');
    
    if (hasInvalid) {
      console.log('⚠️  ACTION REQUIRED: Fix invalid security credentials');
      console.log('   - Run: pnpm generate:secrets');
      console.log('   - Generate secure random strings for JWT secrets');
      console.log('   - Use at least 32 characters for secrets');
    } else if (allSecurityValid) {
      console.log('✅ Security credentials are properly configured');
    }
    
    if (hasMissing) {
      console.log('❌ ACTION REQUIRED: Configure missing required accounts');
      console.log('   - Run: pnpm setup:api-accounts');
    }
    
    if (!hasAiProvider) {
      console.log('ℹ️  RECOMMENDED: Configure at least one AI provider');
      console.log('   - Options: Minimax, OpenAI, Anthropic, or Ollama (local)');
      console.log('   - Run: pnpm setup:api-accounts');
      console.log('   - Or set LLM_PROVIDER=ollama for local setup');
    } else {
      const llmProvider = report.aiProviders.find(p => p.service === 'LLM Provider');
      if (llmProvider && llmProvider.configured) {
        console.log(`✅ AI provider configured: ${llmProvider.message}`);
      }
    }
    
    if (!hasInvalid && !hasMissing && hasAiProvider && allSecurityValid) {
      console.log('\n🎉 All required API accounts are properly configured!');
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}

// Main execution
async function main() {
  const verifier = new ApiAccountVerifier();
  try {
    const report = await verifier.verify();
    verifier.printReport(report);

    // Exit with appropriate code
    const hasErrors = report.summary.invalid > 0 || report.summary.missing > 0;
    process.exit(hasErrors ? 1 : 0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
// Check if this file is being run directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
                     process.argv[1]?.includes('verify-api-accounts.ts');

if (isMainModule) {
  main();
}

export { ApiAccountVerifier };

