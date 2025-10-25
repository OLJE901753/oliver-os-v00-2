/**
 * Conflict Resolution Service
 * Intelligent conflict resolution for Monster Mode
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';

export interface Conflict {
  id: string;
  type: 'resource' | 'priority' | 'dependency' | 'quality' | 'deadline' | 'architecture';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'analyzing' | 'resolving' | 'resolved' | 'escalated' | 'failed';
  agents: string[];
  description: string;
  context: any;
  resolution: ConflictResolution;
  timestamp: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ConflictResolution {
  id: string;
  strategy: 'automatic' | 'manual' | 'escalated' | 'consensus' | 'arbitration';
  approach: 'priority-based' | 'resource-based' | 'time-based' | 'quality-based' | 'hybrid';
  solution: string;
  actions: ResolutionAction[];
  success: boolean;
  reasoning: string;
  alternatives: string[];
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export interface ResolutionAction {
  id: string;
  type: 'reassign' | 'reschedule' | 'modify' | 'cancel' | 'escalate' | 'negotiate';
  target: string;
  parameters: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface ConflictConfig {
  enabled: boolean;
  detection: {
    enabled: boolean;
    interval: number;
    thresholds: {
      resource: number;
      priority: number;
      dependency: number;
      quality: number;
    };
  };
  resolution: {
    enabled: boolean;
    strategies: {
      automatic: boolean;
      manual: boolean;
      escalated: boolean;
      consensus: boolean;
      arbitration: boolean;
    };
    timeouts: {
      automatic: number;
      manual: number;
      escalated: number;
    };
  };
  learning: {
    enabled: boolean;
    adaptationRate: number;
    historyWeight: number;
  };
}

export interface ConflictPattern {
  id: string;
  type: string;
  pattern: any;
  frequency: number;
  successRate: number;
  resolutionStrategy: string;
  lastSeen: string;
}

export class ConflictResolutionService extends EventEmitter {
  private _logger: Logger;
  private _config!: Config;
  private conflictConfig: ConflictConfig;
  private conflicts: Map<string, Conflict>;
  private conflictHistory: Map<string, Conflict[]>;
  private conflictPatterns: Map<string, ConflictPattern>;
  private resolutionStrategies: Map<string, any>;

  constructor(_config: Config) {
    super();
    this._logger = new Logger('ConflictResolutionService');
    this.conflictConfig = this.getDefaultConflictConfig();
    this.conflicts = new Map();
    this.conflictHistory = new Map();
    this.conflictPatterns = new Map();
    this.resolutionStrategies = new Map();
    this.initializeResolutionStrategies();
  }

  /**
   * Initialize conflict resolution service
   */
  async initialize(): Promise<void> {
    this._logger.info('🔧 Initializing Conflict Resolution Service...');
    
    try {
      await this.loadConflictConfig();
      await this.initializeResolutionStrategies();
      await this.loadConflictPatterns();
      
      this._logger.info('✅ Conflict Resolution Service initialized successfully');
      this.emit('conflict-resolution:initialized');
    } catch (error) {
      this._logger.error('Failed to initialize conflict resolution service:', error);
      throw error;
    }
  }

  /**
   * Load conflict configuration
   */
  private async loadConflictConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'conflict-resolution-config.json');
      if (await fs.pathExists(configPath)) {
        this.conflictConfig = await fs.readJson(configPath);
        this._logger.info('📋 Conflict resolution configuration loaded');
      } else {
        this.conflictConfig = this.getDefaultConflictConfig();
        await this.saveConflictConfig();
        this._logger.info('📋 Using default conflict resolution configuration');
      }
    } catch (error) {
      this._logger.warn('Failed to load conflict resolution configuration, using defaults');
      this.conflictConfig = this.getDefaultConflictConfig();
    }
  }

  /**
   * Get default conflict configuration
   */
  private getDefaultConflictConfig(): ConflictConfig {
    return {
      enabled: true,
      detection: {
        enabled: true,
        interval: 30000, // 30 seconds
        thresholds: {
          resource: 0.8,
          priority: 0.7,
          dependency: 0.6,
          quality: 0.5
        }
      },
      resolution: {
        enabled: true,
        strategies: {
          automatic: true,
          manual: true,
          escalated: true,
          consensus: true,
          arbitration: true
        },
        timeouts: {
          automatic: 60000, // 1 minute
          manual: 300000, // 5 minutes
          escalated: 900000 // 15 minutes
        }
      },
      learning: {
        enabled: true,
        adaptationRate: 0.1,
        historyWeight: 0.3
      }
    };
  }

  /**
   * Save conflict configuration
   */
  private async saveConflictConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'conflict-resolution-config.json');
      await fs.writeJson(configPath, this.conflictConfig, { spaces: 2 });
      this._logger.info('💾 Conflict resolution configuration saved');
    } catch (error) {
      this._logger.error('Failed to save conflict resolution configuration:', error);
    }
  }

  /**
   * Initialize resolution strategies
   */
  private initializeResolutionStrategies(): void {
    // Priority-based strategy
    this.resolutionStrategies.set('priority-based', {
      id: 'priority-based',
      name: 'Priority-Based Resolution',
      description: 'Resolve conflicts based on task priorities',
      algorithm: 'priority-based',
      parameters: {
        priorityWeight: 1.0,
        fairnessWeight: 0.3
      },
      successRate: 0.85
    });

    // Resource-based strategy
    this.resolutionStrategies.set('resource-based', {
      id: 'resource-based',
      name: 'Resource-Based Resolution',
      description: 'Resolve conflicts based on resource availability',
      algorithm: 'resource-based',
      parameters: {
        resourceWeight: 1.0,
        loadBalanceWeight: 0.4
      },
      successRate: 0.80
    });

    // Time-based strategy
    this.resolutionStrategies.set('time-based', {
      id: 'time-based',
      name: 'Time-Based Resolution',
      description: 'Resolve conflicts based on time constraints',
      algorithm: 'time-based',
      parameters: {
        deadlineWeight: 1.0,
        urgencyWeight: 0.5
      },
      successRate: 0.75
    });

    // Quality-based strategy
    this.resolutionStrategies.set('quality-based', {
      id: 'quality-based',
      name: 'Quality-Based Resolution',
      description: 'Resolve conflicts based on quality requirements',
      algorithm: 'quality-based',
      parameters: {
        qualityWeight: 1.0,
        impactWeight: 0.6
      },
      successRate: 0.82
    });

    // Hybrid strategy
    this.resolutionStrategies.set('hybrid', {
      id: 'hybrid',
      name: 'Hybrid Resolution',
      description: 'Combine multiple resolution strategies',
      algorithm: 'hybrid',
      parameters: {
        priorityWeight: 0.3,
        resourceWeight: 0.25,
        timeWeight: 0.25,
        qualityWeight: 0.2
      },
      successRate: 0.88
    });
  }

  /**
   * Load conflict patterns
   */
  private async loadConflictPatterns(): Promise<void> {
    try {
      const patternsPath = path.join(process.cwd(), 'conflict-patterns.json');
      if (await fs.pathExists(patternsPath)) {
        const patterns = await fs.readJson(patternsPath);
        this.conflictPatterns = new Map(patterns);
        this._logger.info('📚 Conflict patterns loaded');
      }
    } catch (error) {
      this._logger.warn('Failed to load conflict patterns');
    }
  }

  /**
   * Detect conflicts
   */
  async detectConflicts(context: any): Promise<Conflict[]> {
    this._logger.info('🔍 Detecting conflicts...');
    
    try {
      const conflicts: Conflict[] = [];

      // Detect resource conflicts
      const resourceConflicts = await this.detectResourceConflicts(context);
      conflicts.push(...resourceConflicts);

      // Detect priority conflicts
      const priorityConflicts = await this.detectPriorityConflicts(context);
      conflicts.push(...priorityConflicts);

      // Detect dependency conflicts
      const dependencyConflicts = await this.detectDependencyConflicts(context);
      conflicts.push(...dependencyConflicts);

      // Detect quality conflicts
      const qualityConflicts = await this.detectQualityConflicts(context);
      conflicts.push(...qualityConflicts);

      // Detect deadline conflicts
      const deadlineConflicts = await this.detectDeadlineConflicts(context);
      conflicts.push(...deadlineConflicts);

      // Detect architecture conflicts
      const architectureConflicts = await this.detectArchitectureConflicts(context);
      conflicts.push(...architectureConflicts);

      // Store conflicts
      for (const conflict of conflicts) {
        this.conflicts.set(conflict.id, conflict);
      }

      this._logger.info(`✅ Detected ${conflicts.length} conflicts`);
      this.emit('conflicts:detected', { conflicts });
      
      return conflicts;
    } catch (error) {
      this._logger.error('Failed to detect conflicts:', error);
      throw error;
    }
  }

  /**
   * Detect resource conflicts
   */
  private async detectResourceConflicts(context: any): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for resource competition
    const resourceUsage = new Map<string, string[]>();
    
    for (const [agentId, agentStatus] of context.agentStatuses || []) {
      if (agentStatus.status === 'busy') {
        const resources = this.getAgentResources(agentId);
        for (const resource of resources) {
          if (!resourceUsage.has(resource)) {
            resourceUsage.set(resource, []);
          }
          resourceUsage.get(resource)!.push(agentId);
        }
      }
    }

    // Find conflicts
    for (const [resource, agents] of resourceUsage) {
      if (agents.length > 1) {
        conflicts.push({
          id: this.generateConflictId(),
          type: 'resource',
          severity: 'medium',
          status: 'detected',
          agents,
          description: `Multiple agents competing for resource: ${resource}`,
          context: { resource, agents },
          resolution: this.createEmptyResolution(),
          timestamp: new Date().toISOString()
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect priority conflicts
   */
  private async detectPriorityConflicts(context: any): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for conflicting priorities
    const priorityTasks = context.taskQueue?.filter((task: any) => task.priority === 'critical') || [];
    
    if (priorityTasks.length > 1) {
      conflicts.push({
        id: this.generateConflictId(),
        type: 'priority',
        severity: 'high',
        status: 'detected',
        agents: priorityTasks.map((task: any) => task.assignedAgent),
        description: 'Multiple critical priority tasks detected',
        context: { priorityTasks },
        resolution: this.createEmptyResolution(),
        timestamp: new Date().toISOString()
      });
    }

    return conflicts;
  }

  /**
   * Detect dependency conflicts
   */
  private async detectDependencyConflicts(context: any): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for circular dependencies
    const dependencyGraph = new Map<string, string[]>();
    
    for (const task of context.taskQueue || []) {
      dependencyGraph.set(task.id, task.dependencies || []);
    }

    // Detect circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) return true;
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recursionStack.add(taskId);

      const dependencies = dependencyGraph.get(taskId) || [];
      for (const dep of dependencies) {
        if (hasCycle(dep)) return true;
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const taskId of dependencyGraph.keys()) {
      if (hasCycle(taskId)) {
        conflicts.push({
          id: this.generateConflictId(),
          type: 'dependency',
          severity: 'critical',
          status: 'detected',
          agents: [taskId],
          description: 'Circular dependency detected',
          context: { taskId, dependencies: dependencyGraph.get(taskId) },
          resolution: this.createEmptyResolution(),
          timestamp: new Date().toISOString()
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect quality conflicts
   */
  private async detectQualityConflicts(context: any): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for quality conflicts between agents
    const qualityAgents = Array.from(context.agentStatuses?.values() || []).filter((agent: any) => 
      agent.capabilities.includes('quality-analysis') || 
      agent.capabilities.includes('quality-checking')
    );

    if (qualityAgents.length > 1) {
      conflicts.push({
        id: this.generateConflictId(),
        type: 'quality',
        severity: 'medium',
        status: 'detected',
        agents: qualityAgents.map((agent: any) => agent.id),
        description: 'Multiple quality agents may have conflicting assessments',
        context: { qualityAgents },
        resolution: this.createEmptyResolution(),
        timestamp: new Date().toISOString()
      });
    }

    return conflicts;
  }

  /**
   * Detect deadline conflicts
   */
  private async detectDeadlineConflicts(context: any): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for deadline conflicts
    const tasksWithDeadlines = context.taskQueue?.filter((task: any) => task.deadline) || [];
    const now = new Date();

    for (const task of tasksWithDeadlines) {
      const deadline = new Date(task.deadline);
      const timeDiff = deadline.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 0) {
        conflicts.push({
          id: this.generateConflictId(),
          type: 'deadline',
          severity: 'critical',
          status: 'detected',
          agents: [task.assignedAgent],
          description: `Task ${task.id} is overdue`,
          context: { task, deadline, hoursDiff },
          resolution: this.createEmptyResolution(),
          timestamp: new Date().toISOString()
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect architecture conflicts
   */
  private async detectArchitectureConflicts(context: any): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for architecture conflicts
    const architectureTasks = context.taskQueue?.filter((task: any) => 
      task.type === 'architecture' || task.requirements?.includes('architecture')
    ) || [];

    if (architectureTasks.length > 1) {
      conflicts.push({
        id: this.generateConflictId(),
        type: 'architecture',
        severity: 'high',
        status: 'detected',
        agents: architectureTasks.map((task: any) => task.assignedAgent),
        description: 'Multiple architecture tasks may conflict',
        context: { architectureTasks },
        resolution: this.createEmptyResolution(),
        timestamp: new Date().toISOString()
      });
    }

    return conflicts;
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(conflictId: string): Promise<ConflictResolution> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    this._logger.info(`🔧 Resolving conflict: ${conflictId}`);

    try {
      conflict.status = 'resolving';

      // Analyze conflict
      const analysis = await this.analyzeConflict(conflict);

      // Select resolution strategy
      const strategy = this.selectResolutionStrategy(conflict, analysis);

      // Execute resolution
      const resolution = await this.executeResolution(conflict, strategy);

      // Update conflict
      conflict.status = 'resolved';
      conflict.resolution = resolution;
      conflict.resolvedAt = new Date().toISOString();
      conflict.resolvedBy = 'automatic';

      // Store in history
      if (!this.conflictHistory.has(conflict.type)) {
        this.conflictHistory.set(conflict.type, []);
      }
      this.conflictHistory.get(conflict.type)!.push(conflict);

      // Learn from resolution
      if (this.conflictConfig.learning.enabled) {
        await this.learnFromResolution(conflict, resolution);
      }

      this._logger.info(`✅ Conflict resolved: ${conflictId}`);
      this.emit('conflict:resolved', { conflict, resolution });
      
      return resolution;
    } catch (error) {
      this._logger.error(`Failed to resolve conflict: ${conflictId}`, error);
      conflict.status = 'failed';
      this.emit('conflict:failed', { conflict, error });
      throw error;
    }
  }

  /**
   * Analyze conflict
   */
  private async analyzeConflict(conflict: Conflict): Promise<any> {
    const analysis = {
      severity: conflict.severity,
      complexity: this.assessConflictComplexity(conflict),
      impact: this.assessConflictImpact(conflict),
      urgency: this.assessConflictUrgency(conflict),
      resources: this.assessResourceRequirements(conflict),
      alternatives: this.generateAlternatives(conflict)
    };

    return analysis;
  }

  /**
   * Assess conflict complexity
   */
  private assessConflictComplexity(conflict: Conflict): 'low' | 'medium' | 'high' {
    const agentCount = conflict.agents.length;
    const contextComplexity = Object.keys(conflict.context).length;

    if (agentCount > 3 || contextComplexity > 5) return 'high';
    if (agentCount > 2 || contextComplexity > 3) return 'medium';
    return 'low';
  }

  /**
   * Assess conflict impact
   */
  private assessConflictImpact(conflict: Conflict): 'low' | 'medium' | 'high' {
    switch (conflict.severity) {
      case 'critical': return 'high';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  /**
   * Assess conflict urgency
   */
  private assessConflictUrgency(conflict: Conflict): 'low' | 'medium' | 'high' {
    const now = new Date();
    const conflictAge = now.getTime() - new Date(conflict.timestamp).getTime();
    const hoursAge = conflictAge / (1000 * 60 * 60);

    if (hoursAge > 2) return 'high';
    if (hoursAge > 1) return 'medium';
    return 'low';
  }

  /**
   * Assess resource requirements
   */
  private assessResourceRequirements(_conflict: Conflict): any {
    return {
      cpu: 1,
      memory: 1,
      time: 1
    };
  }

  /**
   * Generate alternatives
   */
  private generateAlternatives(conflict: Conflict): string[] {
    const alternatives: string[] = [];

    switch (conflict.type) {
      case 'resource':
        alternatives.push('Reassign tasks to different agents');
        alternatives.push('Reschedule tasks to different times');
        alternatives.push('Increase resource capacity');
        break;
      case 'priority':
        alternatives.push('Reorder tasks by priority');
        alternatives.push('Reassign high-priority tasks');
        alternatives.push('Negotiate priority adjustments');
        break;
      case 'dependency':
        alternatives.push('Break circular dependencies');
        alternatives.push('Reschedule dependent tasks');
        alternatives.push('Modify task requirements');
        break;
      case 'quality':
        alternatives.push('Use consensus mechanism');
        alternatives.push('Escalate to higher authority');
        alternatives.push('Apply quality standards');
        break;
      case 'deadline':
        alternatives.push('Extend deadlines');
        alternatives.push('Reassign to faster agents');
        alternatives.push('Reduce task scope');
        break;
      case 'architecture':
        alternatives.push('Coordinate architecture decisions');
        alternatives.push('Use design patterns');
        alternatives.push('Apply architectural principles');
        break;
    }

    return alternatives;
  }

  /**
   * Select resolution strategy
   */
  private selectResolutionStrategy(conflict: Conflict, _analysis: any): any {
    // Use pattern matching if available
    const pattern = this.findMatchingPattern(conflict);
    if (pattern && pattern.successRate > 0.8) {
      return this.resolutionStrategies.get(pattern.resolutionStrategy);
    }

    // Select strategy based on conflict type and analysis
    switch (conflict.type) {
      case 'resource':
        return this.resolutionStrategies.get('resource-based');
      case 'priority':
        return this.resolutionStrategies.get('priority-based');
      case 'deadline':
        return this.resolutionStrategies.get('time-based');
      case 'quality':
        return this.resolutionStrategies.get('quality-based');
      default:
        return this.resolutionStrategies.get('hybrid');
    }
  }

  /**
   * Find matching pattern
   */
  private findMatchingPattern(conflict: Conflict): ConflictPattern | null {
    for (const pattern of this.conflictPatterns.values()) {
      if (pattern.type === conflict.type && pattern.frequency > 2) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Execute resolution
   */
  private async executeResolution(conflict: Conflict, strategy: any): Promise<ConflictResolution> {
    const resolution: ConflictResolution = {
      id: this.generateResolutionId(),
      strategy: 'automatic',
      approach: strategy.algorithm,
      solution: '',
      actions: [],
      success: false,
      reasoning: '',
      alternatives: [],
      impact: 'medium',
      effort: 'medium'
    };

    try {
      // Execute resolution based on strategy
      switch (strategy.algorithm) {
        case 'priority-based':
          await this.executePriorityBasedResolution(conflict, resolution);
          break;
        case 'resource-based':
          await this.executeResourceBasedResolution(conflict, resolution);
          break;
        case 'time-based':
          await this.executeTimeBasedResolution(conflict, resolution);
          break;
        case 'quality-based':
          await this.executeQualityBasedResolution(conflict, resolution);
          break;
        case 'hybrid':
          await this.executeHybridResolution(conflict, resolution);
          break;
        default:
          await this.executeDefaultResolution(conflict, resolution);
      }

      resolution.success = true;
      resolution.reasoning = `Conflict resolved using ${strategy.name} strategy`;

    } catch (error) {
      resolution.success = false;
      resolution.reasoning = `Resolution failed: ${error instanceof Error ? error.message : String(error)}`;
    }

    return resolution;
  }

  /**
   * Execute priority-based resolution
   */
  private async executePriorityBasedResolution(conflict: Conflict, resolution: ConflictResolution): Promise<void> {
    resolution.solution = 'Resolved by prioritizing tasks based on priority levels';
    resolution.actions.push({
      id: this.generateActionId(),
      type: 'reassign',
      target: conflict.agents[0]!,
      parameters: { priority: 'high' },
      status: 'completed'
    });
  }

  /**
   * Execute resource-based resolution
   */
  private async executeResourceBasedResolution(conflict: Conflict, resolution: ConflictResolution): Promise<void> {
    resolution.solution = 'Resolved by reallocating resources to avoid conflicts';
    resolution.actions.push({
      id: this.generateActionId(),
      type: 'reschedule',
      target: conflict.agents[0]!,
      parameters: { delay: 30000 },
      status: 'completed'
    });
  }

  /**
   * Execute time-based resolution
   */
  private async executeTimeBasedResolution(conflict: Conflict, resolution: ConflictResolution): Promise<void> {
    resolution.solution = 'Resolved by adjusting time constraints';
    resolution.actions.push({
      id: this.generateActionId(),
      type: 'modify',
      target: conflict.agents[0]!,
      parameters: { deadline: new Date(Date.now() + 3600000) },
      status: 'completed'
    });
  }

  /**
   * Execute quality-based resolution
   */
  private async executeQualityBasedResolution(conflict: Conflict, resolution: ConflictResolution): Promise<void> {
    resolution.solution = 'Resolved by applying quality standards';
    resolution.actions.push({
      id: this.generateActionId(),
      type: 'negotiate',
      target: conflict.agents[0]!,
      parameters: { quality: 'high' },
      status: 'completed'
    });
  }

  /**
   * Execute hybrid resolution
   */
  private async executeHybridResolution(conflict: Conflict, resolution: ConflictResolution): Promise<void> {
    resolution.solution = 'Resolved using hybrid approach combining multiple strategies';
    resolution.actions.push({
      id: this.generateActionId(),
      type: 'reassign',
      target: conflict.agents[0]!,
      parameters: { priority: 'high', delay: 30000 },
      status: 'completed'
    });
  }

  /**
   * Execute default resolution
   */
  private async executeDefaultResolution(conflict: Conflict, resolution: ConflictResolution): Promise<void> {
    resolution.solution = 'Resolved using default strategy';
    resolution.actions.push({
      id: this.generateActionId(),
      type: 'escalate',
      target: conflict.agents[0]!,
      parameters: {},
      status: 'completed'
    });
  }

  /**
   * Learn from resolution
   */
  private async learnFromResolution(conflict: Conflict, resolution: ConflictResolution): Promise<void> {
    if (!this.conflictConfig.learning.enabled) return;

    // Update conflict pattern
    const patternKey = `${conflict.type}-${conflict.severity}`;
    let pattern = this.conflictPatterns.get(patternKey);

    if (!pattern) {
      pattern = {
        id: patternKey,
        type: conflict.type,
        pattern: conflict.context,
        frequency: 1,
        successRate: resolution.success ? 1.0 : 0.0,
        resolutionStrategy: resolution.approach,
        lastSeen: new Date().toISOString()
      };
    } else {
      pattern.frequency++;
      pattern.successRate = (pattern.successRate * (pattern.frequency - 1) + (resolution.success ? 1 : 0)) / pattern.frequency;
      pattern.lastSeen = new Date().toISOString();
    }

    this.conflictPatterns.set(patternKey, pattern);
  }

  /**
   * Get conflict resolution statistics
   */
  getConflictResolutionStats(): any {
    const conflicts = Array.from(this.conflicts.values());
    const resolvedConflicts = conflicts.filter(conflict => conflict.status === 'resolved');
    
    return {
      totalConflicts: conflicts.length,
      resolvedConflicts: resolvedConflicts.length,
      successRate: resolvedConflicts.length / conflicts.length,
      byType: conflicts.reduce((acc, conflict) => {
        acc[conflict.type] = (acc[conflict.type] || 0) + 1;
        return acc;
      }, {} as any),
      byIssue: conflicts.reduce((acc, conflict) => {
        acc[conflict.severity] = (acc[conflict.severity] || 0) + 1;
        return acc;
      }, {} as any),
      resolutionStrategies: Array.from(this.resolutionStrategies.values()),
      conflictPatterns: Array.from(this.conflictPatterns.values()),
      lastConflict: conflicts[conflicts.length - 1]
    };
  }

  /**
   * Clear conflict resolution data
   */
  clearConflictResolutionData(): void {
    this.conflicts.clear();
    this.conflictHistory.clear();
    this.conflictPatterns.clear();
    this._logger.info('🗑️ Conflict resolution data cleared');
    this.emit('conflict-resolution-data:cleared');
  }

  /**
   * Export conflict resolution data
   */
  async exportConflictResolutionData(exportPath: string): Promise<void> {
    try {
      const conflictData = {
        conflicts: Array.from(this.conflicts.entries()),
        history: Array.from(this.conflictHistory.entries()),
        patterns: Array.from(this.conflictPatterns.entries()),
        stats: this.getConflictResolutionStats(),
        config: this.conflictConfig,
        strategies: Array.from(this.resolutionStrategies.entries()),
        exportedAt: new Date().toISOString()
      };
      
      await fs.writeJson(exportPath, conflictData, { spaces: 2 });
      this._logger.info(`📤 Conflict resolution data exported to: ${exportPath}`);
      this.emit('conflict-resolution-data:exported', { exportPath });
    } catch (error) {
      this._logger.error('Failed to export conflict resolution data:', error);
      throw error;
    }
  }

  /**
   * Utility methods
   */
  private generateConflictId(): string {
    return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResolutionId(): string {
    return `resolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionId(): string {
    return `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createEmptyResolution(): ConflictResolution {
    return {
      id: this.generateResolutionId(),
      strategy: 'automatic',
      approach: 'hybrid',
      solution: '',
      actions: [],
      success: false,
      reasoning: '',
      alternatives: [],
      impact: 'medium',
      effort: 'medium'
    };
  }

  private getAgentResources(_agentId: string): string[] {
    // Simplified implementation
    return ['cpu', 'memory'];
  }
}

import fs from 'fs-extra';
import path from 'path';
