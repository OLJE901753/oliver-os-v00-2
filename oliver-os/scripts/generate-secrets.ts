/**
 * Generate Secure Secrets for Oliver-OS
 * Generates cryptographically secure random strings for JWT secrets and API keys
 */

import * as crypto from 'crypto';
import fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../src/core/logger';

const logger = new Logger('GenerateSecrets');

interface SecretConfig {
  name: string;
  envVar: string;
  length: number;
  description: string;
}

const SECRETS: SecretConfig[] = [
  {
    name: 'JWT Secret',
    envVar: 'JWT_SECRET',
    length: 64,
    description: 'Secret key for signing JWT access tokens'
  },
  {
    name: 'JWT Refresh Secret',
    envVar: 'JWT_REFRESH_SECRET',
    length: 64,
    description: 'Secret key for signing JWT refresh tokens'
  },
  {
    name: 'Secret Key (AI Services)',
    envVar: 'SECRET_KEY',
    length: 64,
    description: 'Secret key for AI services authentication'
  }
];

/**
 * Generate a cryptographically secure random string
 */
function generateSecret(length: number): string {
  const bytes = crypto.randomBytes(length);
  // Convert to base64url format (URL-safe, no padding)
  return bytes.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

/**
 * Update .env file with new secrets
 */
async function updateEnvFile(secrets: Map<string, string>, dryRun: boolean = false): Promise<void> {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'env.example');
  
  let envContent = '';
  let envFileExists = false;

  // Read existing .env file if it exists
  try {
    if (await fs.pathExists(envPath)) {
      envFileExists = true;
      envContent = await fs.readFile(envPath, 'utf-8');
      logger.info(`📄 Found existing .env file`);
    } else {
      // If .env doesn't exist, try to use env.example as template
      if (await fs.pathExists(envExamplePath)) {
        envContent = await fs.readFile(envExamplePath, 'utf-8');
        logger.info(`📄 Using env.example as template`);
      } else {
        envContent = '# Oliver-OS Environment Configuration\n';
        logger.info(`📄 Creating new .env file`);
      }
    }
  } catch (error) {
    logger.warn(`Could not read environment file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    envContent = '# Oliver-OS Environment Configuration\n';
  }

  // Update or add secrets
  const lines = envContent.split('\n');
  const updatedLines: string[] = [];
  const updatedSecrets = new Set<string>();
  const seenKeys = new Set<string>(); // Track which keys we've seen

  for (const line of lines) {
    let updated = false;
    let isSecretLine = false;
    
    for (const [envVar, value] of secrets.entries()) {
      // Match the env var at start of line (with optional spaces)
      const regex = new RegExp(`^\\s*${envVar}\\s*=.*$`);
      if (regex.test(line)) {
        // Only add the first occurrence, skip duplicates
        if (!seenKeys.has(envVar)) {
          updatedLines.push(`${envVar}="${value}"`);
          updatedSecrets.add(envVar);
          seenKeys.add(envVar);
          updated = true;
        }
        isSecretLine = true;
        break;
      }
    }
    
    if (!updated && !isSecretLine) {
      updatedLines.push(line);
    }
  }

  // Add any secrets that weren't in the file
  for (const [envVar, value] of secrets.entries()) {
    if (!updatedSecrets.has(envVar)) {
      // Find a good place to insert (after comments or at end)
      let insertIndex = updatedLines.length;
      
      // Try to insert after security section comment
      for (let i = 0; i < updatedLines.length; i++) {
        if (updatedLines[i].includes('Security') || updatedLines[i].includes('Authentication')) {
          insertIndex = i + 1;
          break;
        }
      }
      
      updatedLines.splice(insertIndex, 0, `${envVar}="${value}"`);
    }
  }

  const newContent = updatedLines.join('\n');

  if (dryRun) {
    logger.info('🔍 DRY RUN - Would update .env file with:');
    console.log('\n' + '='.repeat(80));
    for (const [envVar, value] of secrets.entries()) {
      console.log(`${envVar}="${value}"`);
    }
    console.log('='.repeat(80) + '\n');
  } else {
    await fs.outputFile(envPath, newContent, 'utf-8');
    logger.info(`✅ Updated .env file with ${secrets.size} secrets`);
  }
}

/**
 * Generate all secrets
 */
async function generateAllSecrets(dryRun: boolean = false): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 OLIVER-OS SECRET GENERATOR');
  console.log('='.repeat(80) + '\n');

  const secrets = new Map<string, string>();

  logger.info('Generating secure random secrets...\n');

  for (const secretConfig of SECRETS) {
    const secret = generateSecret(secretConfig.length);
    secrets.set(secretConfig.envVar, secret);
    
    console.log(`✅ Generated ${secretConfig.name}`);
    console.log(`   Variable: ${secretConfig.envVar}`);
    console.log(`   Length: ${secretConfig.length} characters`);
    console.log(`   Description: ${secretConfig.description}`);
    if (!dryRun) {
      console.log(`   Value: ${secret.substring(0, 8)}...${secret.substring(secret.length - 8)}`);
    }
    console.log('');
  }

  if (!dryRun) {
    await updateEnvFile(secrets, false);
    console.log('\n✅ All secrets have been generated and saved to .env file');
    console.log('⚠️  IMPORTANT: Keep these secrets secure and never commit them to version control!');
  } else {
    await updateEnvFile(secrets, true);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  try {
    await generateAllSecrets(dryRun);
    process.exit(0);
  } catch (error) {
    logger.error('Failed to generate secrets:', error);
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
                     process.argv[1]?.includes('generate-secrets.ts');

if (isMainModule) {
  main();
}

export { generateSecret, generateAllSecrets };

