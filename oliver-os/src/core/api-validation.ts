/**
 * API Account Validation
 * Validates API keys and configurations on startup
 */

import { Logger } from './logger';
import { Config } from './config';

const logger = new Logger('ApiValidation');

interface ValidationResult {
  service: string;
  configured: boolean;
  valid: boolean;
  message: string;
}

interface ValidationReport {
  security: ValidationResult[];
  aiProviders: ValidationResult[];
  databases: ValidationResult[];
  warnings: string[];
  errors: string[];
}

export class ApiValidator {
  constructor(private readonly config: Config) {
    void this.config;
  }

  /**
   * Validate security credentials
   */
  private validateSecurity(): ValidationResult[] {
    const results: ValidationResult[] = [];
    // Get values from process.env and clean them (remove quotes)
    const jwtSecretRaw = process.env['JWT_SECRET'] || '';
    const jwtRefreshSecretRaw = process.env['JWT_REFRESH_SECRET'] || '';
    const secretKeyRaw = process.env['SECRET_KEY'] || '';
    
    const jwtSecret = jwtSecretRaw.replace(/^["']|["']$/g, '').trim();
    const jwtRefreshSecret = jwtRefreshSecretRaw.replace(/^["']|["']$/g, '').trim();
    const secretKey = secretKeyRaw.replace(/^["']|["']$/g, '').trim();

    // JWT Secret
    const isDefaultJwtSecret = jwtSecret === 'your-jwt-secret-change-in-production' || 
                               jwtSecret === '' ||
                               jwtSecret.length < 32;
    results.push({
      service: 'JWT Secret',
      configured: !!jwtSecret,
      valid: !isDefaultJwtSecret,
      message: isDefaultJwtSecret 
        ? 'Using default value - CHANGE IN PRODUCTION!'
        : jwtSecret.length < 32
          ? 'Too short (minimum 32 characters)'
          : 'Valid'
    });

    // JWT Refresh Secret
    const isDefaultJwtRefreshSecret = jwtRefreshSecret === 'your-jwt-refresh-secret-change-in-production' || 
                                      jwtRefreshSecret === '' ||
                                      jwtRefreshSecret.length < 32;
    results.push({
      service: 'JWT Refresh Secret',
      configured: !!jwtRefreshSecret,
      valid: !isDefaultJwtRefreshSecret,
      message: isDefaultJwtRefreshSecret 
        ? 'Using default value - CHANGE IN PRODUCTION!'
        : jwtRefreshSecret.length < 32
          ? 'Too short (minimum 32 characters)'
          : 'Valid'
    });

    // Secret Key
    const isDefaultSecretKey = secretKey === 'your-secret-key-change-in-production' || 
                               secretKey === '' ||
                               secretKey.length < 32;
    results.push({
      service: 'Secret Key (AI Services)',
      configured: !!secretKey,
      valid: !isDefaultSecretKey,
      message: isDefaultSecretKey 
        ? 'Using default value - CHANGE IN PRODUCTION!'
        : secretKey.length < 32
          ? 'Too short (minimum 32 characters)'
          : 'Valid'
    });

    return results;
  }

  /**
   * Validate AI provider configurations
   */
  private validateAiProviders(): ValidationResult[] {
    const results: ValidationResult[] = [];
    const minimaxKey = process.env['MINIMAX_API_KEY'] || '';
    const openaiKey = process.env['OPENAI_API_KEY'] || '';
    const anthropicKey = process.env['ANTHROPIC_API_KEY'] || '';
    const llmProvider = process.env['LLM_PROVIDER'] || 'ollama';

    // Minimax
    results.push({
      service: 'Minimax API',
      configured: !!minimaxKey,
      valid: !!minimaxKey,
      message: minimaxKey ? 'Configured' : 'Not configured (optional)'
    });

    // OpenAI
    results.push({
      service: 'OpenAI API',
      configured: !!openaiKey,
      valid: !!openaiKey,
      message: openaiKey ? 'Configured' : 'Not configured (optional)'
    });

    // Anthropic
    results.push({
      service: 'Anthropic API',
      configured: !!anthropicKey,
      valid: !!anthropicKey,
      message: anthropicKey ? 'Configured' : 'Not configured (optional)'
    });

    // LLM Provider
    const hasProvider = Boolean(minimaxKey || openaiKey || anthropicKey || llmProvider === 'ollama');
    results.push({
      service: 'LLM Provider',
      configured: hasProvider,
      valid: hasProvider,
      message: hasProvider 
        ? `Using: ${llmProvider}` 
        : 'No AI provider configured - recommend setting up at least one'
    });

    return results;
  }

  /**
   * Validate database configurations
   */
  private validateDatabases(): ValidationResult[] {
    const results: ValidationResult[] = [];
    const databaseUrl = process.env['DATABASE_URL'] || process.env['POSTGRES_URL'] || '';
    const redisUrl = process.env['REDIS_URL'] || '';

    // PostgreSQL
    results.push({
      service: 'PostgreSQL',
      configured: !!databaseUrl,
      valid: !!databaseUrl,
      message: databaseUrl ? 'Configured' : 'Not configured (optional if SKIP_DB_INIT is set)'
    });

    // Redis
    results.push({
      service: 'Redis',
      configured: !!redisUrl,
      valid: !!redisUrl,
      message: redisUrl ? 'Configured' : 'Not configured (optional)'
    });

    return results;
  }

  /**
   * Validate all API accounts and configurations
   */
  async validate(): Promise<ValidationReport> {
    const security = this.validateSecurity();
    const aiProviders = this.validateAiProviders();
    const databases = this.validateDatabases();

    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for security issues
    for (const result of security) {
      if (!result.valid) {
        errors.push(`${result.service}: ${result.message}`);
      }
    }

    // Check for missing AI providers (warning only)
    const hasAiProvider = aiProviders.some(p => p.service === 'LLM Provider' && p.configured);
    if (!hasAiProvider) {
      warnings.push('No AI provider configured - recommend setting up at least one (Minimax, OpenAI, or Ollama)');
    }

    // Check for missing databases (warning only if not skipped)
    if (!process.env['SKIP_DB_INIT']) {
      const hasDatabase = databases.some(d => d.configured);
      if (!hasDatabase) {
        warnings.push('No database configured - some features may not work');
      }
    }

    return {
      security,
      aiProviders,
      databases,
      warnings,
      errors
    };
  }

  /**
   * Log validation report
   */
  logReport(report: ValidationReport): void {
    logger.info('🔍 API Account Validation Report');
    logger.info('='.repeat(80));

    // Security
    logger.info('\n🔒 Security Credentials:');
    for (const result of report.security) {
      const icon = result.valid ? '✅' : '❌';
      logger.info(`  ${icon} ${result.service}: ${result.message}`);
    }

    // AI Providers
    logger.info('\n🤖 AI Providers:');
    for (const result of report.aiProviders) {
      const icon = result.configured ? '✅' : 'ℹ️';
      logger.info(`  ${icon} ${result.service}: ${result.message}`);
    }

    // Databases
    logger.info('\n🗄️  Databases:');
    for (const result of report.databases) {
      const icon = result.configured ? '✅' : 'ℹ️';
      logger.info(`  ${icon} ${result.service}: ${result.message}`);
    }

    // Warnings
    if (report.warnings.length > 0) {
      logger.warn('\n⚠️  Warnings:');
      for (const warning of report.warnings) {
        logger.warn(`  - ${warning}`);
      }
    }

    // Errors
    if (report.errors.length > 0) {
      logger.error('\n❌ Errors:');
      for (const error of report.errors) {
        logger.error(`  - ${error}`);
      }
      logger.error('\n⚠️  Run "pnpm generate:secrets" to fix security credential issues');
    }

    logger.info('='.repeat(80));
  }
}

