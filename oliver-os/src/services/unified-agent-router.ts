/**
 * Unified Agent Router Service
 * Central routing for messages from Python agent to Oliver-OS systems
 * Supports explicit routing (send to cursor/agents) and auto-mode (intelligent routing)
 */

import { Logger } from '../core/logger';
import { Config } from '../core/config';
import { MasterOrchestrator } from './monster-mode/master-orchestrator';
import type { Task } from './monster-mode/types';
import fs from 'fs-extra'
import path from 'node:path'

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
  private serviceManager?: any;
  private recentDecisions: Array<{ ts: string; sender: string; message: string; destination: string; intent: any; decision?: any; retrieved?: any[] }>= [];
  private readonly maxDecisions = 100;
  private pending: Map<string, { request: RouteRequest; destination: string }>= new Map();

  constructor(config: Config, serviceManager?: any) {
    this.config = config;
    this.logger = new Logger('UnifiedAgentRouter');
    this.serviceManager = serviceManager;
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
      // Safety gate: detect risky before execution
      const risky = isRisky(request.message, request.translated);
      if (risky) {
        const pendingId = this.createPending(request, 'monster-mode');
        const res: RouteResult = {
          destination: 'monster-mode',
          intent: { type: request.translated?.type || 'code-generation', priority: request.translated?.priority || 'medium', confidence: 'high' },
          decision: { reason: 'Risky action detected - confirmation required', rulesMatched: ['safety:risky'] },
          message: pendingId
        };
        this.recordDecision(request, res);
        await this.writeAudit('PENDING', request, res);
        return res;
      }
      const res = await this.routeToMonsterMode(message, translated, {
        reason: target === 'monster-mode' ? 'Explicit target from client' : 'Default route (no auto/target)'.trim(),
        rulesMatched: target === 'monster-mode' ? ['explicit:monster-mode'] : ['default']
      });
      this.recordDecision(request, res);
      await this.writeAudit('EXECUTE', request, res);
      return res;
    }

    if (auto) {
      // Safety: evaluate risky
      const risky = isRisky(request.message, request.translated);
      if (risky) {
        const pendingId = this.createPending(request, 'auto');
        const res: RouteResult = {
          destination: 'monster-mode',
          intent: { type: request.translated?.type || 'code-generation', priority: request.translated?.priority || 'medium', confidence: 'high' },
          decision: { reason: 'Risky action detected - confirmation required', rulesMatched: ['safety:risky'] },
          message: pendingId
        };
        this.recordDecision(request, res);
        await this.writeAudit('PENDING', request, res);
        return res;
      }
      const res = await this.routeAutoMode(message, translated);
      this.recordDecision(request, res);
      await this.writeAudit('EXECUTE', request, res);
      return res;
    }

    this.logger.warn('No explicit routing specified, defaulting to Monster Mode');
    const risky = isRisky(request.message, request.translated);
    if (risky) {
      const pendingId = this.createPending(request, 'monster-mode');
      const res: RouteResult = {
        destination: 'monster-mode',
        intent: { type: request.translated?.type || 'code-generation', priority: request.translated?.priority || 'medium', confidence: 'high' },
        decision: { reason: 'Risky action detected - confirmation required', rulesMatched: ['safety:risky'] },
        message: pendingId
      };
      this.recordDecision(request, res);
      await this.writeAudit('PENDING', request, res);
      return res;
    }
    const res = await this.routeToMonsterMode(message, translated, { reason: 'Fallback default', rulesMatched: ['default'] });
    this.recordDecision(request, res);
    await this.writeAudit('EXECUTE', request, res);
    return res;
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

    // Execute destination
    if (destination === 'codebuff') {
      return await this.routeToCodeBuff(message, translated, { reason, rulesMatched });
    }
    if (destination === 'cursor') {
      return await this.routeToCursor(message, translated, { reason, rulesMatched });
    }
    return await this.routeToMonsterMode(message, translated, { reason, rulesMatched });
  }

  getStatus(): { initialized: boolean; monsterModeReady: boolean } {
    return {
      initialized: this.initialized,
      monsterModeReady: !!this.monster
    };
  }

  public getRecentDecisions(): Array<{ ts: string; sender: string; message: string; destination: string; intent: any; decision?: any; retrieved?: any[] }>{
    return this.recentDecisions.slice(-this.maxDecisions);
  }

  private recordDecision(req: RouteRequest, res: RouteResult): void {
    const item = {
      ts: new Date().toISOString(),
      sender: req.sender,
      message: req.message,
      destination: res.destination,
      intent: res.intent,
      decision: res.decision,
      retrieved: Array.isArray((req.translated as any)?.metadata?.retrieved)
        ? (req.translated as any).metadata.retrieved
        : []
    };
    this.recentDecisions.push(item);
    if (this.recentDecisions.length > this.maxDecisions) {
      this.recentDecisions = this.recentDecisions.slice(-this.maxDecisions);
    }
  }

  private createPending(request: RouteRequest, destination: string): string {
    const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.pending.set(id, { request, destination });
    return id;
  }

  public consumePending(id: string): { request: RouteRequest; destination: string } | undefined {
    const it = this.pending.get(id);
    if (it) this.pending.delete(id);
    return it;
  }

  public getPending(): Array<{ id: string; sender: string; message: string; destination: string; intent: any }>{
    const items: Array<{ id: string; sender: string; message: string; destination: string; intent: any }>= [];
    for (const [id, { request, destination }] of this.pending.entries()) {
      items.push({
        id,
        sender: request.sender,
        message: request.message,
        destination,
        intent: { type: request.translated?.type || 'code-generation', priority: request.translated?.priority || 'medium' }
      });
    }
    return items;
  }

  private async writeAudit(action: 'PENDING'|'EXECUTE'|'CONFIRM', req: RouteRequest, res: RouteResult): Promise<void> {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      await fs.ensureDir(logDir);
      const line = JSON.stringify({ ts: new Date().toISOString(), action, req, res }) + '\n';
      await fs.appendFile(path.join(logDir, 'audit.log'), line, 'utf-8');
    } catch (_) { /* ignore */ }
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

