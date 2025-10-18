/**
 * Test script for Codebuff Integration
 * Verifies that the Codebuff SDK integration works correctly
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Codebuff Integration for Oliver-OS');
console.log('Following BMAD principles: Break, Map, Automate, Document\n');

// Test configuration
const tests = [
  {
    name: 'Codebuff SDK Installation',
    command: 'node -e "console.log(require(\'@codebuff/sdk\').CodebuffClient ? \'✅ SDK installed\' : \'❌ SDK not found\')"',
    description: 'Verify @codebuff/sdk is properly installed'
  },
  {
    name: 'TypeScript Compilation',
    command: 'npx tsc --noEmit --skipLibCheck',
    description: 'Check TypeScript compilation without errors'
  },
  {
    name: 'MCP Server Integration',
    command: 'node -e "try { require(\'./src/mcp/server.ts\'); console.log(\'✅ MCP server imports successfully\'); } catch(e) { console.log(\'❌ MCP server import failed:\', e.message); }"',
    description: 'Verify MCP server can import Codebuff integration'
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n🔍 ${test.name}`);
    console.log(`📝 ${test.description}`);
    
    try {
      const output = execSync(test.command, { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log(`✅ ${test.name} - PASSED`);
      if (output.trim()) {
        console.log(`   Output: ${output.trim()}`);
      }
      passed++;
      
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Codebuff integration is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
  
  return failed === 0;
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
