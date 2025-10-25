/**
 * Cursor Memory Service
 * Manages memory of previous sessions, code patterns, and learning
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import fs from 'fs-extra';
import path from 'path';

export interface CodePattern {
  id: string;
  pattern: string;
  frequency: number;
  successRate: number;
  lastUsed: string;
  example: string;
}

export interface ArchitectureDecision {
  id: string;
  decision: string;
  rationale: string;
  date: string;
  impact: 'low' | 'medium' | 'high';
}

export interface NamingConvention {
  [key: string]: string;
}

export interface ProjectSession {
  id: string;
  date: string;
  duration: number;
  filesModified: number;
  patternsUsed: string[];
  decisionsMade: string[];
  successRate: number;
}

export interface LearningFeedback {
  suggestionId: string;
  type: string;
  accepted: boolean;
  userFeedback: 'positive' | 'negative' | 'neutral';
  reason?: string;
  date: string;
}

export interface CursorMemory {
  version: string;
  lastUpdated: string;
  codePatterns: {
    frequentlyUsed: CodePattern[];
    successfulPatterns: CodePattern[];
    userPreferences: {
      preferredImports: string[];
      preferredNaming: NamingConvention;
      preferredPatterns: string[];
    };
  };
  architecture: {
    decisions: ArchitectureDecision[];
    patterns: any[];
    preferences: any;
  };
  namingConventions: {
    variables: NamingConvention;
    functions: NamingConvention;
    components: NamingConvention;
    files: NamingConvention;
    constants: NamingConvention;
    [key: string]: NamingConvention; // Add index signature for dynamic access
  };
  projectHistory: {
    sessions: ProjectSession[];
    decisions: any[];
    evolution: any[];
  };
  learning: {
    successfulSuggestions: LearningFeedback[];
    rejectedSuggestions: LearningFeedback[];
    userFeedback: any;
  };
  feedback?: any[]; // Add missing feedback property
  preferences?: any; // Add missing preferences property
}

export class MemoryService extends EventEmitter {
  private _logger: Logger;
  private memory!: CursorMemory;
  private memoryFilePath: string;

  constructor(_config: Config) {
    super();
    this._logger = new Logger('MemoryService');
    this.memoryFilePath = path.join(process.cwd(), 'cursor-memory.json');
    this.initializeMemory();
  }

  /**
   * Initialize memory system
   */
  private async initializeMemory(): Promise<void> {
    try {
      await this.loadMemory();
      this._logger.info('🧠 Memory system initialized');
      this.emit('memory:initialized', { memorySize: this.getMemorySize() });
    } catch (error) {
      this._logger.error('Failed to initialize memory system:', error);
      this.createDefaultMemory();
    }
  }


  /**
   * Load memory from file
   */
  private async loadMemory(): Promise<void> {
    try {
      if (await fs.pathExists(this.memoryFilePath)) {
        this.memory = await fs.readJson(this.memoryFilePath);
        this._logger.info('📖 Memory loaded from file');
      } else {
        this.createDefaultMemory();
      }
    } catch (error) {
      this._logger.error('Failed to load memory:', error);
      this.createDefaultMemory();
    }
  }

  /**
   * Create default memory structure
   */
  private createDefaultMemory(): void {
    this.memory = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      codePatterns: {
        frequentlyUsed: [],
        successfulPatterns: [],
        userPreferences: {
          preferredImports: [],
          preferredNaming: {},
          preferredPatterns: []
        }
      },
      architecture: {
        decisions: [],
        patterns: [],
        preferences: {}
      },
      namingConventions: {
        variables: {},
        functions: {},
        components: {},
        files: {},
        constants: {}
      },
      projectHistory: {
        sessions: [],
        decisions: [],
        evolution: []
      },
      learning: {
        successfulSuggestions: [],
        rejectedSuggestions: [],
        userFeedback: {}
      }
    };
  }

  /**
   * Save memory to file
   */
  async saveMemory(): Promise<void> {
    try {
      this.memory.lastUpdated = new Date().toISOString();
      await fs.writeJson(this.memoryFilePath, this.memory, { spaces: 2 });
      this._logger.info('💾 Memory saved to file');
      this.emit('memory:saved', { memorySize: this.getMemorySize() });
    } catch (error) {
      this._logger.error('Failed to save memory:', error);
      throw error;
    }
  }

  /**
   * Record code pattern usage
   */
  recordCodePattern(pattern: CodePattern): void {
    this.ensureMemoryInitialized();
    const existingPattern = this.memory.codePatterns.frequentlyUsed.find(p => p.id === pattern.id);
    
    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastUsed = new Date().toISOString();
      existingPattern.successRate = (existingPattern.successRate + pattern.successRate) / 2;
    } else {
      this.memory.codePatterns.frequentlyUsed.push(pattern);
    }

    this._logger.info(`📝 Recorded code pattern: ${pattern.id}`);
    this.emit('pattern:recorded', { patternId: pattern.id, frequency: pattern.frequency });
  }

  /**
   * Record architecture decision
   */
  recordArchitectureDecision(decision: ArchitectureDecision): void {
    this.memory.architecture.decisions.push(decision);
    this._logger.info(`🏗️ Recorded architecture decision: ${decision.id}`);
    this.emit('decision:recorded', { decisionId: decision.id, impact: decision.impact });
  }

  /**
   * Record naming convention
   */
  recordNamingConvention(type: string, name: string, convention: string): void {
    if (!this.memory.namingConventions[type]) {
      this.memory.namingConventions[type] = {};
    }
    
    this.memory.namingConventions[type][name] = convention;
    this._logger.info(`📝 Recorded naming convention: ${type}.${name} = ${convention}`);
    this.emit('convention:recorded', { type, name, convention });
  }

  /**
   * Record project session
   */
  recordProjectSession(session: ProjectSession): void {
    this.memory.projectHistory.sessions.push(session);
    this._logger.info(`📊 Recorded project session: ${session.id}`);
    this.emit('session:recorded', { sessionId: session.id, duration: session.duration });
  }

  /**
   * Record learning feedback
   */
  recordLearningFeedback(feedback: LearningFeedback): void {
    if (feedback.accepted) {
      this.memory.learning.successfulSuggestions.push(feedback);
    } else {
      this.memory.learning.rejectedSuggestions.push(feedback);
    }

    this._logger.info(`📚 Recorded learning feedback: ${feedback.suggestionId}`);
    this.emit('feedback:recorded', { suggestionId: feedback.suggestionId, accepted: feedback.accepted });
  }

  /**
   * Get contextual suggestions based on history
   */
  getContextualSuggestions(_context: string): any[] {
    const suggestions = [];
    
    // Get relevant patterns
    const relevantPatterns = this.memory.codePatterns.frequentlyUsed
      .filter(pattern => pattern.successRate > 0.8)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Get relevant decisions
    const relevantDecisions = this.memory.architecture.decisions
      .filter(decision => decision.impact === 'high')
      .slice(0, 3);

    // Get relevant naming conventions
    const relevantConventions = this.memory.namingConventions;

    suggestions.push({
      type: 'patterns',
      data: relevantPatterns,
      confidence: 0.9
    });

    suggestions.push({
      type: 'decisions',
      data: relevantDecisions,
      confidence: 0.85
    });

    suggestions.push({
      type: 'conventions',
      data: relevantConventions,
      confidence: 0.8
    });

    this._logger.info(`💡 Generated ${suggestions.length} contextual suggestions`);
    return suggestions;
  }

  /**
   * Learn from user feedback
   */
  learnFromFeedback(feedback: LearningFeedback): void {
    this.recordLearningFeedback(feedback);
    
    // Update pattern success rates
    if (feedback.accepted) {
      this.updatePatternSuccessRate(feedback.suggestionId, 0.1);
    } else {
      this.updatePatternSuccessRate(feedback.suggestionId, -0.1);
    }

    this._logger.info(`🧠 Learned from feedback: ${feedback.suggestionId}`);
    this.emit('learning:updated', { suggestionId: feedback.suggestionId, accepted: feedback.accepted });
  }

  /**
   * Update pattern success rate
   */
  private updatePatternSuccessRate(patternId: string, adjustment: number): void {
    const pattern = this.memory.codePatterns.frequentlyUsed.find(p => p.id === patternId);
    if (pattern) {
      pattern.successRate = Math.max(0, Math.min(1, pattern.successRate + adjustment));
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): any {
    return {
      totalPatterns: this.memory.codePatterns.frequentlyUsed.length,
      totalDecisions: this.memory.architecture.decisions.length,
      totalSessions: this.memory.projectHistory.sessions.length,
      totalSuggestions: this.memory.learning.successfulSuggestions.length + this.memory.learning.rejectedSuggestions.length,
      successRate: this.calculateOverallSuccessRate(),
      lastUpdated: this.memory.lastUpdated
    };
  }

  /**
   * Calculate overall success rate
   */
  private calculateOverallSuccessRate(): number {
    const totalSuggestions = this.memory.learning.successfulSuggestions.length + this.memory.learning.rejectedSuggestions.length;
    if (totalSuggestions === 0) return 0;
    return this.memory.learning.successfulSuggestions.length / totalSuggestions;
  }

  /**
   * Get memory size
   */
  private getMemorySize(): number {
    return JSON.stringify(this.memory).length;
  }

  /**
   * Clear memory
   */
  async clearMemory(): Promise<void> {
    this.createDefaultMemory();
    await this.saveMemory();
    this._logger.info('🗑️ Memory cleared');
    this.emit('memory:cleared');
  }

  /**
   * Export memory
   */
  async exportMemory(exportPath: string): Promise<void> {
    try {
      await fs.writeJson(exportPath, this.memory, { spaces: 2 });
      this._logger.info(`📤 Memory exported to: ${exportPath}`);
      this.emit('memory:exported', { exportPath });
    } catch (error) {
      this._logger.error('Failed to export memory:', error);
      throw error;
    }
  }

  /**
   * Import memory
   */
  async importMemory(importPath: string): Promise<void> {
    try {
      const importedMemory = await fs.readJson(importPath);
      this.memory = importedMemory;
      await this.saveMemory();
      this._logger.info(`📥 Memory imported from: ${importPath}`);
      this.emit('memory:imported', { importPath });
    } catch (error) {
      this._logger.error('Failed to import memory:', error);
      throw error;
    }
  }

  /**
   * Store user feedback for learning
   */
  async storeFeedback(feedback: any): Promise<void> {
    try {
      if (!this.memory.feedback) {
        this.memory.feedback = [];
      }
      
      const feedbackEntry = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...feedback,
        timestamp: new Date().toISOString()
      };
      
      this.memory.feedback.push(feedbackEntry);
      await this.saveMemory();
      
      this._logger.info('📝 Feedback stored successfully');
      this.emit('feedback:stored', feedbackEntry);
    } catch (error) {
      this._logger.error('Failed to store feedback:', error);
      throw error;
    }
  }

  /**
   * Store user preferences
   */
  async storePreferences(preferences: any): Promise<void> {
    try {
      this.memory.preferences = {
        ...this.memory.preferences,
        ...preferences,
        lastUpdated: new Date().toISOString()
      };
      
      await this.saveMemory();
      
      this._logger.info('⚙️ Preferences stored successfully');
      this.emit('preferences:stored', preferences);
    } catch (error) {
      this._logger.error('Failed to store preferences:', error);
      throw error;
    }
  }

  /**
   * Get memory object
   */
  getMemory(): CursorMemory {
    return this.memory;
  }

  /**
   * Initialize memory if not already done
   */
  private ensureMemoryInitialized(): void {
    if (!this.memory) {
      this.createDefaultMemory();
    }
  }
}
