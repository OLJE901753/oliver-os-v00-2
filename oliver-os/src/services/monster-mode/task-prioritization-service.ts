/**
 * Task Prioritization Service
 * Intelligent task prioritization and scheduling for Monster Mode
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';

export interface TaskPriority {
  id: string;
  taskId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: PriorityFactor[];
  reasoning: string;
  timestamp: string;
}

export interface PriorityFactor {
  name: string;
  weight: number;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface PriorityConfig {
  enabled: boolean;
  factors: {
    urgency: { weight: number; enabled: boolean };
    importance: { weight: number; enabled: boolean };
    complexity: { weight: number; enabled: boolean };
    dependencies: { weight: number; enabled: boolean };
    resources: { weight: number; enabled: boolean };
    quality: { weight: number; enabled: boolean };
    deadline: { weight: number; enabled: boolean };
    impact: { weight: number; enabled: boolean };
  };
  thresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  learning: {
    enabled: boolean;
    adaptationRate: number;
    historyWeight: number;
  };
}

export interface SchedulingStrategy {
  id: string;
  name: string;
  description: string;
  algorithm: 'priority-based' | 'deadline-based' | 'resource-based' | 'hybrid';
  parameters: any;
  performance: {
    efficiency: number;
    fairness: number;
    predictability: number;
  };
}

export class TaskPrioritizationService extends EventEmitter {
  private _logger: Logger;
  // private _config: Config; // Unused for now
  private priorityConfig: PriorityConfig;
  private schedulingStrategies: Map<string, SchedulingStrategy>;
  private taskPriorities: Map<string, TaskPriority>;
  private priorityHistory: Map<string, TaskPriority[]>;

  constructor(_config: Config) {
    super();
    this._logger = new Logger('TaskPrioritizationService');
    this.priorityConfig = this.getDefaultPriorityConfig();
    this.schedulingStrategies = new Map();
    this.taskPriorities = new Map();
    this.priorityHistory = new Map();
    this.initializeSchedulingStrategies();
  }

  /**
   * Initialize task prioritization service
   */
  async initialize(): Promise<void> {
    this._logger.info('🎯 Initializing Task Prioritization Service...');
    
    try {
      await this.loadPriorityConfig();
      await this.initializeSchedulingStrategies();
      
      this._logger.info('✅ Task Prioritization Service initialized successfully');
      this.emit('task-prioritization:initialized');
    } catch (error) {
      this._logger.error('Failed to initialize task prioritization service:', error);
      throw error;
    }
  }

  /**
   * Load priority configuration
   */
  private async loadPriorityConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'task-prioritization-config.json');
      if (await fs.pathExists(configPath)) {
        this.priorityConfig = await fs.readJson(configPath);
        this._logger.info('📋 Task prioritization configuration loaded');
      } else {
        this.priorityConfig = this.getDefaultPriorityConfig();
        await this.savePriorityConfig();
        this._logger.info('📋 Using default task prioritization configuration');
      }
    } catch (error) {
      this._logger.warn('Failed to load task prioritization configuration, using defaults');
      this.priorityConfig = this.getDefaultPriorityConfig();
    }
  }

  /**
   * Get default priority configuration
   */
  private getDefaultPriorityConfig(): PriorityConfig {
    return {
      enabled: true,
      factors: {
        urgency: { weight: 0.2, enabled: true },
        importance: { weight: 0.25, enabled: true },
        complexity: { weight: 0.15, enabled: true },
        dependencies: { weight: 0.1, enabled: true },
        resources: { weight: 0.1, enabled: true },
        quality: { weight: 0.1, enabled: true },
        deadline: { weight: 0.05, enabled: true },
        impact: { weight: 0.05, enabled: true }
      },
      thresholds: {
        critical: 0.9,
        high: 0.7,
        medium: 0.5,
        low: 0.3
      },
      learning: {
        enabled: true,
        adaptationRate: 0.1,
        historyWeight: 0.3
      }
    };
  }

  /**
   * Save priority configuration
   */
  private async savePriorityConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'task-prioritization-config.json');
      await fs.writeJson(configPath, this.priorityConfig, { spaces: 2 });
      this._logger.info('💾 Task prioritization configuration saved');
    } catch (error) {
      this._logger.error('Failed to save task prioritization configuration:', error);
    }
  }

  /**
   * Initialize scheduling strategies
   */
  private initializeSchedulingStrategies(): void {
    // Priority-based strategy
    this.schedulingStrategies.set('priority-based', {
      id: 'priority-based',
      name: 'Priority-Based Scheduling',
      description: 'Schedule tasks based on priority scores',
      algorithm: 'priority-based',
      parameters: {
        priorityWeight: 1.0,
        fairnessWeight: 0.3
      },
      performance: {
        efficiency: 0.9,
        fairness: 0.7,
        predictability: 0.8
      }
    });

    // Deadline-based strategy
    this.schedulingStrategies.set('deadline-based', {
      id: 'deadline-based',
      name: 'Deadline-Based Scheduling',
      description: 'Schedule tasks based on deadlines and urgency',
      algorithm: 'deadline-based',
      parameters: {
        deadlineWeight: 1.0,
        urgencyWeight: 0.5
      },
      performance: {
        efficiency: 0.8,
        fairness: 0.9,
        predictability: 0.7
      }
    });

    // Resource-based strategy
    this.schedulingStrategies.set('resource-based', {
      id: 'resource-based',
      name: 'Resource-Based Scheduling',
      description: 'Schedule tasks based on resource availability',
      algorithm: 'resource-based',
      parameters: {
        resourceWeight: 1.0,
        loadBalanceWeight: 0.4
      },
      performance: {
        efficiency: 0.7,
        fairness: 0.8,
        predictability: 0.6
      }
    });

    // Hybrid strategy
    this.schedulingStrategies.set('hybrid', {
      id: 'hybrid',
      name: 'Hybrid Scheduling',
      description: 'Combine multiple scheduling strategies',
      algorithm: 'hybrid',
      parameters: {
        priorityWeight: 0.4,
        deadlineWeight: 0.3,
        resourceWeight: 0.3
      },
      performance: {
        efficiency: 0.85,
        fairness: 0.8,
        predictability: 0.75
      }
    });
  }

  /**
   * Calculate task priority
   */
  async calculateTaskPriority(task: any, context: any): Promise<TaskPriority> {
    this._logger.info(`🎯 Calculating priority for task: ${task.id}`);
    
    try {
      const factors: PriorityFactor[] = [];
      let totalScore = 0;

      // Calculate urgency factor
      if (this.priorityConfig.factors.urgency.enabled) {
        const urgencyFactor = this.calculateUrgencyFactor(task, context);
        factors.push(urgencyFactor);
        totalScore += urgencyFactor.value * this.priorityConfig.factors.urgency.weight;
      }

      // Calculate importance factor
      if (this.priorityConfig.factors.importance.enabled) {
        const importanceFactor = this.calculateImportanceFactor(task, context);
        factors.push(importanceFactor);
        totalScore += importanceFactor.value * this.priorityConfig.factors.importance.weight;
      }

      // Calculate complexity factor
      if (this.priorityConfig.factors.complexity.enabled) {
        const complexityFactor = this.calculateComplexityFactor(task, context);
        factors.push(complexityFactor);
        totalScore += complexityFactor.value * this.priorityConfig.factors.complexity.weight;
      }

      // Calculate dependencies factor
      if (this.priorityConfig.factors.dependencies.enabled) {
        const dependenciesFactor = this.calculateDependenciesFactor(task, context);
        factors.push(dependenciesFactor);
        totalScore += dependenciesFactor.value * this.priorityConfig.factors.dependencies.weight;
      }

      // Calculate resources factor
      if (this.priorityConfig.factors.resources.enabled) {
        const resourcesFactor = this.calculateResourcesFactor(task, context);
        factors.push(resourcesFactor);
        totalScore += resourcesFactor.value * this.priorityConfig.factors.resources.weight;
      }

      // Calculate quality factor
      if (this.priorityConfig.factors.quality.enabled) {
        const qualityFactor = this.calculateQualityFactor(task, context);
        factors.push(qualityFactor);
        totalScore += qualityFactor.value * this.priorityConfig.factors.quality.weight;
      }

      // Calculate deadline factor
      if (this.priorityConfig.factors.deadline.enabled) {
        const deadlineFactor = this.calculateDeadlineFactor(task, context);
        factors.push(deadlineFactor);
        totalScore += deadlineFactor.value * this.priorityConfig.factors.deadline.weight;
      }

      // Calculate impact factor
      if (this.priorityConfig.factors.impact.enabled) {
        const impactFactor = this.calculateImpactFactor(task, context);
        factors.push(impactFactor);
        totalScore += impactFactor.value * this.priorityConfig.factors.impact.weight;
      }

      // Normalize score
      totalScore = Math.max(0, Math.min(1, totalScore));

      // Determine priority level
      const priority = this.determinePriorityLevel(totalScore);

      // Generate reasoning
      const reasoning = this.generatePriorityReasoning(factors, totalScore, priority);

      // Create task priority
      const taskPriority: TaskPriority = {
        id: this.generatePriorityId(),
        taskId: task.id,
        priority,
        score: totalScore,
        factors,
        reasoning,
        timestamp: new Date().toISOString()
      };

      // Store priority
      this.taskPriorities.set(task.id, taskPriority);

      // Store in history
      if (!this.priorityHistory.has(task.id)) {
        this.priorityHistory.set(task.id, []);
      }
      this.priorityHistory.get(task.id)!.push(taskPriority);

      this._logger.info(`✅ Priority calculated for task ${task.id}: ${priority} (${(totalScore * 100).toFixed(1)}%)`);
      this.emit('task-priority:calculated', { taskPriority });
      
      return taskPriority;
    } catch (error) {
      this._logger.error(`Failed to calculate priority for task ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate urgency factor
   */
  private calculateUrgencyFactor(task: any, _context: any): PriorityFactor {
    let urgency = 0;

    // Check for immediate deadlines
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const now = new Date();
      const timeDiff = deadline.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 1) urgency = 1.0;
      else if (hoursDiff < 4) urgency = 0.8;
      else if (hoursDiff < 24) urgency = 0.6;
      else if (hoursDiff < 72) urgency = 0.4;
      else urgency = 0.2;
    }

    // Check for blocking other tasks
    if (task.blocking && task.blocking.length > 0) {
      urgency += 0.3;
    }

    // Check for user requests
    if (task.userRequested) {
      urgency += 0.2;
    }

    return {
      name: 'urgency',
      weight: this.priorityConfig.factors.urgency.weight,
      value: Math.min(1, urgency),
      impact: urgency > 0.5 ? 'positive' : 'neutral',
      description: `Urgency based on deadline and blocking factors: ${(urgency * 100).toFixed(1)}%`
    };
  }

  /**
   * Calculate importance factor
   */
  private calculateImportanceFactor(task: any, _context: any): PriorityFactor {
    let importance = 0.5; // Base importance

    // Check task type
    switch (task.type) {
      case 'critical-bugfix':
        importance = 1.0;
        break;
      case 'security-fix':
        importance = 0.9;
        break;
      case 'feature':
        importance = 0.7;
        break;
      case 'refactor':
        importance = 0.6;
        break;
      case 'documentation':
        importance = 0.4;
        break;
      default:
        importance = 0.5;
    }

    // Check business impact
    if (task.businessImpact) {
      switch (task.businessImpact) {
        case 'high':
          importance += 0.3;
          break;
        case 'medium':
          importance += 0.2;
          break;
        case 'low':
          importance += 0.1;
          break;
      }
    }

    // Check user impact
    if (task.userImpact) {
      switch (task.userImpact) {
        case 'high':
          importance += 0.2;
          break;
        case 'medium':
          importance += 0.1;
          break;
      }
    }

    return {
      name: 'importance',
      weight: this.priorityConfig.factors.importance.weight,
      value: Math.min(1, importance),
      impact: importance > 0.7 ? 'positive' : 'neutral',
      description: `Importance based on task type and impact: ${(importance * 100).toFixed(1)}%`
    };
  }

  /**
   * Calculate complexity factor
   */
  private calculateComplexityFactor(task: any, _context: any): PriorityFactor {
    let complexity = 0.5; // Base complexity

    // Check estimated duration
    if (task.estimatedDuration) {
      const hours = task.estimatedDuration / (1000 * 60 * 60);
      if (hours > 8) complexity = 0.8;
      else if (hours > 4) complexity = 0.6;
      else if (hours > 2) complexity = 0.4;
      else complexity = 0.2;
    }

    // Check dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      complexity += 0.2;
    }

    // Check requirements
    if (task.requirements && task.requirements.length > 0) {
      complexity += 0.1 * task.requirements.length;
    }

    // Invert complexity for priority (simpler tasks get higher priority)
    const invertedComplexity = 1 - complexity;

    return {
      name: 'complexity',
      weight: this.priorityConfig.factors.complexity.weight,
      value: Math.min(1, invertedComplexity),
      impact: invertedComplexity > 0.6 ? 'positive' : 'negative',
      description: `Complexity factor (inverted): ${(invertedComplexity * 100).toFixed(1)}%`
    };
  }

  /**
   * Calculate dependencies factor
   */
  private calculateDependenciesFactor(task: any, _context: any): PriorityFactor {
    let dependencies = 0;

    // Check for blocking dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      const blockingDeps = task.dependencies.filter((dep: any) => dep.blocking);
      dependencies = blockingDeps.length / task.dependencies.length;
    }

    // Check for circular dependencies
    if (task.circularDependencies) {
      dependencies += 0.5;
    }

    return {
      name: 'dependencies',
      weight: this.priorityConfig.factors.dependencies.weight,
      value: Math.min(1, dependencies),
      impact: dependencies > 0.5 ? 'negative' : 'neutral',
      description: `Dependencies factor: ${(dependencies * 100).toFixed(1)}%`
    };
  }

  /**
   * Calculate resources factor
   */
  private calculateResourcesFactor(task: any, context: any): PriorityFactor {
    let resources = 0.5; // Base resource availability

    // Check resource requirements
    if (task.resourceRequirements) {
      const availableResources = context.availableResources || {};
      const requiredResources = task.resourceRequirements;
      
      let resourceAvailability = 1;
      for (const [resource, required] of Object.entries(requiredResources)) {
        const available = availableResources[resource] || 0;
        resourceAvailability *= Math.min(1, available / (required as number));
      }
      
      resources = resourceAvailability;
    }

    return {
      name: 'resources',
      weight: this.priorityConfig.factors.resources.weight,
      value: Math.min(1, resources),
      impact: resources > 0.7 ? 'positive' : 'negative',
      description: `Resource availability: ${(resources * 100).toFixed(1)}%`
    };
  }

  /**
   * Calculate quality factor
   */
  private calculateQualityFactor(task: any, _context: any): PriorityFactor {
    let quality = 0.5; // Base quality

    // Check quality requirements
    if (task.qualityRequirements) {
      switch (task.qualityRequirements) {
        case 'high':
          quality = 0.8;
          break;
        case 'medium':
          quality = 0.6;
          break;
        case 'low':
          quality = 0.4;
          break;
      }
    }

    // Check testing requirements
    if (task.testingRequired) {
      quality += 0.2;
    }

    // Check review requirements
    if (task.reviewRequired) {
      quality += 0.1;
    }

    return {
      name: 'quality',
      weight: this.priorityConfig.factors.quality.weight,
      value: Math.min(1, quality),
      impact: quality > 0.6 ? 'positive' : 'neutral',
      description: `Quality requirements: ${(quality * 100).toFixed(1)}%`
    };
  }

  /**
   * Calculate deadline factor
   */
  private calculateDeadlineFactor(task: any, _context: any): PriorityFactor {
    let deadline = 0;

    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const now = new Date();
      const timeDiff = deadlineDate.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      if (daysDiff < 0) deadline = 1.0; // Overdue
      else if (daysDiff < 1) deadline = 0.9;
      else if (daysDiff < 3) deadline = 0.7;
      else if (daysDiff < 7) deadline = 0.5;
      else if (daysDiff < 14) deadline = 0.3;
      else deadline = 0.1;
    }

    return {
      name: 'deadline',
      weight: this.priorityConfig.factors.deadline.weight,
      value: Math.min(1, deadline),
      impact: deadline > 0.5 ? 'positive' : 'neutral',
      description: `Deadline factor: ${(deadline * 100).toFixed(1)}%`
    };
  }

  /**
   * Calculate impact factor
   */
  private calculateImpactFactor(task: any, _context: any): PriorityFactor {
    let impact = 0.5; // Base impact

    // Check system impact
    if (task.systemImpact) {
      switch (task.systemImpact) {
        case 'high':
          impact = 0.9;
          break;
        case 'medium':
          impact = 0.6;
          break;
        case 'low':
          impact = 0.3;
          break;
      }
    }

    // Check user impact
    if (task.userImpact) {
      switch (task.userImpact) {
        case 'high':
          impact += 0.2;
          break;
        case 'medium':
          impact += 0.1;
          break;
      }
    }

    // Check business impact
    if (task.businessImpact) {
      switch (task.businessImpact) {
        case 'high':
          impact += 0.2;
          break;
        case 'medium':
          impact += 0.1;
          break;
      }
    }

    return {
      name: 'impact',
      weight: this.priorityConfig.factors.impact.weight,
      value: Math.min(1, impact),
      impact: impact > 0.6 ? 'positive' : 'neutral',
      description: `Impact factor: ${(impact * 100).toFixed(1)}%`
    };
  }

  /**
   * Determine priority level
   */
  private determinePriorityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= this.priorityConfig.thresholds.critical) return 'critical';
    if (score >= this.priorityConfig.thresholds.high) return 'high';
    if (score >= this.priorityConfig.thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Generate priority reasoning
   */
  private generatePriorityReasoning(factors: PriorityFactor[], score: number, priority: string): string {
    const topFactors = factors
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    let reasoning = `Priority: ${priority} (Score: ${(score * 100).toFixed(1)}%)\n`;
    reasoning += `Top factors: ${topFactors.map(f => `${f.name} (${(f.value * 100).toFixed(1)}%)`).join(', ')}\n`;
    
    if (topFactors.length > 0) {
      reasoning += `Primary factor: ${topFactors[0]!.description}`;
    }

    return reasoning;
  }

  /**
   * Schedule tasks
   */
  async scheduleTasks(tasks: any[], strategy: string = 'hybrid'): Promise<any[]> {
    this._logger.info(`📅 Scheduling ${tasks.length} tasks using ${strategy} strategy`);
    
    try {
      const schedulingStrategy = this.schedulingStrategies.get(strategy);
      if (!schedulingStrategy) {
        throw new Error(`Unknown scheduling strategy: ${strategy}`);
      }

      // Calculate priorities for all tasks
      const taskPriorities = await Promise.all(
        tasks.map(async (task) => {
          const priority = await this.calculateTaskPriority(task, {});
          return { task, priority };
        })
      );

      // Sort tasks based on strategy
      const scheduledTasks = this.sortTasksByStrategy(taskPriorities, schedulingStrategy);

      this._logger.info(`✅ Scheduled ${scheduledTasks.length} tasks`);
      this.emit('tasks:scheduled', { scheduledTasks, strategy });
      
      return scheduledTasks;
    } catch (error) {
      this._logger.error('Failed to schedule tasks:', error);
      throw error;
    }
  }

  /**
   * Sort tasks by strategy
   */
  private sortTasksByStrategy(taskPriorities: any[], strategy: SchedulingStrategy): any[] {
    switch (strategy.algorithm) {
      case 'priority-based':
        return taskPriorities.sort((a, b) => b.priority.score - a.priority.score);
      
      case 'deadline-based':
        return taskPriorities.sort((a, b) => {
          const aDeadline = new Date(a.task.deadline || '2099-12-31');
          const bDeadline = new Date(b.task.deadline || '2099-12-31');
          return aDeadline.getTime() - bDeadline.getTime();
        });
      
      case 'resource-based':
        return taskPriorities.sort((a, b) => {
          const aResources = a.task.resourceRequirements ? Object.keys(a.task.resourceRequirements).length : 0;
          const bResources = b.task.resourceRequirements ? Object.keys(b.task.resourceRequirements).length : 0;
          return aResources - bResources;
        });
      
      case 'hybrid':
        return taskPriorities.sort((a, b) => {
          const aScore = this.calculateHybridScore(a, strategy.parameters);
          const bScore = this.calculateHybridScore(b, strategy.parameters);
          return bScore - aScore;
        });
      
      default:
        return taskPriorities.sort((a, b) => b.priority.score - a.priority.score);
    }
  }

  /**
   * Calculate hybrid score
   */
  private calculateHybridScore(taskPriority: any, parameters: any): number {
    const priorityScore = taskPriority.priority.score * parameters.priorityWeight;
    
    let deadlineScore = 0;
    if (taskPriority.task.deadline) {
      const deadline = new Date(taskPriority.task.deadline);
      const now = new Date();
      const timeDiff = deadline.getTime() - now.getTime();
      deadlineScore = Math.max(0, 1 - (timeDiff / (1000 * 60 * 60 * 24 * 7))); // 1 week normalization
    }
    
    let resourceScore = 0;
    if (taskPriority.task.resourceRequirements) {
      const resourceCount = Object.keys(taskPriority.task.resourceRequirements).length;
      resourceScore = Math.max(0, 1 - (resourceCount / 10)); // Normalize to 10 resources
    }
    
    return priorityScore + (deadlineScore * parameters.deadlineWeight) + (resourceScore * parameters.resourceWeight);
  }

  /**
   * Get task prioritization statistics
   */
  getTaskPrioritizationStats(): any {
    const priorities = Array.from(this.taskPriorities.values());
    
    return {
      totalPriorities: priorities.length,
      byPriority: priorities.reduce((acc, priority) => {
        acc[priority.priority] = (acc[priority.priority] || 0) + 1;
        return acc;
      }, {} as any),
      averageScore: priorities.reduce((sum, priority) => sum + priority.score, 0) / priorities.length,
      topFactors: this.getTopFactors(priorities),
      schedulingStrategies: Array.from(this.schedulingStrategies.values()),
      lastPriority: priorities[priorities.length - 1]
    };
  }

  /**
   * Get top factors
   */
  private getTopFactors(priorities: TaskPriority[]): any[] {
    const factorCounts = new Map<string, number>();
    const factorValues = new Map<string, number[]>();
    
    for (const priority of priorities) {
      for (const factor of priority.factors) {
        factorCounts.set(factor.name, (factorCounts.get(factor.name) || 0) + 1);
        if (!factorValues.has(factor.name)) {
          factorValues.set(factor.name, []);
        }
        factorValues.get(factor.name)!.push(factor.value);
      }
    }
    
    return Array.from(factorCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        averageValue: factorValues.get(name)!.reduce((sum, val) => sum + val, 0) / factorValues.get(name)!.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Clear task prioritization data
   */
  clearTaskPrioritizationData(): void {
    this.taskPriorities.clear();
    this.priorityHistory.clear();
    this._logger.info('🗑️ Task prioritization data cleared');
    this.emit('task-prioritization-data:cleared');
  }

  /**
   * Export task prioritization data
   */
  async exportTaskPrioritizationData(exportPath: string): Promise<void> {
    try {
      const prioritizationData = {
        priorities: Array.from(this.taskPriorities.entries()),
        history: Array.from(this.priorityHistory.entries()),
        stats: this.getTaskPrioritizationStats(),
        config: this.priorityConfig,
        strategies: Array.from(this.schedulingStrategies.entries()),
        exportedAt: new Date().toISOString()
      };
      
      await fs.writeJson(exportPath, prioritizationData, { spaces: 2 });
      this._logger.info(`📤 Task prioritization data exported to: ${exportPath}`);
      this.emit('task-prioritization-data:exported', { exportPath });
    } catch (error) {
      this._logger.error('Failed to export task prioritization data:', error);
      throw error;
    }
  }

  /**
   * Utility methods
   */
  private generatePriorityId(): string {
    return `priority-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

import fs from 'fs-extra';
import path from 'path';
