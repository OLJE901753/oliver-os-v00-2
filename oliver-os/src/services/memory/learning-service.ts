/**
 * Cursor Learning Service
 * Advanced learning algorithms for pattern recognition and suggestion improvement
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import { MemoryService } from './memory-service';
import fs from 'fs-extra';
import path from 'path';

export interface LearningPattern {
  id: string;
  type: 'code' | 'architecture' | 'naming' | 'workflow';
  pattern: string;
  context: string;
  successRate: number;
  frequency: number;
  lastUsed: string;
  confidence: number;
}

export interface Suggestion {
  id: string;
  type: 'code-generation' | 'refactoring' | 'optimization' | 'architecture';
  content: string;
  confidence: number;
  reasoning: string;
  alternatives: string[];
  context: string;
}

export interface LearningContext {
  currentFile: string;
  projectStructure: string[];
  recentChanges: string[];
  userPreferences: any;
  codingPatterns: string[];
}

export class LearningService extends EventEmitter {
  private _logger: Logger;
  private memoryService!: MemoryService;
  private learningPatterns: Map<string, LearningPattern>;
  private suggestionHistory: Map<string, any[]>;
  private currentCodingStyle: string = 'default';
  private recentAdaptations: Array<{ pattern: string; confidence: number; timestamp: string }> = [];

  constructor(_config: Config, memoryService: MemoryService) {
    super();
    this.memoryService = memoryService;
    this._logger = new Logger('LearningService');
    this.learningPatterns = new Map();
    this.suggestionHistory = new Map();
  }

  /**
   * Initialize learning service
   */
  async initialize(): Promise<void> {
    this._logger.info('🧠 Initializing Learning Service...');
    
    try {
      // Ensure logs directory exists
      await fs.ensureDir(path.join(process.cwd(), 'logs'));
      
      await this.loadLearningPatterns();
      await this.analyzeProjectHistory();
      await this.buildPatternDatabase();
      
      this.logLearningEvent('service_initialized', {
        patternsLoaded: this.learningPatterns.size,
        timestamp: new Date().toISOString()
      });
      
      this._logger.info('✅ Learning Service initialized successfully');
      this.emit('learning:initialized');
    } catch (error) {
      this._logger.error('Failed to initialize learning service:', error);
      throw error;
    }
  }

  /**
   * Load learning patterns from memory
   */
  private async loadLearningPatterns(): Promise<void> {
    const memory = this.memoryService as any;
    const patterns = memory.memory?.codePatterns?.frequentlyUsed || [];
    
    for (const pattern of patterns) {
      const confidence = pattern.successRate * 0.8 + (pattern.frequency / 100) * 0.2;
      this.learningPatterns.set(pattern.id, {
        id: pattern.id,
        type: 'code',
        pattern: pattern.pattern,
        context: pattern.example,
        successRate: pattern.successRate,
        frequency: pattern.frequency,
        lastUsed: pattern.lastUsed,
        confidence
      });
      
      // Log pattern detection
      this.logLearningEvent('pattern_loaded', {
        patternId: pattern.id,
        pattern: pattern.pattern,
        successRate: pattern.successRate,
        frequency: pattern.frequency,
        confidence
      });
    }

    this._logger.info(`📚 Loaded ${patterns.length} learning patterns`);
  }

  /**
   * Analyze project history for patterns
   */
  private async analyzeProjectHistory(): Promise<void> {
    const memory = this.memoryService as any;
    const sessions = memory.memory?.projectHistory?.sessions || [];
    
    for (const session of sessions) {
      // Analyze patterns used in session
      for (const patternId of session.patternsUsed) {
        const pattern = this.learningPatterns.get(patternId);
        if (pattern) {
          pattern.frequency++;
          pattern.lastUsed = session.date;
        }
      }
    }

    this._logger.info(`📊 Analyzed ${sessions.length} project sessions`);
  }

  /**
   * Build pattern database
   */
  private async buildPatternDatabase(): Promise<void> {
    // Build pattern relationships
    const patterns = Array.from(this.learningPatterns.values());
    
    for (const pattern of patterns) {
      // Find similar patterns
      const similarPatterns = patterns.filter(p => 
        p.id !== pattern.id && 
        this.calculatePatternSimilarity(pattern, p) > 0.7
      );
      
      // Update confidence based on similar patterns
      if (similarPatterns.length > 0) {
        const avgSuccessRate = similarPatterns.reduce((sum, p) => sum + p.successRate, 0) / similarPatterns.length;
        pattern.confidence = (pattern.confidence + avgSuccessRate) / 2;
      }
    }

    this._logger.info(`🔗 Built pattern database with ${patterns.length} patterns`);
  }

  /**
   * Calculate pattern similarity
   */
  private calculatePatternSimilarity(pattern1: LearningPattern, pattern2: LearningPattern): number {
    // Simple similarity calculation based on pattern content and context
    const contentSimilarity = this.calculateStringSimilarity(pattern1.pattern, pattern2.pattern);
    const contextSimilarity = this.calculateStringSimilarity(pattern1.context, pattern2.context);
    
    return (contentSimilarity + contextSimilarity) / 2;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0]![j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1
          );
        }
      }
    }
    
    return matrix[str2.length]![str1.length]!;
  }

  /**
   * Generate contextual suggestions
   */
  generateContextualSuggestions(context: LearningContext): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    // Generate code generation suggestions
    const codeSuggestions = this.generateCodeSuggestions(context);
    suggestions.push(...codeSuggestions);
    
    // Generate refactoring suggestions
    const refactoringSuggestions = this.generateRefactoringSuggestions(context);
    suggestions.push(...refactoringSuggestions);
    
    // Generate optimization suggestions
    const optimizationSuggestions = this.generateOptimizationSuggestions(context);
    suggestions.push(...optimizationSuggestions);
    
    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);
    
    this._logger.info(`💡 Generated ${suggestions.length} contextual suggestions`);
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Generate code generation suggestions
   */
  private generateCodeSuggestions(context: LearningContext): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const relevantPatterns = this.getRelevantPatterns(context, 'code');
    
    // Detect naming style preferences from context
    if (context.codingPatterns && context.codingPatterns.length > 0) {
      const verboseNames = context.codingPatterns.filter(p => 
        p.includes('process') || p.includes('calculate') || p.includes('handle')
      );
      
      if (verboseNames.length >= 2) {
        this.detectStylePreference('uses_verbose_names', verboseNames, 0.8);
      }
    }
    
    for (const pattern of relevantPatterns) {
      if (pattern.confidence > 0.8) {
        suggestions.push({
          id: `code-${pattern.id}`,
          type: 'code-generation',
          content: pattern.pattern,
          confidence: pattern.confidence,
          reasoning: `Based on successful pattern usage (${pattern.frequency} times, ${(pattern.successRate * 100).toFixed(1)}% success rate)`,
          alternatives: this.getAlternativePatterns(pattern),
          context: context.currentFile
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Generate refactoring suggestions
   */
  private generateRefactoringSuggestions(context: LearningContext): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    // Analyze current code for refactoring opportunities
    const refactoringPatterns = this.getRelevantPatterns(context, 'code').filter(p => p.type === 'code');
    
    for (const pattern of refactoringPatterns) {
      if (pattern.successRate > 0.9) {
        suggestions.push({
          id: `refactor-${pattern.id}`,
          type: 'refactoring',
          content: `Refactor to use ${pattern.pattern} pattern`,
          confidence: pattern.successRate,
          reasoning: `This pattern has been successful ${(pattern.successRate * 100).toFixed(1)}% of the time`,
          alternatives: this.getAlternativePatterns(pattern),
          context: context.currentFile
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(context: LearningContext): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    // Analyze for optimization opportunities
    const optimizationPatterns = this.getRelevantPatterns(context, 'code').filter(p => p.frequency > 10);
    
    for (const pattern of optimizationPatterns) {
      if (pattern.confidence > 0.85) {
        suggestions.push({
          id: `optimize-${pattern.id}`,
          type: 'optimization',
          content: `Optimize using ${pattern.pattern} pattern`,
          confidence: pattern.confidence,
          reasoning: `This pattern has been used ${pattern.frequency} times with high success rate`,
          alternatives: this.getAlternativePatterns(pattern),
          context: context.currentFile
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Get relevant patterns for context
   */
  private getRelevantPatterns(_context: LearningContext, type: string): LearningPattern[] {
    const patterns = Array.from(this.learningPatterns.values())
      .filter(p => p.type === type)
      .sort((a, b) => b.confidence - a.confidence);
    
    return patterns.slice(0, 10); // Return top 10 relevant patterns
  }

  /**
   * Get alternative patterns
   */
  private getAlternativePatterns(pattern: LearningPattern): string[] {
    const alternatives = Array.from(this.learningPatterns.values())
      .filter(p => p.id !== pattern.id && p.type === pattern.type)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(p => p.pattern);
    
    return alternatives;
  }

  /**
   * Record a new learning pattern
   */
  recordPattern(pattern: LearningPattern): void {
    this.learningPatterns.set(pattern.id, pattern);
    
    this.logLearningEvent('pattern_recorded', {
      patternId: pattern.id,
      pattern: pattern.pattern,
      type: pattern.type,
      confidence: pattern.confidence,
      successRate: pattern.successRate
    });
    
    this._logger.info(`📚 Recorded pattern: ${pattern.id}`);
  }

  /**
   * Learn from user feedback
   */
  learnFromFeedback(suggestionId: string, accepted: boolean, feedback?: string): void {
    const patternId = suggestionId.replace(/^(code-|refactor-|optimize-)/, '');
    const pattern = this.learningPatterns.get(patternId);
    
    if (pattern) {
      const oldSuccessRate = pattern.successRate;
      const oldConfidence = pattern.confidence;
      
      if (accepted) {
        pattern.successRate = Math.min(1, pattern.successRate + 0.1);
        pattern.confidence = Math.min(1, pattern.confidence + 0.05);
      } else {
        pattern.successRate = Math.max(0, pattern.successRate - 0.1);
        pattern.confidence = Math.max(0, pattern.confidence - 0.05);
      }
      
      pattern.lastUsed = new Date().toISOString();
      
      // Log learning from feedback
      this.logLearningEvent('feedback_received', {
        suggestionId,
        patternId,
        accepted,
        feedback,
        oldSuccessRate,
        newSuccessRate: pattern.successRate,
        oldConfidence,
        newConfidence: pattern.confidence
      });
    }
    
    // Record in suggestion history
    if (!this.suggestionHistory.has(suggestionId)) {
      this.suggestionHistory.set(suggestionId, []);
    }
    
    this.suggestionHistory.get(suggestionId)!.push({
      accepted,
      feedback,
      timestamp: new Date().toISOString()
    });
    
    this._logger.info(`🧠 Learned from feedback: ${suggestionId} (accepted: ${accepted})`);
    this.emit('learning:feedback', { suggestionId, accepted, feedback });
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): any {
    const patterns = Array.from(this.learningPatterns.values());
    
    return {
      totalPatterns: patterns.length,
      averageConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length,
      averageSuccessRate: patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length,
      totalSuggestions: Array.from(this.suggestionHistory.values()).reduce((sum, history) => sum + history.length, 0),
      learningProgress: this.calculateLearningProgress()
    };
  }

  /**
   * Calculate learning progress
   */
  private calculateLearningProgress(): number {
    const patterns = Array.from(this.learningPatterns.values());
    if (patterns.length === 0) return 0;
    
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    const avgSuccessRate = patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length;
    
    return (avgConfidence + avgSuccessRate) / 2;
  }

  /**
   * Update pattern success rate based on usage feedback
   */
  updatePatternSuccess(pattern: LearningPattern, success: boolean): void {
    try {
      const currentPattern = this.learningPatterns.get(pattern.id);
      if (!currentPattern) {
        this._logger.warn(`Pattern not found: ${pattern.id}`);
        return;
      }

      const oldSuccessRate = currentPattern.successRate;

      // Update success rate using exponential moving average
      const alpha = 0.1; // Learning rate
      const newSuccessRate = success 
        ? currentPattern.successRate + alpha * (1 - currentPattern.successRate)
        : currentPattern.successRate + alpha * (0 - currentPattern.successRate);

      currentPattern.successRate = Math.max(0, Math.min(1, newSuccessRate));
      currentPattern.lastUsed = new Date().toISOString();

      this.learningPatterns.set(pattern.id, currentPattern);
      
      // Log pattern success update
      this.logLearningEvent('pattern_success_updated', {
        patternId: pattern.id,
        pattern: pattern.pattern,
        success,
        oldSuccessRate,
        newSuccessRate: currentPattern.successRate,
        learningRate: alpha
      });
      
      this._logger.info(`📈 Updated pattern success rate: ${pattern.id} -> ${currentPattern.successRate.toFixed(3)}`);
      this.emit('learning:patternUpdated', { patternId: pattern.id, successRate: currentPattern.successRate });
    } catch (error) {
      this._logger.error('Failed to update pattern success:', error);
      throw error;
    }
  }

  /**
   * Update pattern frequency when used
   */
  updatePatternFrequency(pattern: LearningPattern): void {
    try {
      // If pattern is not in our map, add it first
      if (!this.learningPatterns.has(pattern.id)) {
        this.learningPatterns.set(pattern.id, { ...pattern });
      }

      const currentPattern = this.learningPatterns.get(pattern.id)!;
      const oldFrequency = currentPattern.frequency;
      const oldConfidence = currentPattern.confidence;
      
      currentPattern.frequency += 1;
      currentPattern.lastUsed = new Date().toISOString();

      // Update confidence based on frequency and success rate
      const frequencyWeight = Math.min(currentPattern.frequency / 10, 1); // Cap at 10 uses
      currentPattern.confidence = (currentPattern.successRate * 0.7) + (frequencyWeight * 0.3);

      this.learningPatterns.set(pattern.id, currentPattern);
      
      // Update the original pattern object passed to the method
      pattern.frequency = currentPattern.frequency;
      pattern.confidence = currentPattern.confidence;
      pattern.lastUsed = currentPattern.lastUsed;
      
      // Log pattern usage
      this.logLearningEvent('pattern_used', {
        patternId: pattern.id,
        pattern: pattern.pattern,
        oldFrequency,
        newFrequency: currentPattern.frequency,
        oldConfidence,
        newConfidence: currentPattern.confidence,
        frequencyWeight
      });
      
      // Track as recent adaptation
      this.recentAdaptations.push({
        pattern: pattern.pattern,
        confidence: currentPattern.confidence,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 10 adaptations
      if (this.recentAdaptations.length > 10) {
        this.recentAdaptations.shift();
      }
      
      this._logger.info(`📊 Updated pattern frequency: ${pattern.id} -> ${currentPattern.frequency}`);
      this.emit('learning:patternUsed', { patternId: pattern.id, frequency: currentPattern.frequency });
    } catch (error) {
      this._logger.error('Failed to update pattern frequency:', error);
      throw error;
    }
  }


  /**
   * Export learning data
   */
  async exportLearningData(exportPath: string): Promise<void> {
    try {
      const learningData = {
        patterns: Array.from(this.learningPatterns.entries()),
        suggestionHistory: Array.from(this.suggestionHistory.entries()),
        stats: this.getLearningStats(),
        exportedAt: new Date().toISOString()
      };
      
      await fs.writeJson(exportPath, learningData, { spaces: 2 });
      
      this.logLearningEvent('learning_data_exported', {
        exportPath,
        patternsCount: this.learningPatterns.size,
        historyCount: this.suggestionHistory.size
      });
      
      this._logger.info(`📤 Learning data exported to: ${exportPath}`);
      this.emit('learning:exported', { exportPath });
    } catch (error) {
      this._logger.error('Failed to export learning data:', error);
      throw error;
    }
  }

  /**
   * Log learning events for visibility and debugging
   * This is GOLD for solo dev - you need to SEE what it's learning
   */
  private logLearningEvent(event: string, data: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      context: {
        currentStyle: this.currentCodingStyle,
        adaptations: this.recentAdaptations
      }
    };
    
    try {
      // Ensure logs directory exists
      const logsDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logsDir, 'learning-events.jsonl');
      
      // Write to JSONL file (one JSON object per line)
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
      
      // Also console for immediate feedback
      console.log('🧠 LEARNING:', event, JSON.stringify(data, null, 2));
    } catch (error) {
      // Don't fail if logging fails, just warn
      this._logger.warn(`Failed to log learning event: ${error}`);
    }
  }

  /**
   * Detect and log style preferences
   */
  detectStylePreference(pattern: string, examples: string[], confidence: number = 0.8): void {
    this.logLearningEvent('style_preference_detected', {
      pattern,
      confidence,
      examples,
      currentStyle: this.currentCodingStyle
    });
    
    // Update current coding style if confidence is high
    if (confidence > 0.7) {
      this.currentCodingStyle = pattern;
    }
  }
}
