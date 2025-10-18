/**
 * Codebuff Integration Example for Oliver-OS
 * Demonstrates how to use the Codebuff SDK with Oliver-OS AI-brain interface
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { CodebuffClient } from '@codebuff/sdk';
import { Config } from '../src/core/config';
import { CodebuffService } from '../src/services/codebuff/codebuff-service';
import type { 
  CodebuffRunOptions, 
  AgentSpawnRequest, 
  WorkflowDefinition 
} from '../src/services/codebuff/types';

// Initialize Oliver-OS configuration
const config = new Config();
config.set('codebuff.apiKey', process.env.CODEBUFF_API_KEY || 'your-api-key');
config.set('codebuff.timeout', 300000);
config.set('codebuff.retries', 3);

// Initialize Codebuff service
const codebuffService = new CodebuffService(config);

/**
 * Example 1: Basic Codebuff SDK Usage
 * Following BMAD: Break down the task, Map dependencies, Automate execution, Document results
 */
async function basicCodebuffExample() {
  console.log('🚀 Basic Codebuff Example');
  
  // 1. Initialize the client (as shown in your example)
  const client = new CodebuffClient({
    apiKey: process.env.CODEBUFF_API_KEY || 'your-api-key',
    cwd: process.cwd(),
    onError: (error) => console.error('Codebuff error:', error.message),
  });

  // 2. Do a coding task...
  const result = await client.run({
    agent: 'base', // Codebuff's base coding agent
    prompt: 'Add comprehensive error handling to all API endpoints',
    handleEvent: (event) => {
      console.log('Progress', event);
    },
  });

  console.log('✅ Basic task completed:', result);
}

/**
 * Example 2: Custom Agent Definition
 * Following BMAD: Break down requirements, Map agent capabilities, Automate spawning, Document agent
 */
async function customAgentExample() {
  console.log('🤖 Custom Agent Example');
  
  const client = new CodebuffClient({
    apiKey: process.env.CODEBUFF_API_KEY || 'your-api-key',
    cwd: process.cwd(),
    onError: (error) => console.error('Codebuff error:', error.message),
  });

  // Define a custom agent following BMAD principles
  const myCustomAgent = {
    id: 'oliver-os-code-generator',
    displayName: 'Oliver-OS Code Generator',
    model: 'openai/gpt-4',
    instructionsPrompt: `
      You are the Oliver-OS Code Generator, following BMAD principles:
      - Break down complex tasks into manageable pieces
      - Map out architecture and dependencies
      - Automate repetitive processes
      - Document everything thoroughly
      
      Generate high-quality, maintainable code that follows these principles.
      Always include proper error handling, logging, and documentation.
    `,
  };

  const result = await client.run({
    agent: 'oliver-os-code-generator',
    agentDefinitions: [myCustomAgent],
    prompt: 'Create a REST API endpoint for user authentication with proper error handling and validation',
    handleEvent: (event) => {
      console.log('Agent Progress', event);
    },
  });

  console.log('✅ Custom agent task completed:', result);
}

/**
 * Example 3: Using Oliver-OS Codebuff Service
 * Leveraging the integrated service with BMAD-compliant agents
 */
async function oliverOSCodebuffExample() {
  console.log('🌟 Oliver-OS Codebuff Service Example');
  
  try {
    // Spawn a bureaucracy disruptor agent
    const spawnRequest: AgentSpawnRequest = {
      agentType: 'bureaucracy-disruptor',
      capabilities: ['process-analysis', 'workflow-optimization', 'automation'],
      config: {
        priority: 'high',
        maxConcurrentTasks: 5
      },
      priority: 'high'
    };

    const agent = await codebuffService.spawnAgent(spawnRequest);
    console.log('✅ Agent spawned:', agent);

    // Run a task with the thought processor
    const taskOptions: CodebuffRunOptions = {
      agent: 'thought-processor',
      prompt: 'Analyze the current codebase structure and identify opportunities for automation and streamlining',
      timeout: 300000,
      retries: 3,
      handleEvent: (event) => {
        console.log('Task Event:', event.type, event.message);
      }
    };

    const taskResult = await codebuffService.runTask(taskOptions);
    console.log('✅ Task completed:', taskResult.success);

    // Get agent status
    const status = await codebuffService.getAgentStatus(agent.id);
    console.log('📊 Agent status:', status);

  } catch (error) {
    console.error('❌ Error in Oliver-OS example:', error);
  }
}

