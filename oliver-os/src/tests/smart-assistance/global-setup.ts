/**
 * Global Test Setup for Smart Assistance
 * Global setup and teardown for all smart assistance tests
 * Following BMAD principles: Break, Map, Automate, Document
 */

import fs from 'fs-extra';
import path from 'path';

export default async function setup() {
  console.log('🚀 Setting up Smart Assistance Test Environment...');
  
  // Create test directories
  const testDirs = [
    'test-temp',
    'test-coverage',
    'test-results',
    'test-backups'
  ];
  
  for (const dir of testDirs) {
    const dirPath = path.join(process.cwd(), dir);
    await fs.ensureDir(dirPath);
    console.log(`📁 Created test directory: ${dir}`);
  }
  
  // Set up test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['TEST_MODE'] = 'true';
  process.env['LOG_LEVEL'] = 'error'; // Reduce log noise during tests
  
  // Set up test timeouts
  process.env['TEST_TIMEOUT'] = '30000';
  
  console.log('✅ Smart Assistance Test Environment Ready');
}

export async function teardown() {
  console.log('🧹 Cleaning up Smart Assistance Test Environment...');
  
  // Clean up test directories
  const testDirs = [
    'test-temp',
    'test-coverage',
    'test-results',
    'test-backups'
  ];
  
  for (const dir of testDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (await fs.pathExists(dirPath)) {
      await fs.remove(dirPath);
      console.log(`🗑️ Cleaned up test directory: ${dir}`);
    }
  }
  
  // Reset environment variables
  delete process.env['TEST_MODE'];
  delete process.env['TEST_TIMEOUT'];
  
  console.log('✅ Smart Assistance Test Environment Cleaned Up');
}
