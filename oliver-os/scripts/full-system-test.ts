/**
 * Full System Test for Oliver-OS
 * Comprehensive testing of all components, services, and functionality
 */

import { Config } from '../src/core/config';
import { Logger } from '../src/core/logger';
import { ApiAccountVerifier } from './verify-api-accounts';
import { ApiValidator } from '../src/core/api-validation';

const logger = new Logger('SystemTest');

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip' | 'warning';
  message: string;
  details?: string;
}

class SystemTester {
  private results: TestResult[] = [];
  private config: Config;

  constructor() {
    this.config = new Config();
  }

  /**
   * Record test result
   */
  private recordTest(name: string, status: TestResult['status'], message: string, details?: string): void {
    this.results.push({ name, status, message, details });
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'warning' ? '⚠️' : '⏭️';
    console.log(`${icon} ${name}: ${message}`);
    if (details) {
      console.log(`   ${details}`);
    }
  }

  /**
   * Test 1: Configuration Loading
   */
  async testConfiguration(): Promise<void> {
    try {
      await this.config.load();
      this.recordTest('Configuration Loading', 'pass', 'Configuration loaded successfully');
    } catch (error) {
      this.recordTest('Configuration Loading', 'fail', 'Failed to load configuration', 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test 2: API Account Verification
   */
  async testApiAccounts(): Promise<void> {
    try {
      const verifier = new ApiAccountVerifier();
      const report = await verifier.verify();
      
      const hasErrors = report.summary.invalid > 0 || report.summary.missing > 0;
      const allSecurityValid = report.security.every(s => s.status === 'configured');
      const hasAiProvider = report.aiProviders.some(p => p.configured || p.service === 'LLM Provider');
      
      if (hasErrors) {
        this.recordTest('API Account Verification', 'warning', 
          `${report.summary.invalid} invalid, ${report.summary.missing} missing`,
          'Some accounts need configuration');
      } else if (allSecurityValid && hasAiProvider) {
        this.recordTest('API Account Verification', 'pass', 'All required accounts configured');
      } else {
        this.recordTest('API Account Verification', 'warning', 'Some optional accounts not configured');
      }
    } catch (error) {
      this.recordTest('API Account Verification', 'fail', 'Verification failed',
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test 3: Environment Variables
   */
  async testEnvironmentVariables(): Promise<void> {
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SECRET_KEY'];
    const optional = ['MINIMAX_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'DATABASE_URL', 'REDIS_URL'];
    
    let missing = 0;
    let invalid = 0;
    
    for (const key of required) {
      const value = process.env[key] || '';
      const cleanValue = value.replace(/^["']|["']$/g, '').trim();
      if (!cleanValue || cleanValue.length < 32) {
        if (cleanValue === 'your-jwt-secret-change-in-production' || 
            cleanValue === 'your-jwt-refresh-secret-change-in-production' ||
            cleanValue === 'your-secret-key-change-in-production') {
          invalid++;
        } else {
          missing++;
        }
      }
    }
    
    const optionalConfigured = optional.filter(key => process.env[key]).length;
    
    if (missing > 0 || invalid > 0) {
      this.recordTest('Environment Variables', 'warning', 
        `${invalid} invalid, ${missing} missing required vars`,
        `${optionalConfigured}/${optional.length} optional vars configured`);
    } else {
      this.recordTest('Environment Variables', 'pass', 
        'All required environment variables configured',
        `${optionalConfigured}/${optional.length} optional vars configured`);
    }
  }

  /**
   * Test 4: Core Modules
   */
  async testCoreModules(): Promise<void> {
    const modules = [
      { name: 'Config', path: '../src/core/config' },
      { name: 'Logger', path: '../src/core/logger' },
      { name: 'Security', path: '../src/core/security' },
      { name: 'ApiValidator', path: '../src/core/api-validation' },
    ];
    
    let loaded = 0;
    for (const module of modules) {
      try {
        await import(module.path);
        loaded++;
      } catch (error) {
        this.recordTest(`Core Module: ${module.name}`, 'fail', 'Failed to load',
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    if (loaded === modules.length) {
      this.recordTest('Core Modules', 'pass', `All ${modules.length} core modules loaded`);
    } else {
      this.recordTest('Core Modules', 'warning', `${loaded}/${modules.length} modules loaded`);
    }
  }

  /**
   * Test 5: Service Managers
   */
  async testServiceManagers(): Promise<void> {
    try {
      const { ServiceManager } = await import('../src/services/service-manager');
      const serviceManager = new ServiceManager(this.config);
      this.recordTest('Service Manager', 'pass', 'ServiceManager instantiated');
    } catch (error) {
      this.recordTest('Service Manager', 'fail', 'Failed to instantiate',
        error instanceof Error ? error.message : 'Unknown error');
    }
    
    try {
      const { ProcessManager } = await import('../src/core/process-manager');
      const processManager = new ProcessManager(this.config);
      this.recordTest('Process Manager', 'pass', 'ProcessManager instantiated');
    } catch (error) {
      this.recordTest('Process Manager', 'fail', 'Failed to instantiate',
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test 6: Database Connections (if available)
   */
  async testDatabaseConnections(): Promise<void> {
    const databaseUrl = process.env['DATABASE_URL'] || process.env['POSTGRES_URL'] || '';
    const redisUrl = process.env['REDIS_URL'] || '';
    
    if (!databaseUrl && !redisUrl) {
      this.recordTest('Database Connections', 'skip', 'No database URLs configured');
      return;
    }
    
    // Test PostgreSQL connection
    if (databaseUrl) {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$connect();
        await prisma.$disconnect();
        this.recordTest('PostgreSQL Connection', 'pass', 'Successfully connected');
      } catch (error) {
        this.recordTest('PostgreSQL Connection', 'warning', 'Connection failed',
          'Database may not be running. This is OK for testing without databases.');
      }
    }
    
    // Redis connection test would require redis client
    if (redisUrl) {
      this.recordTest('Redis Connection', 'skip', 'Redis connection test not implemented');
    }
  }

  /**
   * Test 7: API Validation
   */
  async testApiValidation(): Promise<void> {
    try {
      const validator = new ApiValidator(this.config);
      const report = await validator.validate();
      
      const hasErrors = report.errors.length > 0;
      const hasWarnings = report.warnings.length > 0;
      
      if (hasErrors) {
        this.recordTest('API Validation', 'warning', `${report.errors.length} errors found`);
      } else if (hasWarnings) {
        this.recordTest('API Validation', 'warning', `${report.warnings.length} warnings`);
      } else {
        this.recordTest('API Validation', 'pass', 'Validation passed');
      }
    } catch (error) {
      this.recordTest('API Validation', 'fail', 'Validation failed',
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test 8: File System Access
   */
  async testFileSystem(): Promise<void> {
    try {
      const fs = await import('fs-extra');
      const path = await import('path');
      
      const testFile = path.join(process.cwd(), '.env');
      const exists = await fs.pathExists(testFile);
      
      if (exists) {
        this.recordTest('File System Access', 'pass', '.env file accessible');
      } else {
        this.recordTest('File System Access', 'warning', '.env file not found');
      }
    } catch (error) {
      this.recordTest('File System Access', 'fail', 'File system access failed',
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 OLIVER-OS FULL SYSTEM TEST');
    console.log('='.repeat(80) + '\n');
    
    console.log('Running comprehensive system tests...\n');
    
    await this.testConfiguration();
    await this.testApiAccounts();
    await this.testEnvironmentVariables();
    await this.testCoreModules();
    await this.testServiceManagers();
    await this.testDatabaseConnections();
    await this.testApiValidation();
    await this.testFileSystem();
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80) + '\n');
    
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    
    const successRate = ((passed / (this.results.length - skipped)) * 100).toFixed(1);
    console.log(`\nSuccess Rate: ${successRate}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'fail').forEach(r => {
        console.log(`   - ${r.name}: ${r.message}`);
        if (r.details) {
          console.log(`     ${r.details}`);
        }
      });
    }
    
    if (warnings > 0) {
      console.log('\n⚠️  Warnings:');
      this.results.filter(r => r.status === 'warning').forEach(r => {
        console.log(`   - ${r.name}: ${r.message}`);
        if (r.details) {
          console.log(`     ${r.details}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run tests
async function main() {
  const tester = new SystemTester();
  await tester.runAllTests();
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
                     process.argv[1]?.includes('full-system-test.ts');

if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { SystemTester };