// New destination handlers
export interface DecisionCtx { reason: string; rulesMatched: string[] }

// Route to CodeBuff (via AgentManager through ServiceManager)
// Chooses an agent type based on translated.type
UnifiedAgentRouter.prototype.routeToCodeBuff = async function (
  this: UnifiedAgentRouter,
  message: string,
  translated?: RouteRequest['translated'],
  decision?: DecisionCtx
): Promise<RouteResult> {
  if (!this.serviceManager || !this.serviceManager.spawnAgent) {
    this.logger.warn('ServiceManager not available; falling back to Monster Mode');
    return await this.routeToMonsterMode(message, translated, decision);
  }
  const t = (translated?.type || 'code-generation').toLowerCase();
  let agentType = 'code-generator';
  if (t.includes('review')) agentType = 'code-reviewer';
  else if (t.includes('documentation') || t.includes('doc')) agentType = 'documentation-generator';

  const prompt = translated?.description || message;
  const spawned = await this.serviceManager.spawnAgent({ agentType, prompt, metadata: { translated, source: 'unified-router' } });

  return {
    destination: 'codebuff',
    intent: { type: translated?.type || 'code-generation', priority: translated?.priority || 'medium', confidence: 'high' },
    taskId: spawned.id,
    decision
  };
};

// Route to Cursor by writing a request file for the Cursor chat workflow
UnifiedAgentRouter.prototype.routeToCursor = async function (
  this: UnifiedAgentRouter,
  message: string,
  translated?: RouteRequest['translated'],
  decision?: DecisionCtx
): Promise<RouteResult> {
  try {
    const payload = {
      original: message,
      translated,
      timestamp: new Date().toISOString()
    };
    const outPath = process.cwd() + '/cursor-request.json';
    await fs.writeJson(outPath, payload, { spaces: 2 });
    this.logger.info(`📝 Cursor request written at ${outPath}`);
    return {
      destination: 'cursor',
      intent: { type: translated?.type || 'documentation', priority: translated?.priority || 'medium', confidence: 'high' },
      message: outPath,
      decision
    };
  } catch (e) {
    this.logger.error('Failed to write cursor request:', e);
    // Fallback to Monster Mode if file write fails
    return await this.routeToMonsterMode(message, translated, decision);
  }
};

function isRisky(message: string, translated?: any): boolean {
  const text = `${message} ${(translated?.description || '')}`.toLowerCase();
  const keywords = [
    'drop database', 'truncate table', 'delete from ', 'rm -rf', 'format c:', 'shutdown -h', 'wipe', 'erase all', 'destroy', 'disable firewall'
  ];
  return keywords.some(k => text.includes(k));
}


