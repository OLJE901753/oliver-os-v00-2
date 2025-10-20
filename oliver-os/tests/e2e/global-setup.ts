/**
 * Global E2E Test Setup
 * Runs once before all E2E tests
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export default async function globalSetup() {
  console.log('🌍 Global E2E Test Setup');
  console.log('========================');

  // Check if required services are running
  await checkRequiredServices();

  // Setup test database
  await setupTestDatabase();

  // Create test results directory
  const resultsDir = join(process.cwd(), 'test-results');
  if (!existsSync(resultsDir)) {
    execSync(`mkdir -p "${resultsDir}"`, { stdio: 'inherit' });
  }

  console.log('✅ Global setup complete\n');
}

async function checkRequiredServices() {
  console.log('🔍 Checking required services...');

  const services = [
    { name: 'PostgreSQL', port: 5432, command: 'pg_isready' },
    { name: 'Redis', port: 6379, command: 'redis-cli ping' }
  ];

  for (const service of services) {
    try {
      execSync(service.command, { stdio: 'pipe' });
      console.log(`  ✅ ${service.name} is running`);
    } catch (error) {
      console.log(`  ❌ ${service.name} is not running`);
      console.log(`     Please start ${service.name} before running E2E tests`);
      console.log(`     You can start it with: cd database && docker-compose up -d`);
      throw new Error(`${service.name} is required for E2E tests`);
    }
  }
}

async function setupTestDatabase() {
  console.log('🗄️  Setting up test database...');

  try {
    // Create test database if it doesn't exist
    execSync('createdb oliver_os_test 2>/dev/null || true', { stdio: 'pipe' });
    
    // Run Prisma migrations for test database
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/oliver_os_test';
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    // Seed test database
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    console.log('  ✅ Test database setup complete');
  } catch (error) {
    console.log('  ❌ Failed to setup test database');
    console.log('     Make sure PostgreSQL is running and accessible');
    throw error;
  }
}
