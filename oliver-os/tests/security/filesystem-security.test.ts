/**
 * Security Test for Filesystem MCP Server Path Validation
 * Tests path traversal protection and file system access restrictions
 */

import { FilesystemMCPServer } from '../../src/mcp/servers/filesystem';
import * as path from 'path';
import fs from 'fs-extra';
import * as os from 'os';

async function testPathTraversalProtection() {
  console.log('🔒 Testing Path Traversal Protection\n');
  console.log('='.repeat(80));
  
  // Create a temporary test directory
  const testBaseDir = path.join(os.tmpdir(), 'oliver-os-security-test');
  await fs.ensureDir(testBaseDir);
  
  // Create a test file inside the base directory
  const safeFile = path.join(testBaseDir, 'safe-file.txt');
  await fs.writeFile(safeFile, 'This is a safe file');
  
  // Create a file outside the base directory (simulating system files)
  const outsideDir = path.join(os.tmpdir(), 'outside-test');
  await fs.ensureDir(outsideDir);
  const dangerousFile = path.join(outsideDir, 'dangerous-file.txt');
  await fs.writeFile(dangerousFile, 'This should not be accessible');
  
  const server = new FilesystemMCPServer(testBaseDir);
  
  const testCases = [
    {
      name: 'Normal file access (should work)',
      path: 'safe-file.txt',
      shouldSucceed: true
    },
    {
      name: 'Path traversal attempt 1',
      path: '../../etc/passwd',
      shouldSucceed: false
    },
    {
      name: 'Path traversal attempt 2',
      path: '..\\..\\windows\\system32\\config\\sam',
      shouldSucceed: false
    },
    {
      name: 'Path traversal attempt 3',
      path: '../outside-test/dangerous-file.txt',
      shouldSucceed: false
    },
    {
      name: 'Absolute path attempt',
      path: dangerousFile,
      shouldSucceed: false
    },
    {
      name: 'Multiple traversal attempts',
      path: '../../../../../../etc/passwd',
      shouldSucceed: false
    },
    {
      name: 'Mixed traversal',
      path: './.././../etc/passwd',
      shouldSucceed: false
    },
    {
      name: 'Nested safe path',
      path: 'subdir/file.txt',
      shouldSucceed: true
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      // Try to resolve the path
      const resolved = (server as any).resolvePath(testCase.path);
      
      // If it should succeed, verify the path is within base directory
      if (testCase.shouldSucceed) {
        if (resolved.startsWith(testBaseDir)) {
          console.log(`✅ PASS: ${testCase.name}`);
          console.log(`   Path: ${testCase.path} -> ${resolved}`);
          passed++;
        } else {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log(`   Path resolved outside base directory: ${resolved}`);
          failed++;
        }
      } else {
        // If it should fail but didn't throw, that's a security issue
        console.log(`❌ FAIL: ${testCase.name}`);
        console.log(`   Path traversal should have been blocked but wasn't!`);
        console.log(`   Resolved to: ${resolved}`);
        failed++;
      }
    } catch (error: any) {
      if (testCase.shouldSucceed) {
        console.log(`❌ FAIL: ${testCase.name}`);
        console.log(`   Should have succeeded but threw: ${error.message}`);
        failed++;
      } else {
        console.log(`✅ PASS: ${testCase.name}`);
        console.log(`   Correctly blocked: ${error.message}`);
        passed++;
      }
    }
    console.log('');
  }
  
  // Test actual file operations
  console.log('='.repeat(80));
  console.log('\n📁 Testing File Operations Protection\n');
  
  const fileOperationTests = [
    {
      name: 'Read safe file',
      operation: 'read',
      args: { path: 'safe-file.txt' },
      shouldSucceed: true
    },
    {
      name: 'Read with path traversal',
      operation: 'read',
      args: { path: '../../etc/passwd' },
      shouldSucceed: false
    },
    {
      name: 'Write safe file',
      operation: 'write',
      args: { path: 'test-write.txt', content: 'test content' },
      shouldSucceed: true
    },
    {
      name: 'Write with path traversal',
      operation: 'write',
      args: { path: '../../dangerous.txt', content: 'hacked' },
      shouldSucceed: false
    },
    {
      name: 'Delete safe file',
      operation: 'delete',
      args: { path: 'test-write.txt' },
      shouldSucceed: true
    },
    {
      name: 'Delete with path traversal',
      operation: 'delete',
      args: { path: '../../outside-test/dangerous-file.txt' },
      shouldSucceed: false
    }
  ];
  
  for (const test of fileOperationTests) {
    try {
      let result;
      switch (test.operation) {
        case 'read':
          result = await (server as any).handleReadFile(test.args);
          break;
        case 'write':
          result = await (server as any).handleWriteFile(test.args);
          break;
        case 'delete':
          result = await (server as any).handleDeleteFile(test.args);
          break;
      }
      
      if (test.shouldSucceed) {
        console.log(`✅ PASS: ${test.name}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Should have been blocked but operation succeeded`);
        failed++;
      }
    } catch (error: any) {
      if (test.shouldSucceed) {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Should have succeeded but threw: ${error.message}`);
        failed++;
      } else {
        console.log(`✅ PASS: ${test.name}`);
        console.log(`   Correctly blocked: ${error.message}`);
        passed++;
      }
    }
  }
  
  // Cleanup
  await fs.remove(testBaseDir);
  await fs.remove(outsideDir);
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All security tests passed! Path traversal protection is working correctly.');
    return 0;
  } else {
    console.log('\n⚠️  Some tests failed! Security vulnerabilities may exist.');
    return 1;
  }
}

// Run tests
testPathTraversalProtection()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });

export { testPathTraversalProtection };
