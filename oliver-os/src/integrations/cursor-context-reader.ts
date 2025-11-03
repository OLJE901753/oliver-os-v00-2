/**
 * Cursor Context Reader
 * Reads agent memory and context for Cursor AI
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { Logger } from '../core/logger';

const logger = new Logger('CursorContextReader');

interface AgentMemory {
  patterns?: Array<Record<string, unknown>>;
  preferences?: Record<string, unknown>;
}

interface CursorMemory {
  recentFiles?: string[];
  history?: Array<Record<string, unknown>>;
}

interface CombinedContext {
  knowledge?: Array<Record<string, unknown>>;
  memories?: Array<Record<string, unknown>>;
}

interface ThinkingStyle {
  pattern?: string;
  frequency?: number;
}

interface CodingPhilosophy {
  principles?: string[];
  approach?: string;
}

interface CognitiveProfile {
  learningStyle?: string;
  processingStyle?: string;
}

interface CodingPreferences {
  codingStyle?: Record<string, unknown>;
  patterns?: string[];
}

export interface CursorRequest {
  message: string;
  agent_memory: AgentMemory;
  cursor_memory: CursorMemory;
  combined_context: CombinedContext;
  timestamp: string;
  user_patterns: {
    thinking_style: ThinkingStyle[];
    coding_philosophy: CodingPhilosophy;
    cognitive_profile: CognitiveProfile;
    coding_preferences: CodingPreferences;
  };
}

/**
 * Read latest request from Python agent
 */
export async function readLatestRequest(): Promise<CursorRequest | null> {
  try {
    const file = join(process.cwd(), 'cursor-request.json');
    
    if (!existsSync(file)) {
      return null;
    }
    
    const data = await readFile(file, 'utf-8');
    const request = JSON.parse(data);
    
    logger.info('📖 Read cursor request from Python agent');
    return request;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
      const errorMessage = 'message' in error ? String(error.message) : 'Unknown error';
      logger.warn(`Could not read cursor request: ${errorMessage}`);
    }
    return null;
  }
}

/**
 * Get agent memory for Cursor context
 */
export async function getAgentMemory(): Promise<AgentMemory | null> {
  try {
    const file = join(process.cwd(), 'ai-services', 'memory', 'agent-memory.json');
    
    if (!existsSync(file)) {
      logger.warn('Agent memory file not found');
      return null;
    }
    
    const data = await readFile(file, 'utf-8');
    return JSON.parse(data) as AgentMemory;
  } catch (error: unknown) {
    const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error';
    logger.warn(`Could not load agent memory: ${errorMessage}`);
    return null;
  }
}

/**
 * Get combined context summary for Cursor
 */
export async function getCombinedContextSummary(): Promise<string> {
  const request = await readLatestRequest();
  
  if (!request) {
    return 'No agent context available';
  }
  
  const { user_patterns, message } = request;
  
  let summary = `📋 Agent-Enriched Request:\n\n`;
  summary += `🎯 Task: ${message}\n\n`;
  
  // Add thinking style
  const thinkingStyle = user_patterns.thinking_style || [];
  if (thinkingStyle.length > 0) {
    summary += `🧠 Thinking Patterns: ${thinkingStyle.length} recorded patterns\n`;
  }
  
  // Add coding philosophy
  const philosophy = user_patterns.coding_philosophy || {};
  if (philosophy.principles) {
    summary += `💡 Coding Principles: ${philosophy.principles.join(', ')}\n`;
  }
  
  // Add cognitive profile
  const cognitive = user_patterns.cognitive_profile || {};
  if (cognitive.learningStyle) {
    summary += `📚 Learning Style: ${cognitive.learningStyle}\n`;
  }
  
  // Add preferences
  const preferences = user_patterns.coding_preferences || {};
  if (preferences.codingStyle) {
    summary += `⚙️  Style: ${JSON.stringify(preferences.codingStyle)}\n`;
  }
  
  return summary;
}

/**
 * Get full enriched context for Cursor
 */
interface FullContext {
  agent_memory: AgentMemory | null;
  message: string | null;
  timestamp: string;
}

export async function getFullContext(): Promise<CursorRequest | FullContext> {
  const request = await readLatestRequest();
  
  if (!request) {
    const agentMemory = await getAgentMemory();
    return {
      agent_memory: agentMemory,
      message: null,
      timestamp: new Date().toISOString()
    };
  }
  
  return request;
}

