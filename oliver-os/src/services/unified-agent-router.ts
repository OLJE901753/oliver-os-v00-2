/**
 * Unified Agent Router Service
 * Central routing for messages from Python agent to Oliver-OS systems
 * Supports explicit routing (send to cursor/agents) and auto-mode (intelligent routing)
 */

import { Logger } from '../core/logger';
import { Config } from '../core/config';
import { MasterOrchestrator } from './monster-mode/master-orchestrator';
import type { Task } from './monster-mode/types';

export interface RouteRequest {
  sender: string;
  message: string;
  translated?: {
    type: string;
    priority: string;
    description: string;
    requirements: string[];
    estimated_duration?: number;
    dependencies?: string[];
    metadata?: Record<string, any>;
  };
  auto?: boolean;
  target?: string;
}

export interface RouteResult {
  taskId?: string;
  destination: string;
  intent: {
    type: string;
    priority: string;
    confidence: string;
  };
  decision?: {
    reason: string;
    rulesMatched: string[];
  };
  message?: string;
}

export class UnifiedAgentRouter {
  private logger: Logger;
  private config: Config;
  private monster?: MasterOrchestrator;
  private initialized: boolean = false;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger('UnifiedAgentRouter');
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.info('UnifiedAgentRouter already initialized');
      return;
    }

    try {
      this.logger.info('🔀 Initializing Unified Agent Router...');
      this.monster = new MasterOrchestrator(this.config);
      await this.monster.initialize();
      this.initialized = true;
      this.logger.info('✅ UnifiedAgentRouter ready (Monster Mode initialized)');
    } catch (error) {
      this.logger.error('Failed to initialize UnifiedAgentRouter:', error);
      throw error;
    }
  }

  async route(request: RouteRequest): Promise<RouteResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const { sender, message, translated, auto = false, target } = request;
    this.logger.info(`📨 Routing message from ${sender}: ${message.substring(0, 50)}...`);

    if (target === 'monster-mode' || (!auto && !target)) {
      return await this.routeToMonsterMode(message, translated, {
        reason: target === 'monster-mode' ? 'Explicit target from client' : 'Default route (no auto/target)'.trim(),
        rulesMatched: target === 'monster-mode' ? ['explicit:monster-mode'] : ['default']
      });
    }

    if (auto) {
      return await this.routeAutoMode(message, translated);
    }

    this.logger.warn('No explicit routing specified, defaulting to Monster Mode');
    return await this.routeToMonsterMode(message, translated, { reason: 'Fallback default', rulesMatched: ['default'] });
  }

  private async routeToMonsterMode(
    message: string,
    translated?: RouteRequest['translated'],
    decision?: { reason: string; rulesMatched: string[] }
  ): Promise<RouteResult> {
    if (!this.monster) {
      throw new Error('Monster Mode not initialized');
    }

    try {
      const task: Omit<Task, 'id' | 'status' | 'assignedAgent' | 'startTime' | 'endTime'> = {
        type: mapTypeToMonsterMode(translated?.type || 'code-generation'),
        priority: mapPriority(translated?.priority || 'medium'),
        description: translated?.description || message,
        context: {
          originalMessage: message,
          translated: translated,
          sender: 'python-agent'
        },
        requirements: translated?.requirements || ['general'],
        dependencies: translated?.dependencies || [],
        estimatedDuration: translated?.estimated_duration || 15 * 60 * 1000,
        metadata: {
          ...translated?.metadata,
          routingSource: 'python-agent',
          translationMethod: translated ? 'translated' : 'direct'
        }
      };

      const taskId = await this.monster.submitTask(task);
      this.logger.info(`✅ Task routed to Monster Mode: ${taskId}`);

      return {
        taskId,
        destination: 'monster-mode',
        intent: {
          type: translated?.type || 'code-generation',
          priority: translated?.priority || 'medium',
          confidence: translated ? 'high' : 'medium'
        },
        decision
      };
    } catch (error) {
      this.logger.error('Failed to route to Monster Mode:', error);
      throw error;
    }
  }

  private async routeAutoMode(
    message: string,
    translated?: RouteRequest['translated']
  ): Promise<RouteResult> {
    this.logger.info('🤖 Auto-mode: Analyzing intent for routing...');

    const taskType = (translated?.type || '').toLowerCase();
    const pri = translated?.priority || 'medium';

    const rulesMatched: string[] = [];
    if (taskType.includes('research') || taskType.includes('question')) {
      rulesMatched.push('intent:research|question');
    }
    if (taskType.includes('optimization')) {
      rulesMatched.push('intent:optimization');
    }
    if (taskType.includes('review')) {
      rulesMatched.push('intent:review');
    }
    if (taskType.includes('documentation')) {
      rulesMatched.push('intent:documentation');
    }
    if (taskType.includes('code') || taskType.includes('generation') || taskType === '') {
      rulesMatched.push('intent:code-generation');
    }

    // Simple policy: map to destination
    let destination: 'monster-mode' | 'codebuff' | 'cursor' = 'monster-mode';
    if (rulesMatched.includes('intent:research|question')) destination = 'codebuff';
    else if (rulesMatched.includes('intent:documentation')) destination = 'cursor';
    else destination = 'monster-mode';

    const reason = decideReason(taskType, pri, rulesMatched) + `; policyDestination=${destination}`;

    // Execute: For now we only support Monster Mode execution, so fallback
    const result = await this.routeToMonsterMode(message, translated, { reason, rulesMatched });
    // Override reported destination for visibility
    result.destination = destination;
    return result;
  }

  getStatus(): { initialized: boolean; monsterModeReady: boolean } {
    return {
      initialized: this.initialized,
      monsterModeReady: !!this.monster
    };
  }
}

function mapTypeToMonsterMode(type: string): Task['type'] {
  const typeMap: Record<string, Task['type']> = {
    'code-generation': 'code-generation',
    'review': 'review',
    'optimization': 'optimization',
    'documentation': 'documentation',
    'research': 'code-generation',
    'question': 'code-generation',
    'debugging': 'quality-check',
    'testing': 'quality-check'
  };
  return typeMap[type] || 'code-generation';
}

function mapPriority(priority: string): Task['priority'] {
  const priorityMap: Record<string, Task['priority']> = {
    'critical': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };
  return priorityMap[priority] || 'medium';
}

function decideReason(taskType: string, priority: string, rules: string[]): string {
  if (rules.includes('intent:review')) return 'Review tasks require orchestration and QA → Monster Mode';
  if (rules.includes('intent:research|question')) return 'Research/question tasks can be orchestrated for follow-up work → Monster Mode (Phase 2)';
  return 'Code generation and execution best handled by Monster Mode';
}


