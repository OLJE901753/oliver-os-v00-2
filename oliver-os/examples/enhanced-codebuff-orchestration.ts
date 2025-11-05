/**
 * Enhanced Codebuff Orchestration Example
 * Demonstrates end-to-end agent orchestration with MCP tool integration
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EnhancedCodebuffService } from '../src/services/codebuff/enhanced-codebuff-service';
import { Config } from '../src/core/config';
import { Logger } from '../src/core/logger';
import type { 
  CodebuffRunOptions, 
  WorkflowDefinition,
  OliverOSAgentDefinition
} from '../src/services/codebuff/types';

export class OrchestrationExample {
  private codebuffService: EnhancedCodebuffService;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('OrchestrationExample');
    const config = new Config();
    this.codebuffService = new EnhancedCodebuffService(config);
  }

  /**
   * Initialize the orchestration system
   */
  async initialize(): Promise<void> {
    this.logger.info('🚀 Initializing Enhanced Codebuff Orchestration Example...');
    
    try {
      await this.codebuffService.initialize();
      await this.setupExampleWorkflows();
      await this.setupExampleAgents();
      
      this.logger.info('✅ Orchestration system initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to initialize orchestration system: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Example 1: Simple Agent Task with MCP Tools
   */
  async runSimpleTask(): Promise<void> {
    this.logger.info('📝 Running Example 1: Simple Agent Task with MCP Tools');
    
    const options: CodebuffRunOptions = {
      agent: 'code-generator',
      prompt: 'Create a simple TypeScript function that reads a file and returns its content. Use the filesystem tools available.',
      handleEvent: (event: { type: string; message: string; toolName?: string }) => {
        this.logger.info(`📡 Event: ${event.type} - ${event.message}`);
      }
    };

    try {
      const result = await this.codebuffService.orchestrateTask(options);
      
      if (result.success) {
        this.logger.info('✅ Simple task completed successfully');
        this.logger.info(`📊 Duration: ${result.duration}ms`);
        this.logger.info(`📄 Output: ${result.output?.substring(0, 200)}...`);
        this.logger.info(`🔧 Tools used: ${result.events.filter(e => e.type === 'tool_called').length}`);
      } else {
        this.logger.error(`❌ Simple task failed: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Simple task execution failed: ${errorMessage}`);
    }
  }

  /**
   * Example 2: Multi-Agent Workflow
   */
  async runMultiAgentWorkflow(): Promise<void> {
    this.logger.info('🔄 Running Example 2: Multi-Agent Workflow');
    
    try {
      // Spawn multiple agents
      const codeGenerator = await this.codebuffService.spawnAgent({
        agentType: 'code-generator',
        capabilities: ['code-generation', 'file-operations'],
        config: { priority: 'high' },
        priority: 'high'
      });

      const reviewer = await this.codebuffService.spawnAgent({
        agentType: 'code-reviewer',
        capabilities: ['code-review', 'quality-analysis'],
        config: { priority: 'normal' },
        priority: 'normal'
      });

      this.logger.info(`🤖 Spawned agents: ${codeGenerator.id}, ${reviewer.id}`);

      // Execute workflow
      const workflowResult = await this.codebuffService.executeWorkflow('code-generation-workflow');
      
      if (workflowResult.success) {
        this.logger.info('✅ Multi-agent workflow completed successfully');
        this.logger.info(`📊 Duration: ${workflowResult.duration}ms`);
        this.logger.info(`📄 Artifacts: ${workflowResult.artifacts?.length || 0}`);
      } else {
        this.logger.error('❌ Multi-agent workflow failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Multi-agent workflow execution failed: ${errorMessage}`);
    }
  }

  /**
   * Example 3: Tool Integration Demo
   */
  async runToolIntegrationDemo(): Promise<void> {
    this.logger.info('🔧 Running Example 3: Tool Integration Demo');
    
    try {
      // Demonstrate filesystem tools
      const fsResult = await this.codebuffService.orchestrateTask({
        agent: 'code-generator',
        prompt: 'Create a new directory called "test-output" and write a simple README.md file in it',
        handleEvent: (event: { type: string; message: string; toolName?: string }) => {
          if (event.type === 'tool_called' && event.toolName) {
            this.logger.info(`🔧 Tool called: ${event.toolName}`);
          }
        }
      });

      if (fsResult.success) {
        this.logger.info('✅ Filesystem tool integration successful');
      }

      // Demonstrate memory tools
      const memoryResult = await this.codebuffService.orchestrateTask({
        agent: 'thought-processor',
        prompt: 'Store the concept "BMAD methodology" in memory with a detailed explanation',
        handleEvent: (event) => {
          if (event.type === 'tool_called') {
            this.logger.info(`🧠 Memory tool called: ${event.toolName}`);
          }
        }
      });

      if (memoryResult.success) {
        this.logger.info('✅ Memory tool integration successful');
      }

      // Demonstrate terminal tools
      const terminalResult = await this.codebuffService.orchestrateTask({
        agent: 'bureaucracy-disruptor',
        prompt: 'Run a simple command to check the current directory and list files',
        handleEvent: (event) => {
          if (event.type === 'tool_called') {
            this.logger.info(`💻 Terminal tool called: ${event.toolName}`);
          }
        }
      });

      if (terminalResult.success) {
        this.logger.info('✅ Terminal tool integration successful');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Tool integration demo failed: ${errorMessage}`);
    }
  }

  /**
   * Example 4: System Monitoring and Metrics
   */
  async runSystemMonitoringDemo(): Promise<void> {
    this.logger.info('📊 Running Example 4: System Monitoring and Metrics');
    
    try {
      // Get system metrics
      const metrics = await this.codebuffService.getSystemMetrics();
      
      this.logger.info('📊 System Metrics:');
      this.logger.info(`  Agents: ${metrics.agents.total} total, ${metrics.agents.active} active`);
      this.logger.info(`  Workflows: ${metrics.workflows.total} total, ${metrics.workflows.running} running`);
      this.logger.info(`  Tools: ${metrics.tools.totalCalls} calls, ${(metrics.tools.successRate * 100).toFixed(1)}% success rate`);
      this.logger.info(`  System: ${Math.round(metrics.system.memoryUsage / 1024 / 1024)}MB memory, ${Math.round(metrics.system.uptime)}s uptime`);

      // Get agent status
      const agentStatus = await this.codebuffService.getAgentStatus();
      this.logger.info(`📋 Agent Status: ${Array.isArray(agentStatus) ? agentStatus.length : 1} agents`);

      // Get available tools
      // Note: toolRegistry is private, using getSystemMetrics to get tool information
      this.logger.info(`🔧 Tool information available via system metrics`);
      
      // Tool details not directly accessible via public API

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ System monitoring demo failed: ${errorMessage}`);
    }
  }

  /**
   * Setup example workflows
   */
  private async setupExampleWorkflows(): Promise<void> {
    const codeGenerationWorkflow: WorkflowDefinition = {
      id: 'code-generation-workflow',
      name: 'Code Generation Workflow',
      description: 'A complete workflow for generating, reviewing, and testing code',
      steps: [
        {
          id: 'step-1',
          agent: 'code-generator',
          prompt: 'Generate a TypeScript utility function for file operations',
          tools: ['write_file', 'create_directory'],
          timeout: 30000
        },
        {
          id: 'step-2',
          agent: 'code-reviewer',
          prompt: 'Review the generated code for best practices and improvements',
          dependencies: ['step-1'],
          tools: ['read_file'],
          timeout: 20000
        },
        {
          id: 'step-3',
          agent: 'test-generator',
          prompt: 'Generate unit tests for the utility function',
          dependencies: ['step-2'],
          tools: ['write_file'],
          timeout: 25000
        }
      ],
      agents: ['code-generator', 'code-reviewer', 'test-generator'],
      status: 'idle',
      metadata: {
        category: 'development',
        complexity: 'medium',
        estimatedDuration: 75000
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionHistory: []
    };

    // Note: Workflows are managed internally by EnhancedCodebuffService
    // Workflow registration is not available via public API yet
    // The workflow definition is stored for reference but not registered
    this.logger.info(`📋 Workflow defined: ${codeGenerationWorkflow.name} (workflow registration API not available)`);
  }

  /**
   * Setup example agents
   */
  private async setupExampleAgents(): Promise<void> {
    const exampleAgents: OliverOSAgentDefinition[] = [
      {
        id: 'code-generator',
        displayName: 'Code Generator',
        model: 'openai/gpt-4',
        instructionsPrompt: 'Generate high-quality, maintainable code following BMAD principles. Break down complex tasks into manageable pieces, map out architecture and dependencies, automate repetitive processes, and document everything.',
        toolNames: ['read_file', 'write_file', 'create_directory', 'search_files'],
        spawnableAgents: ['code-reviewer', 'test-generator'],
        oliverOSCapabilities: ['code-generation', 'architecture-mapping', 'documentation'],
        bmadCompliant: true,
        integrationPoints: ['mcp-server', 'thought-processor', 'collaboration-coordinator'],
        toolRegistry: ['filesystem', 'memory'],
        status: 'idle'
      },
      {
        id: 'code-reviewer',
        displayName: 'Code Reviewer',
        model: 'openai/gpt-4',
        instructionsPrompt: 'Review code for quality, best practices, and potential improvements. Focus on maintainability, performance, and adherence to coding standards.',
        toolNames: ['read_file', 'search_files'],
        spawnableAgents: ['test-generator'],
        oliverOSCapabilities: ['code-review', 'quality-analysis', 'best-practices'],
        bmadCompliant: true,
        integrationPoints: ['mcp-server', 'collaboration-coordinator'],
        toolRegistry: ['filesystem', 'memory'],
        status: 'idle'
      },
      {
        id: 'test-generator',
        displayName: 'Test Generator',
        model: 'openai/gpt-4',
        instructionsPrompt: 'Generate comprehensive unit tests for code. Focus on edge cases, error handling, and achieving good test coverage.',
        toolNames: ['read_file', 'write_file'],
        spawnableAgents: [],
        oliverOSCapabilities: ['test-generation', 'coverage-analysis'],
        bmadCompliant: true,
        integrationPoints: ['mcp-server'],
        toolRegistry: ['filesystem', 'memory'],
        status: 'idle'
      },
      {
        id: 'thought-processor',
        displayName: 'Thought Processor',
        model: 'openai/gpt-4',
        instructionsPrompt: 'Process and analyze thoughts to extract meaningful insights and patterns. Break down complex thoughts into manageable components, map relationships, and automate insight extraction.',
        toolNames: ['store_memory', 'retrieve_memory', 'search_memory'],
        spawnableAgents: ['pattern-recognizer', 'knowledge-extractor'],
        oliverOSCapabilities: ['thought-analysis', 'pattern-recognition', 'knowledge-extraction'],
        bmadCompliant: true,
        integrationPoints: ['mcp-server', 'collaboration-coordinator'],
        toolRegistry: ['memory'],
        status: 'idle'
      },
      {
        id: 'bureaucracy-disruptor',
        displayName: 'Bureaucracy Disruptor',
        model: 'openai/gpt-4',
        instructionsPrompt: 'Identify and eliminate bureaucratic inefficiencies in code and processes. Focus on automation and streamlining workflows. Break down complex bureaucratic processes into simple, automated solutions.',
        toolNames: ['execute_command', 'run_script'],
        spawnableAgents: ['efficiency-optimizer'],
        oliverOSCapabilities: ['process-analysis', 'workflow-optimization', 'automation'],
        bmadCompliant: true,
        integrationPoints: ['bmad-tools', 'collaboration-coordinator'],
        toolRegistry: ['terminal', 'filesystem'],
        status: 'idle'
      }
    ];

    // Register agents
    // Note: agentDefinitions is private, agents are registered via spawnAgent or other public methods
    // For now, we'll log that agents are defined but not yet registered
    for (const agent of exampleAgents) {
      this.logger.info(`🤖 Agent defined: ${agent.displayName} (use spawnAgent to register)`);
    }
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    this.logger.info('🎯 Running All Orchestration Examples...');
    
    try {
      await this.runSimpleTask();
      await this.runToolIntegrationDemo();
      await this.runMultiAgentWorkflow();
      await this.runSystemMonitoringDemo();
      
      this.logger.info('🎉 All examples completed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Examples execution failed: ${errorMessage}`);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down orchestration example...');
    await this.codebuffService.shutdown();
    this.logger.info('✅ Orchestration example shutdown complete');
  }
}

// CLI interface for running examples
export async function main() {
  const example = new OrchestrationExample();
  
  try {
    await example.initialize();
    
    const command = process.argv[2] || 'all';
    
    switch (command) {
      case 'simple':
        await example.runSimpleTask();
        break;
      case 'workflow':
        await example.runMultiAgentWorkflow();
        break;
      case 'tools':
        await example.runToolIntegrationDemo();
        break;
      case 'monitoring':
        await example.runSystemMonitoringDemo();
        break;
      case 'all':
        await example.runAllExamples();
        break;
      default:
        console.log('Available commands: simple, workflow, tools, monitoring, all');
    }
    
  } catch (error) {
    console.error('❌ Orchestration example failed:', error);
    process.exit(1);
  } finally {
    await example.shutdown();
  }
}

// Run if this is the main module
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
