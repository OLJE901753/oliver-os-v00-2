/**
 * Enhanced BMAD Workflow Engine
 * Dynamic workflow execution with context-aware phase adaptation
 */

import { Logger } from './logger';
import { EnhancedConfigManager } from './enhanced-config';
import type { BMADPhase, WorkflowContext, ExecutionResult, PhaseResult } from '../types/bmad';

export interface WorkflowStep {
  id: string;
  phase: BMADPhase;
  dependencies: string[];
  condition?: (context: WorkflowContext) => boolean;
  execute: (context: WorkflowContext) => Promise<PhaseResult>;
  rollback?: (context: WorkflowContext) => Promise<void>;
}

export interface WorkflowExecution {
  id: string;
  steps: WorkflowStep[];
  context: WorkflowContext;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  results: Map<string, PhaseResult>;
  startTime?: Date;
  endTime?: Date;
}

export class BMADWorkflowEngine {
  private logger: Logger;
  private configManager: EnhancedConfigManager;
  private executions: Map<string, WorkflowExecution> = new Map();
  private stepRegistry: Map<string, WorkflowStep> = new Map();

  constructor(configManager: EnhancedConfigManager) {
    this.configManager = configManager;
    this.logger = new Logger('BMAD-Workflow');
    this.initializeDefaultSteps();
  }

  /**
   * Execute a BMAD workflow with dynamic phase adaptation
   */
  async executeWorkflow(
    workflowId: string,
    context: WorkflowContext,
    customSteps?: WorkflowStep[]
  ): Promise<ExecutionResult> {
    const execution: WorkflowExecution = {
      id: workflowId,
      steps: customSteps || this.generateWorkflowSteps(context),
      context,
      status: 'pending',
      results: new Map()
    };

    this.executions.set(workflowId, execution);
    execution.status = 'running';
    execution.startTime = new Date();

    try {
      this.logger.info(`🚀 Starting BMAD workflow: ${workflowId}`);

      // Execute phases in dependency order
      const executionOrder = this.resolveExecutionOrder(execution.steps);
      
      for (const stepId of executionOrder) {
        const step = execution.steps.find(s => s.id === stepId);
        if (!step) continue;

        // Check if step should be executed based on conditions
        if (step.condition && !step.condition(execution.context)) {
          this.logger.info(`⏭️ Skipping step ${stepId} - condition not met`);
          continue;
        }

        this.logger.info(`🔄 Executing ${step.phase} phase: ${stepId}`);
        
        try {
          const result = await step.execute(execution.context);
          execution.results.set(stepId, result);
          
          // Update context with step results
          execution.context = this.updateContext(execution.context, result);
          
          this.logger.info(`✅ Completed ${step.phase} phase: ${stepId}`);
        } catch (error) {
          this.logger.error(`❌ Failed ${step.phase} phase: ${stepId}`, error);
          
          // Attempt rollback if available
          if (step.rollback) {
            await step.rollback(execution.context);
          }
          
          throw error;
        }
      }

      execution.status = 'completed';
      execution.endTime = new Date();

      this.logger.info(`🎉 BMAD workflow completed: ${workflowId}`);

      return {
        success: true,
        executionId: workflowId,
        results: Array.from(execution.results.values()),
        duration: execution.endTime.getTime() - execution.startTime!.getTime(),
        context: execution.context
      };

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();

      this.logger.error(`💥 BMAD workflow failed: ${workflowId}`, error);

      return {
        success: false,
        executionId: workflowId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: execution.endTime.getTime() - execution.startTime!.getTime(),
        context: execution.context
      };
    }
  }

  /**
   * Generate workflow steps based on project context
   */
  private generateWorkflowSteps(context: WorkflowContext): WorkflowStep[] {
    const config = this.configManager.getCurrentEnvironmentConfig();
    const steps: WorkflowStep[] = [];

    // Always include core BMAD phases
    steps.push(
      this.createBreakStep(context),
      this.createMapStep(context),
      this.createAutomateStep(context),
      this.createDocumentStep(context)
    );

    // Add context-specific steps
    if (context.projectType === 'ai-brain-interface') {
      steps.push(
        this.createThoughtProcessingStep(context),
        this.createCollaborationStep(context),
        this.createAIIntegrationStep(context)
      );
    }

    if (context.projectType === 'microservices') {
      steps.push(
        this.createServiceDecompositionStep(context),
        this.createAPIGatewayStep(context),
        this.createServiceDiscoveryStep(context)
      );
    }

    // Add integration-specific steps
    if (context.integrations?.mcp) {
      steps.push(this.createMCPStep(context));
    }

    if (context.integrations?.codebuff) {
      steps.push(this.createCodebuffStep(context));
    }

    return steps;
  }

