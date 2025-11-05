/**
 * Monster Mode Example
 * Comprehensive example of Monster Mode system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { MasterOrchestrator } from '../src/services/monster-mode/master-orchestrator';
import { TaskPrioritizationService } from '../src/services/monster-mode/task-prioritization-service';
import { ConflictResolutionService } from '../src/services/monster-mode/conflict-resolution-service';
import { WorkflowOptimizationService } from '../src/services/monster-mode/workflow-optimization-service';
import { ArchitectureImprovementService } from '../src/services/monster-mode/architecture-improvement-service';
import { Config } from '../src/core/config';
import { Logger } from '../src/core/logger';

// Monster Mode Example Class
export class MonsterModeExample {
  private config: Config;
  private logger: Logger;
  private masterOrchestrator: MasterOrchestrator;
  private taskPrioritization: TaskPrioritizationService;
  private conflictResolution: ConflictResolutionService;
  private workflowOptimization: WorkflowOptimizationService;
  private architectureImprovements: ArchitectureImprovementService;

  constructor() {
    this.config = new Config();
    this.logger = new Logger('MonsterModeExample');
    this.masterOrchestrator = new MasterOrchestrator(this.config);
    this.taskPrioritization = new TaskPrioritizationService(this.config);
    this.conflictResolution = new ConflictResolutionService(this.config);
    this.workflowOptimization = new WorkflowOptimizationService(this.config);
    this.architectureImprovements = new ArchitectureImprovementService(this.config);
  }

  /**
   * Initialize Monster Mode system
   */
  async initialize(): Promise<void> {
    this.logger.info('🚀 Initializing Monster Mode system...');
    
    try {
      await this.masterOrchestrator.initialize();
      await this.taskPrioritization.initialize();
      await this.conflictResolution.initialize();
      await this.workflowOptimization.initialize();
      await this.architectureImprovements.initialize();
      
      this.logger.info('✅ Monster Mode system initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize Monster Mode system: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Demonstrate Monster Mode capabilities
   */
  async demonstrateMonsterMode(): Promise<void> {
    this.logger.info('🎯 Demonstrating Monster Mode capabilities...');
    
    try {
      // 1. Task prioritization
      await this.demonstrateTaskPrioritization();
      
      // 2. Conflict resolution
      await this.demonstrateConflictResolution();
      
      // 3. Workflow optimization
      await this.demonstrateWorkflowOptimization();
      
      // 4. Architecture improvements
      await this.demonstrateArchitectureImprovements();
      
      // 5. Master orchestration
      await this.demonstrateMasterOrchestration();
      
      this.logger.info('✅ Monster Mode demonstration completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to demonstrate Monster Mode capabilities: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Demonstrate task prioritization
   */
  private async demonstrateTaskPrioritization(): Promise<void> {
    this.logger.info('📋 Demonstrating task prioritization...');
    
    try {
      const tasks = [
        {
          id: 'task-1',
          type: 'code-generation' as const,
          description: 'Implement user authentication',
          priority: 'high' as const,
          status: 'pending' as const,
          complexity: 'medium',
          dependencies: [],
          estimatedDuration: 3600000, // 1 hour
          assignedAgent: 'backend',
          context: {},
          requirements: ['TypeScript', 'Express'],
          metadata: {}
        },
        {
          id: 'task-2',
          type: 'code-generation' as const,
          description: 'Create user interface',
          priority: 'medium' as const,
          status: 'pending' as const,
          complexity: 'low',
          dependencies: ['task-1'],
          estimatedDuration: 1800000, // 30 minutes
          assignedAgent: 'frontend',
          context: {},
          requirements: ['React', 'TypeScript'],
          metadata: {}
        },
        {
          id: 'task-3',
          type: 'optimization' as const,
          description: 'Optimize database queries',
          priority: 'low' as const,
          status: 'pending' as const,
          complexity: 'high',
          dependencies: [],
          estimatedDuration: 7200000, // 2 hours
          assignedAgent: 'database',
          context: {},
          requirements: ['PostgreSQL', 'Query optimization'],
          metadata: {}
        }
      ];

      const prioritizedTasks = await this.taskPrioritization.scheduleTasks(tasks, 'hybrid');
      this.logger.info(`✅ Prioritized ${prioritizedTasks.length} tasks`);
      
      // Display prioritized tasks
      for (const taskWithPriority of prioritizedTasks) {
        this.logger.info(`📋 Task: ${taskWithPriority.task.description} - Priority: ${taskWithPriority.priority.priority} - Score: ${taskWithPriority.priority.score}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to demonstrate task prioritization: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Demonstrate conflict resolution
   */
  private async demonstrateConflictResolution(): Promise<void> {
    this.logger.info('⚖️ Demonstrating conflict resolution...');
    
    try {
      const conflicts = [
        {
          id: 'conflict-1',
          type: 'resource',
          description: 'Multiple agents requesting same resource',
          severity: 'medium',
          involvedAgents: ['frontend', 'backend'],
          resource: 'database-connection',
          timestamp: new Date().toISOString()
        },
        {
          id: 'conflict-2',
          type: 'dependency',
          description: 'Circular dependency detected',
          severity: 'high',
          involvedAgents: ['frontend', 'backend', 'ai-services'],
          resource: 'api-endpoints',
          timestamp: new Date().toISOString()
        }
      ];

      // Detect conflicts first
      const detectedConflicts = await this.conflictResolution.detectConflicts({
        conflicts: conflicts,
        agents: ['frontend', 'backend', 'ai-services']
      });
      
      // Resolve each detected conflict by ID
      for (const conflict of detectedConflicts) {
        try {
          const resolution = await this.conflictResolution.resolveConflict(conflict.id);
          this.logger.info(`✅ Resolved conflict ${conflict.id}: ${resolution.solution}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to resolve conflict ${conflict.id}: ${errorMessage}`);
        }
      }
      
      const conflictStats = this.conflictResolution.getConflictResolutionStats();
      this.logger.info(`✅ Total conflicts: ${conflictStats.totalConflicts}, Resolved: ${conflictStats.resolvedConflicts}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to demonstrate conflict resolution: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Demonstrate workflow optimization
   */
  private async demonstrateWorkflowOptimization(): Promise<void> {
    this.logger.info('⚡ Demonstrating workflow optimization...');
    
    try {
      // Analyze workflow performance
      const workflowContext = {
        completedTasks: new Map([
          ['task-1', { id: 'task-1', type: 'development', status: 'completed' as const, actualDuration: 3000000 }],
          ['task-2', { id: 'task-2', type: 'testing', status: 'completed' as const, actualDuration: 1500000 }]
        ]),
        activeTasks: new Map([
          ['task-3', { id: 'task-3', type: 'review', status: 'active' as const }]
        ]),
        taskQueue: [],
        agentStatuses: new Map([
          ['agent-1', { id: 'agent-1', status: 'busy' as const, load: 0.7 }],
          ['agent-2', { id: 'agent-2', status: 'idle' as const, load: 0.3 }]
        ])
      };
      
      const analysis = await this.workflowOptimization.analyzeWorkflowPerformance(workflowContext);
      const optimizations = await this.workflowOptimization.generateOptimizations(analysis);
      this.logger.info(`✅ Generated ${optimizations.length} workflow optimizations`);
      
      // Display optimizations
      for (const optimization of optimizations) {
        this.logger.info(`⚡ Optimization: ${optimization.description} - Impact: ${optimization.impact} - Effort: ${optimization.effort}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to demonstrate workflow optimization: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Demonstrate architecture improvements
   */
  private async demonstrateArchitectureImprovements(): Promise<void> {
    this.logger.info('🏗️ Demonstrating architecture improvements...');
    
    try {
      const context = {
        agentStatuses: new Map([
          ['frontend', { id: 'frontend', status: 'busy' as const, load: 0.6 }],
          ['backend', { id: 'backend', status: 'busy' as const, load: 0.8 }],
          ['ai-services', { id: 'ai-services', status: 'idle' as const, load: 0.4 }],
          ['database', { id: 'database', status: 'busy' as const, load: 0.9 }],
          ['integration', { id: 'integration', status: 'idle' as const, load: 0.3 }]
        ]),
        services: new Map([
          ['service-1', { id: 'service-1', name: 'Service 1', modular: true, documented: false, tested: true, authenticated: false, authorized: false, encrypted: false, redundant: false, monitored: true, configurable: true, extensible: false }],
          ['service-2', { id: 'service-2', name: 'Service 2', modular: false, documented: true, tested: false, authenticated: true, authorized: true, encrypted: true, redundant: true, monitored: false, configurable: false, extensible: true }]
        ]),
        completedTasks: new Map([
          ['task-1', { id: 'task-1', actualDuration: 3000000 }],
          ['task-2', { id: 'task-2', actualDuration: 1500000 }]
        ])
      };

      const analysis = await this.architectureImprovements.analyzeArchitecture(context);
      const improvements = await this.architectureImprovements.generateArchitectureImprovements(analysis);
      
      this.logger.info(`✅ Generated ${improvements.length} architecture improvements`);
      
      // Display architecture improvements
      for (const improvement of improvements) {
        this.logger.info(`🏗️ Improvement: ${improvement.description} - Impact: ${improvement.impact} - Priority: ${improvement.priority}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to demonstrate architecture improvements: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Demonstrate master orchestration
   */
  private async demonstrateMasterOrchestration(): Promise<void> {
    this.logger.info('🎯 Demonstrating master orchestration...');
    
    try {
      const status = this.masterOrchestrator.getMonsterModeStatus();
      this.logger.info(`✅ Master orchestration status retrieved`);
      
      // Display orchestration status
      this.logger.info(`🎯 Orchestration Status: ${JSON.stringify(status, null, 2)}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to demonstrate master orchestration: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get Monster Mode statistics
   */
  async getMonsterModeStats(): Promise<any> {
    try {
      const taskStats = await this.taskPrioritization.getTaskPrioritizationStats();
      const conflictStats = await this.conflictResolution.getConflictResolutionStats();
      const workflowStats = await this.workflowOptimization.getWorkflowOptimizationStats();
      const architectureStats = await this.architectureImprovements.getArchitectureImprovementStats();
      const orchestrationStatus = this.masterOrchestrator.getMonsterModeStatus();

      return {
        taskPrioritization: taskStats,
        conflictResolution: conflictStats,
        workflowOptimization: workflowStats,
        architectureImprovements: architectureStats,
        masterOrchestration: orchestrationStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get Monster Mode statistics: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Export Monster Mode data
   */
  async exportMonsterModeData(exportPath: string): Promise<void> {
    try {
      await this.taskPrioritization.exportTaskPrioritizationData(`${exportPath}/task-prioritization.json`);
      await this.conflictResolution.exportConflictResolutionData(`${exportPath}/conflict-resolution.json`);
      await this.workflowOptimization.exportWorkflowOptimizationData(`${exportPath}/workflow-optimization.json`);
      await this.architectureImprovements.exportArchitectureImprovementData(`${exportPath}/architecture-improvements.json`);
      // Note: MasterOrchestrator doesn't have exportOrchestrationData method
      // Using getMonsterModeStatus instead
      this.masterOrchestrator.getMonsterModeStatus();
      // Could write this to a file if needed

      this.logger.info(`📤 Monster Mode data exported to: ${exportPath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to export Monster Mode data: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Clear Monster Mode data
   */
  async clearMonsterModeData(): Promise<void> {
    try {
      await this.taskPrioritization.clearTaskPrioritizationData();
      await this.conflictResolution.clearConflictResolutionData();
      await this.workflowOptimization.clearWorkflowOptimizationData();
      await this.architectureImprovements.clearArchitectureImprovementData();
      // Note: MasterOrchestrator doesn't have clearOrchestrationData method
      // Clearing would require shutdown or other methods

      this.logger.info('🗑️ Monster Mode data cleared');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to clear Monster Mode data: ${errorMessage}`);
      throw error;
    }
  }
}

// Example usage
async function runMonsterModeExample(): Promise<void> {
  const example = new MonsterModeExample();
  
  try {
    await example.initialize();
    await example.demonstrateMonsterMode();
    
    const stats = await example.getMonsterModeStats();
    console.log('Monster Mode Statistics:', JSON.stringify(stats, null, 2));
    
    await example.exportMonsterModeData('./monster-mode-data');
    
  } catch (error) {
    console.error('Monster Mode example failed:', error);
  }
}

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMonsterModeExample().catch(console.error);
}

export { runMonsterModeExample };
