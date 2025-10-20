/**
 * Global E2E Test Teardown
 * Runs once after all E2E tests
 */

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

export default async function globalTeardown() {
  console.log('🧹 Global E2E Test Teardown');
  console.log('===========================');

  // Clean up test database
  await cleanupTestDatabase();

  // Clean up test results (optional)
  if (process.env.CLEANUP_TEST_RESULTS === 'true') {
    await cleanupTestResults();
  }

  console.log('✅ Global teardown complete');
}

async function cleanupTestDatabase() {
  console.log('🗄️  Cleaning up test database...');

  try {
    // Drop test database
    execSync('dropdb oliver_os_test 2>/dev/null || true', { stdio: 'pipe' });
    console.log('  ✅ Test database cleaned up');
  } catch (error) {
    console.log('  ⚠️  Failed to clean up test database (this is usually fine)');
  }
}

async function cleanupTestResults() {
  console.log('📁 Cleaning up test results...');

  try {
    const resultsDir = join(process.cwd(), 'test-results');
    if (existsSync(resultsDir)) {
      rmSync(resultsDir, { recursive: true, force: true });
      console.log('  ✅ Test results cleaned up');
    }
  } catch (error) {
    console.log('  ⚠️  Failed to clean up test results');
  }
}
