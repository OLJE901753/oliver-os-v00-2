/**
 * Test Script for CodeBuff SDK Agent Spawning
 * Demonstrates how to use the agent spawning functionality
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const AI_SERVICES_URL = 'http://localhost:8000';

async function testAgentSpawning() {
  console.log('🚀 Testing CodeBuff SDK Agent Spawning in Oliver-OS\n');

  try {
    // Test 1: Get available agent types
    console.log('📋 Test 1: Getting available agent types...');
    const agentsResponse = await fetch(`${BASE_URL}/api/agents`);
    const agents = await agentsResponse.json();
    
    if (agents.success) {
      console.log(`✅ Found ${agents.data.count} agent types:`);
      agents.data.agents.forEach(agent => {
        console.log(`   - ${agent.displayName} (${agent.id})`);
      });
    } else {
      console.log('❌ Failed to get agents:', agents.error);
    }

    console.log('\n');

    // Test 2: Spawn a code generator agent
    console.log('🔧 Test 2: Spawning code generator agent...');
    const spawnResponse = await fetch(`${BASE_URL}/api/agents/spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentType: 'code-generator',
        prompt: 'Generate a simple user authentication middleware for Express.js with JWT token validation',
        metadata: {
          framework: 'express',
          language: 'typescript',
          security: 'jwt'
        }
      })
    });

    const spawnResult = await spawnResponse.json();
    if (spawnResult.success) {
      console.log('✅ Code generator agent spawned successfully!');
      console.log(`   Agent ID: ${spawnResult.data.id}`);
      console.log(`   Status: ${spawnResult.data.status}`);
      console.log(`   Result: ${JSON.stringify(spawnResult.data.result, null, 2)}`);
    } else {
      console.log('❌ Failed to spawn agent:', spawnResult.error);
    }

    console.log('\n');

    // Test 3: Spawn multiple agents for a complete workflow
    console.log('🔄 Test 3: Spawning multiple agents for complete workflow...');
    const multipleSpawnResponse = await fetch(`${BASE_URL}/api/agents/spawn-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            agentType: 'code-generator',
            prompt: 'Create a REST API endpoint for managing user profiles'
          },
          {
            agentType: 'test-generator',
            prompt: 'Generate unit tests for the user profile API'
          },
          {
            agentType: 'documentation-generator',
            prompt: 'Create API documentation for the user profile endpoints'
          }
        ]
      })
    });

    const multipleSpawnResult = await multipleSpawnResponse.json();
    if (multipleSpawnResult.success) {
      console.log('✅ Multiple agents spawned successfully!');
      console.log(`   Spawned ${multipleSpawnResult.data.count} agents:`);
      multipleSpawnResult.data.spawned_agents.forEach(agent => {
        console.log(`   - ${agent.agentType} (${agent.id}): ${agent.status}`);
      });
    } else {
      console.log('❌ Failed to spawn multiple agents:', multipleSpawnResult.error);
    }

    console.log('\n');

    // Test 4: Get spawned agents status
    console.log('📊 Test 4: Getting spawned agents status...');
    const spawnedResponse = await fetch(`${BASE_URL}/api/agents/spawned`);
    const spawnedAgents = await spawnedResponse.json();
    
    if (spawnedAgents.success) {
      console.log(`✅ Found ${spawnedAgents.data.count} spawned agents:`);
      spawnedAgents.data.spawned_agents.forEach(agent => {
        console.log(`   - ${agent.agentType} (${agent.id})`);
        console.log(`     Status: ${agent.status}`);
        console.log(`     Started: ${agent.startTime}`);
        if (agent.result) {
          console.log(`     Has result: ✅`);
        }
      });
    } else {
      console.log('❌ Failed to get spawned agents:', spawnedAgents.error);
    }

    console.log('\n');

    // Test 5: Test AI Services agent spawning
    console.log('🧠 Test 5: Testing AI Services agent spawning...');
    try {
      const aiSpawnResponse = await fetch(`${AI_SERVICES_URL}/api/agents/spawn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: 'thought-processor',
          prompt: 'Process this thought: "I need to optimize our database queries to improve application performance"',
          metadata: {
            domain: 'database',
            priority: 'high',
            category: 'performance'
          }
        })
      });

      const aiSpawnResult = await aiSpawnResponse.json();
      console.log('✅ AI Services agent spawned successfully!');
      console.log(`   Agent ID: ${aiSpawnResult.id}`);
      console.log(`   Status: ${aiSpawnResult.status}`);
      if (aiSpawnResult.result) {
        console.log(`   Insights: ${aiSpawnResult.result.insights?.length || 0} insights generated`);
      }
    } catch (error) {
      console.log('⚠️  AI Services not available (this is expected if not running):', error.message);
    }

    console.log('\n');

    // Test 6: Get agent health status
    console.log('🏥 Test 6: Getting agent health status...');
    const healthResponse = await fetch(`${BASE_URL}/api/agents/health/status`);
    const health = await healthResponse.json();
    
    if (health.success) {
      console.log('✅ Agent system health status:');
      console.log(`   Total agent types: ${health.data.total_agent_types}`);
      console.log(`   Total spawned agents: ${health.data.total_spawned_agents}`);
      console.log(`   Running agents: ${health.data.running_agents}`);
      console.log(`   Completed agents: ${health.data.completed_agents}`);
      console.log(`   Failed agents: ${health.data.failed_agents}`);
    } else {
      console.log('❌ Failed to get health status:', health.error);
    }

    console.log('\n🎉 Agent spawning tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Make sure Oliver-OS is running on port 3000');
  }
}

// Run the test
if (require.main === module) {
  testAgentSpawning().catch(console.error);
}

module.exports = { testAgentSpawning };
