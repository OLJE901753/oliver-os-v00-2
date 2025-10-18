/**
 * Test script for Oliver-OS MCP Server
 * Tests the MCP server functionality and tool integration
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🧪 Testing Oliver-OS MCP Server...\n');

// Test MCP server startup
async function testMCPServerStartup() {
  console.log('1️⃣ Testing MCP server startup...');
  
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('npx', ['tsx', 'src/mcp/index.ts', 'stdio'], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Send a test request
    setTimeout(() => {
      const testRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      };

      mcpProcess.stdin.write(JSON.stringify(testRequest) + '\n');
    }, 1000);

    // Wait for response
    setTimeout(() => {
      mcpProcess.kill();
      
      if (output.includes('MCP Server started') || output.includes('jsonrpc')) {
        console.log('✅ MCP server startup test passed');
        resolve(true);
      } else {
        console.log('❌ MCP server startup test failed');
        console.log('Output:', output);
        console.log('Error:', errorOutput);
        reject(new Error('MCP server failed to start'));
      }
    }, 3000);
  });
}

// Test tool listing
async function testToolListing() {
  console.log('2️⃣ Testing tool listing...');
  
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('npx', ['tsx', 'src/mcp/index.ts', 'stdio'], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';

    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Send tools/list request
    setTimeout(() => {
      const toolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      };

      mcpProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');
    }, 1000);

    // Wait for response
    setTimeout(() => {
      mcpProcess.kill();
      
      if (output.includes('tools') && output.includes('analyze_thought_patterns')) {
        console.log('✅ Tool listing test passed');
        resolve(true);
      } else {
        console.log('❌ Tool listing test failed');
        console.log('Output:', output);
        reject(new Error('Tool listing failed'));
      }
    }, 3000);
  });
}

// Test tool execution
async function testToolExecution() {
  console.log('3️⃣ Testing tool execution...');
  
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('npx', ['tsx', 'src/mcp/index.ts', 'stdio'], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';

    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Send tool call request
    setTimeout(() => {
      const toolCallRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_system_status',
          arguments: {
            includeDetails: true
          }
        }
      };

      mcpProcess.stdin.write(JSON.stringify(toolCallRequest) + '\n');
    }, 1000);

    // Wait for response
    setTimeout(() => {
      mcpProcess.kill();
      
      if (output.includes('status') && output.includes('healthy')) {
        console.log('✅ Tool execution test passed');
        resolve(true);
      } else {
        console.log('❌ Tool execution test failed');
        console.log('Output:', output);
        reject(new Error('Tool execution failed'));
      }
    }, 3000);
  });
}

// Test resource listing
async function testResourceListing() {
  console.log('4️⃣ Testing resource listing...');
  
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('npx', ['tsx', 'src/mcp/index.ts', 'stdio'], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';

    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Send resources/list request
    setTimeout(() => {
      const resourcesRequest = {
        jsonrpc: '2.0',
        id: 4,
        method: 'resources/list'
      };

      mcpProcess.stdin.write(JSON.stringify(resourcesRequest) + '\n');
    }, 1000);

    // Wait for response
    setTimeout(() => {
      mcpProcess.kill();
      
      if (output.includes('resources') && output.includes('oliver-os://')) {
        console.log('✅ Resource listing test passed');
        resolve(true);
      } else {
        console.log('❌ Resource listing test failed');
        console.log('Output:', output);
        reject(new Error('Resource listing failed'));
      }
    }, 3000);
  });
}

// Run all tests
async function runAllTests() {
  try {
    await testMCPServerStartup();
    await testToolListing();
    await testToolExecution();
    await testResourceListing();
    
    console.log('\n🎉 All MCP server tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Server startup');
    console.log('✅ Tool listing');
    console.log('✅ Tool execution');
    console.log('✅ Resource listing');
    
    console.log('\n🚀 MCP Server is ready for integration!');
    
  } catch (error) {
    console.log('\n❌ MCP server tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