/**
 * Example 4: Workflow Management
 * Following BMAD: Break down workflow, Map dependencies, Automate execution, Document results
 */
async function workflowExample() {
  console.log('📋 Workflow Management Example');
  
  try {
    // Create a comprehensive code generation workflow
    const workflow: WorkflowDefinition = {
      id: 'oliver-os-code-generation-workflow',
      name: 'Oliver-OS Code Generation Workflow',
      description: 'Complete code generation workflow with review and testing',
      steps: [
        {
          agent: 'code-generator',
          prompt: 'Generate a user authentication service with proper validation and error handling'
        },
        {
          agent: 'bureaucracy-disruptor',
          prompt: 'Review the generated code for inefficiencies and optimization opportunities'
        },
        {
          agent: 'thought-processor',
          prompt: 'Analyze the code structure and extract key patterns and insights'
        },
        {
          agent: 'collaboration-coordinator',
          prompt: 'Create documentation and integration guidelines for the generated code'
        }
      ],
      agents: ['code-generator', 'bureaucracy-disruptor', 'thought-processor', 'collaboration-coordinator'],
      status: 'idle'
    };

    // Create the workflow
    const createdWorkflow = await codebuffService.createWorkflow(workflow);
    console.log('✅ Workflow created:', createdWorkflow.name);

    // Execute the workflow
    const workflowResult = await codebuffService.executeWorkflow(workflow.id);
    console.log('✅ Workflow executed:', workflowResult.success);

  } catch (error) {
    console.error('❌ Error in workflow example:', error);
  }
}

/**
 * Example 5: Agent Coordination and Management
 * Following BMAD: Break down coordination tasks, Map agent relationships, Automate management, Document processes
 */
async function agentCoordinationExample() {
  console.log('🤝 Agent Coordination Example');
  
  try {
    // Get all available agent definitions
    const agentDefinitions = codebuffService.getAgentDefinitions();
    console.log('📋 Available agents:', agentDefinitions.map(a => a.displayName));

    // Spawn multiple agents for coordinated work
    const agents = await Promise.all([
      codebuffService.spawnAgent({
        agentType: 'code-generator',
        capabilities: ['code-generation', 'architecture-mapping'],
        config: { focus: 'backend' },
        priority: 'normal'
      }),
      codebuffService.spawnAgent({
        agentType: 'thought-processor',
        capabilities: ['thought-analysis', 'pattern-recognition'],
        config: { focus: 'analysis' },
        priority: 'normal'
      }),
      codebuffService.spawnAgent({
        agentType: 'collaboration-coordinator',
        capabilities: ['agent-coordination', 'workflow-management'],
        config: { focus: 'coordination' },
        priority: 'high'
      })
    ]);

    console.log('✅ Multiple agents spawned:', agents.length);

    // Get status of all agents
    const allStatus = await codebuffService.getAgentStatus();
    console.log('📊 All agent statuses:', Array.isArray(allStatus) ? allStatus.length : 1);

    // Create a coordination workflow
    const coordinationWorkflow: WorkflowDefinition = {
      id: 'agent-coordination-workflow',
      name: 'Agent Coordination Workflow',
      description: 'Coordinate multiple agents for complex task execution',
      steps: [
        {
          agent: 'collaboration-coordinator',
          prompt: 'Coordinate the code generation and analysis tasks between all spawned agents'
        }
      ],
      agents: ['collaboration-coordinator'],
      status: 'idle'
    };

    await codebuffService.createWorkflow(coordinationWorkflow);
    console.log('✅ Coordination workflow created');

  } catch (error) {
    console.error('❌ Error in coordination example:', error);
  }
}

/**
 * Main execution function
 * Following BMAD: Break down examples, Map execution order, Automate running, Document results
 */
async function runAllExamples() {
  console.log('🌟 Starting Oliver-OS Codebuff Integration Examples');
  console.log('Following BMAD principles: Break, Map, Automate, Document\n');

  try {
    // Run examples in sequence
    await basicCodebuffExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await customAgentExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await oliverOSCodebuffExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await workflowExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await agentCoordinationExample();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  } finally {
    // Cleanup
    await codebuffService.shutdown();
    console.log('🛑 Codebuff service shutdown complete');
  }
}

// Export for use in other modules
export {
  basicCodebuffExample,
  customAgentExample,
  oliverOSCodebuffExample,
  workflowExample,
  agentCoordinationExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