  /**
   * Create Break phase step
   */
  private createBreakStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'break-analysis',
      phase: 'Break',
      dependencies: [],
      execute: async (ctx) => {
        const analysis = await this.performBreakAnalysis(ctx);
        return {
          phase: 'Break',
          success: true,
          data: analysis,
          artifacts: ['task-breakdown.json', 'complexity-analysis.json']
        };
      }
    };
  }

  /**
   * Create Map phase step
   */
  private createMapStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'map-architecture',
      phase: 'Map',
      dependencies: ['break-analysis'],
      execute: async (ctx) => {
        const mapping = await this.performArchitectureMapping(ctx);
        return {
          phase: 'Map',
          success: true,
          data: mapping,
          artifacts: ['architecture-diagram.json', 'dependency-graph.json']
        };
      }
    };
  }

  /**
   * Create Automate phase step
   */
  private createAutomateStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'automate-processes',
      phase: 'Automate',
      dependencies: ['map-architecture'],
      execute: async (ctx) => {
        const automation = await this.performAutomation(ctx);
        return {
          phase: 'Automate',
          success: true,
          data: automation,
          artifacts: ['generated-code/', 'automation-scripts/']
        };
      }
    };
  }

  /**
   * Create Document phase step
   */
  private createDocumentStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'document-system',
      phase: 'Document',
      dependencies: ['automate-processes'],
      execute: async (ctx) => {
        const documentation = await this.generateDocumentation(ctx);
        return {
          phase: 'Document',
          success: true,
          data: documentation,
          artifacts: ['api-docs/', 'component-docs/', 'user-guides/']
        };
      }
    };
  }

  /**
   * Create AI-brain interface specific steps
   */
  private createThoughtProcessingStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'thought-processing-setup',
      phase: 'Break',
      dependencies: ['break-analysis'],
      condition: (ctx) => ctx.projectType === 'ai-brain-interface',
      execute: async (ctx) => {
        const setup = await this.setupThoughtProcessing(ctx);
        return {
          phase: 'Break',
          success: true,
          data: setup,
          artifacts: ['thought-processor.ts', 'pattern-recognizer.ts']
        };
      }
    };
  }

  private createCollaborationStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'collaboration-setup',
      phase: 'Map',
      dependencies: ['map-architecture'],
      condition: (ctx) => ctx.projectType === 'ai-brain-interface',
      execute: async (ctx) => {
        const setup = await this.setupCollaboration(ctx);
        return {
          phase: 'Map',
          success: true,
          data: setup,
          artifacts: ['collaboration-service.ts', 'websocket-manager.ts']
        };
      }
    };
  }

  private createAIIntegrationStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'ai-integration',
      phase: 'Automate',
      dependencies: ['automate-processes'],
      condition: (ctx) => ctx.projectType === 'ai-brain-interface',
      execute: async (ctx) => {
        const integration = await this.setupAIIntegration(ctx);
        return {
          phase: 'Automate',
          success: true,
          data: integration,
          artifacts: ['ai-services/', 'model-integration.ts']
        };
      }
    };
  }

  /**
   * Create MCP integration step
   */
  private createMCPStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'mcp-integration',
      phase: 'Automate',
      dependencies: ['automate-processes'],
      condition: (ctx) => ctx.integrations?.mcp === true,
      execute: async (ctx) => {
        const mcpSetup = await this.setupMCPIntegration(ctx);
        return {
          phase: 'Automate',
          success: true,
          data: mcpSetup,
          artifacts: ['mcp-server.ts', 'mcp-tools/']
        };
      }
    };
  }

  /**
   * Create Codebuff integration step
   */
  private createCodebuffStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'codebuff-integration',
      phase: 'Automate',
      dependencies: ['automate-processes'],
      condition: (ctx) => ctx.integrations?.codebuff === true,
      execute: async (ctx) => {
        const codebuffSetup = await this.setupCodebuffIntegration(ctx);
        return {
          phase: 'Automate',
          success: true,
          data: codebuffSetup,
          artifacts: ['codebuff-service.ts', 'agent-definitions.json']
        };
      }
    };
  }

  /**
   * Resolve execution order based on dependencies
   */
  private resolveExecutionOrder(steps: WorkflowStep[]): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (stepId: string) => {
      if (visiting.has(stepId)) {
        throw new Error(`Circular dependency detected: ${stepId}`);
      }
      
      if (visited.has(stepId)) {
        return;
      }

      visiting.add(stepId);
      
      const step = steps.find(s => s.id === stepId);
      if (step) {
        for (const dep of step.dependencies) {
          visit(dep);
        }
      }
      
      visiting.delete(stepId);
      visited.add(stepId);
      order.push(stepId);
    };

    for (const step of steps) {
      visit(step.id);
    }

    return order;
  }

  /**
   * Update workflow context with step results
   */
  private updateContext(context: WorkflowContext, result: PhaseResult): WorkflowContext {
    return {
      ...context,
      artifacts: [...(context.artifacts || []), ...(result.artifacts || [])],
      metadata: {
        ...context.metadata,
        [result.phase]: result.data
      }
    };
  }

  /**
   * Initialize default workflow steps
   */
  private initializeDefaultSteps(): void {
    // Register default steps that can be reused
    this.stepRegistry.set('break-analysis', this.createBreakStep({} as WorkflowContext));
    this.stepRegistry.set('map-architecture', this.createMapStep({} as WorkflowContext));
    this.stepRegistry.set('automate-processes', this.createAutomateStep({} as WorkflowContext));
    this.stepRegistry.set('document-system', this.createDocumentStep({} as WorkflowContext));
  }

  // Implementation methods for each phase
  private async performBreakAnalysis(context: WorkflowContext): Promise<any> {
    // Implementation for break analysis
    return {
      tasks: ['Analyze requirements', 'Identify components', 'Estimate complexity'],
      complexity: 'medium',
      estimatedTime: '4-6 hours'
    };
  }

  private async performArchitectureMapping(context: WorkflowContext): Promise<any> {
    // Implementation for architecture mapping
    return {
      components: ['frontend', 'backend', 'database'],
      dependencies: ['react', 'express', 'postgresql'],
      architecture: 'microservices'
    };
  }

  private async performAutomation(context: WorkflowContext): Promise<any> {
    // Implementation for automation
    return {
      generatedFiles: ['service.ts', 'controller.ts', 'test.ts'],
      automationScripts: ['build.sh', 'deploy.sh'],
      templates: ['api-template', 'service-template']
    };
  }

  private async generateDocumentation(context: WorkflowContext): Promise<any> {
    // Implementation for documentation generation
    return {
      apiDocs: 'Generated API documentation',
      componentDocs: 'Generated component documentation',
      userGuides: 'Generated user guides'
    };
  }

  private async setupThoughtProcessing(context: WorkflowContext): Promise<any> {
    // Implementation for thought processing setup
    return {
      processors: ['thought-analyzer', 'pattern-recognizer'],
      models: ['semantic-analysis', 'knowledge-extraction']
    };
  }

  private async setupCollaboration(context: WorkflowContext): Promise<any> {
    // Implementation for collaboration setup
    return {
      services: ['collaboration-service', 'websocket-manager'],
      features: ['real-time-sync', 'user-presence', 'shared-workspace']
    };
  }

  private async setupAIIntegration(context: WorkflowContext): Promise<any> {
    // Implementation for AI integration
    return {
      services: ['ai-orchestrator', 'model-manager'],
      integrations: ['openai', 'anthropic', 'local-models']
    };
  }

  private async setupMCPIntegration(context: WorkflowContext): Promise<any> {
    // Implementation for MCP integration
    return {
      server: 'mcp-server',
      tools: ['bmad-tools', 'codebuff-tools', 'collaboration-tools']
    };
  }

  private async setupCodebuffIntegration(context: WorkflowContext): Promise<any> {
    // Implementation for Codebuff integration
    return {
      service: 'codebuff-service',
      agents: ['code-generator', 'bureaucracy-disruptor', 'thought-processor']
    };
  }

  /**
   * Create microservices-specific steps
   */
  private createServiceDecompositionStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'service-decomposition',
      phase: 'Break',
      dependencies: ['break-analysis'],
      condition: (ctx) => ctx.projectType === 'microservices',
      execute: async (ctx) => {
        const decomposition = await this.performServiceDecomposition(ctx);
        return {
          phase: 'Break',
          success: true,
          data: decomposition,
          artifacts: ['service-breakdown.json', 'api-contracts.json']
        };
      }
    };
  }

  private createAPIGatewayStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'api-gateway-setup',
      phase: 'Map',
      dependencies: ['map-architecture'],
      condition: (ctx) => ctx.projectType === 'microservices',
      execute: async (ctx) => {
        const gateway = await this.setupAPIGateway(ctx);
        return {
          phase: 'Map',
          success: true,
          data: gateway,
          artifacts: ['gateway-config.json', 'routing-rules.json']
        };
      }
    };
  }

  private createServiceDiscoveryStep(context: WorkflowContext): WorkflowStep {
    return {
      id: 'service-discovery',
      phase: 'Automate',
      dependencies: ['automate-processes'],
      condition: (ctx) => ctx.projectType === 'microservices',
      execute: async (ctx) => {
        const discovery = await this.setupServiceDiscovery(ctx);
        return {
          phase: 'Automate',
          success: true,
          data: discovery,
          artifacts: ['discovery-service.ts', 'health-checks.json']
        };
      }
    };
  }

  private async performServiceDecomposition(context: WorkflowContext): Promise<any> {
    return {
      services: ['user-service', 'auth-service', 'notification-service'],
      apis: ['user-api', 'auth-api', 'notification-api']
    };
  }

  private async setupAPIGateway(context: WorkflowContext): Promise<any> {
    return {
      gateway: 'express-gateway',
      routes: ['/api/users', '/api/auth', '/api/notifications']
    };
  }

  private async setupServiceDiscovery(context: WorkflowContext): Promise<any> {
    return {
      discovery: 'consul',
      healthChecks: ['http', 'tcp', 'grpc']
    };
  }

  /**
   * Get workflow execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      this.logger.info(`🛑 Cancelled workflow: ${executionId}`);
    }
  }

  /**
   * Get all workflow executions
   */
  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }
}
