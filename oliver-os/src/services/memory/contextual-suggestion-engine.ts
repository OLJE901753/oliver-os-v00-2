/**
 * Contextual Suggestion Engine
 * Provides intelligent suggestions based on project history and patterns
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import { MemoryService } from './memory-service';
import { LearningService } from './learning-service';
import fs from 'fs-extra';

export interface ContextualSuggestion {
  id: string;
  type: 'code-generation' | 'refactoring' | 'optimization' | 'architecture' | 'naming' | 'workflow';
  title: string;
  description: string;
  content: string;
  confidence: number;
  reasoning: string;
  alternatives: string[];
  context: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export interface SuggestionContext {
  currentFile: string;
  fileType: string;
  projectStructure: string[];
  recentChanges: string[];
  userPreferences: any;
  codingPatterns: string[];
  architectureDecisions: string[];
  namingConventions: any;
}

export class ContextualSuggestionEngine extends EventEmitter {
  private _logger: Logger;
  private _memoryService: MemoryService;
  private _learningService: LearningService;
  private suggestionCache: Map<string, ContextualSuggestion[]>;
  private contextHistory: Map<string, SuggestionContext>;

  constructor(_config: Config, memoryService: MemoryService, learningService: LearningService) {
    super();
    this._memoryService = memoryService;
    this._learningService = learningService;
    this._logger = new Logger('ContextualSuggestionEngine');
    this.suggestionCache = new Map();
    this.contextHistory = new Map();
  }

  /**
   * Initialize suggestion engine
   */
  async initialize(): Promise<void> {
    this._logger.info('💡 Initializing Contextual Suggestion Engine...');
    
    try {
      await this.loadContextHistory();
      await this.buildSuggestionCache();
      
      this._logger.info('✅ Contextual Suggestion Engine initialized successfully');
      this.emit('suggestion-engine:initialized');
    } catch (error) {
      this._logger.error('Failed to initialize suggestion engine:', error);
      throw error;
    }
  }

  /**
   * Load context history from memory
   */
  private async loadContextHistory(): Promise<void> {
    const memory = this._memoryService as any;
    const sessions = memory.memory?.projectHistory?.sessions || [];
    
    for (const session of sessions) {
      const context: SuggestionContext = {
        currentFile: session.filesModified?.[0] || 'unknown',
        fileType: this.getFileType(session.filesModified?.[0] || ''),
        projectStructure: session.patternsUsed || [],
        recentChanges: session.patternsUsed || [],
        userPreferences: memory.memory?.codePatterns?.userPreferences || {},
        codingPatterns: session.patternsUsed || [],
        architectureDecisions: session.decisionsMade || [],
        namingConventions: memory.memory?.namingConventions || {}
      };
      
      this.contextHistory.set(session.id, context);
    }

    this._logger.info(`📚 Loaded ${sessions.length} context history entries`);
  }

  /**
   * Build suggestion cache
   */
  private async buildSuggestionCache(): Promise<void> {
    // Build cache based on common contexts
    const commonContexts = this.getCommonContexts();
    
    for (const context of commonContexts) {
      const suggestions = await this.generateSuggestionsForContext(context);
      this.suggestionCache.set(context.currentFile, suggestions);
    }

    this._logger.info(`🗂️ Built suggestion cache with ${commonContexts.length} contexts`);
  }

  /**
   * Get common contexts
   */
  private getCommonContexts(): SuggestionContext[] {
    const contexts: SuggestionContext[] = [];
    const memory = this._memoryService as any;
    
    // Common file types
    const commonFileTypes = ['tsx', 'ts', 'js', 'jsx', 'py'];
    
    for (const fileType of commonFileTypes) {
      contexts.push({
        currentFile: `example.${fileType}`,
        fileType,
        projectStructure: ['src', 'components', 'services'],
        recentChanges: [],
        userPreferences: memory.memory?.codePatterns?.userPreferences || {},
        codingPatterns: [],
        architectureDecisions: memory.memory?.architecture?.decisions?.map((d: any) => d.id) || [],
        namingConventions: memory.memory?.namingConventions || {}
      });
    }
    
    return contexts;
  }

  /**
   * Generate suggestions for current context
   */
  async generateSuggestionsForContext(context: SuggestionContext): Promise<ContextualSuggestion[]> {
    const suggestions: ContextualSuggestion[] = [];
    
    // Check cache first
    const cacheKey = context.currentFile;
    if (this.suggestionCache.has(cacheKey)) {
      const cachedSuggestions = this.suggestionCache.get(cacheKey)!;
      this._logger.info(`📋 Using cached suggestions for ${cacheKey}`);
      return cachedSuggestions;
    }
    
    // Generate code generation suggestions
    const codeSuggestions = await this.generateCodeGenerationSuggestions(context);
    suggestions.push(...codeSuggestions);
    
    // Generate refactoring suggestions
    const refactoringSuggestions = await this.generateRefactoringSuggestions(context);
    suggestions.push(...refactoringSuggestions);
    
    // Generate optimization suggestions
    const optimizationSuggestions = await this.generateOptimizationSuggestions(context);
    suggestions.push(...optimizationSuggestions);
    
    // Generate architecture suggestions
    const architectureSuggestions = await this.generateArchitectureSuggestions(context);
    suggestions.push(...architectureSuggestions);
    
    // Generate naming suggestions
    const namingSuggestions = await this.generateNamingSuggestions(context);
    suggestions.push(...namingSuggestions);
    
    // Sort by confidence and impact
    suggestions.sort((a, b) => {
      const scoreA = a.confidence * this.getImpactScore(a.impact);
      const scoreB = b.confidence * this.getImpactScore(b.impact);
      return scoreB - scoreA;
    });
    
    // Cache suggestions
    this.suggestionCache.set(cacheKey, suggestions);
    
    this._logger.info(`💡 Generated ${suggestions.length} suggestions for context`);
    return suggestions.slice(0, 10); // Return top 10 suggestions
  }

  /**
   * Generate code generation suggestions
   */
  private async generateCodeGenerationSuggestions(context: SuggestionContext): Promise<ContextualSuggestion[]> {
    const suggestions: ContextualSuggestion[] = [];
    const memory = this._memoryService as any;
    const patterns = memory.memory?.codePatterns?.frequentlyUsed || [];
    
    for (const pattern of patterns) {
      if (pattern.successRate > 0.8 && this.isRelevantForFileType(pattern, context.fileType)) {
        suggestions.push({
          id: `code-gen-${pattern.id}`,
          type: 'code-generation',
          title: `Generate ${pattern.pattern} pattern`,
          description: `Use the ${pattern.pattern} pattern which has been successful ${(pattern.successRate * 100).toFixed(1)}% of the time`,
          content: pattern.example,
          confidence: pattern.successRate,
          reasoning: `This pattern has been used ${pattern.frequency} times with ${(pattern.successRate * 100).toFixed(1)}% success rate`,
          alternatives: this.getAlternativePatterns(pattern),
          context: context.currentFile,
          impact: this.getPatternImpact(pattern),
          effort: this.getPatternEffort(pattern)
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Generate refactoring suggestions
   */
  private async generateRefactoringSuggestions(context: SuggestionContext): Promise<ContextualSuggestion[]> {
    const suggestions: ContextualSuggestion[] = [];
    const memory = this._memoryService as any;
    const patterns = memory.memory?.codePatterns?.frequentlyUsed || [];
    
    for (const pattern of patterns) {
      if (pattern.successRate > 0.9 && pattern.frequency > 5) {
        suggestions.push({
          id: `refactor-${pattern.id}`,
          type: 'refactoring',
          title: `Refactor to ${pattern.pattern} pattern`,
          description: `Refactor existing code to use the ${pattern.pattern} pattern for better maintainability`,
          content: pattern.example,
          confidence: pattern.successRate,
          reasoning: `This pattern has been successful ${(pattern.successRate * 100).toFixed(1)}% of the time and used ${pattern.frequency} times`,
          alternatives: this.getAlternativePatterns(pattern),
          context: context.currentFile,
          impact: 'medium',
          effort: 'medium'
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizationSuggestions(context: SuggestionContext): Promise<ContextualSuggestion[]> {
    const suggestions: ContextualSuggestion[] = [];
    const memory = this._memoryService as any;
    const patterns = memory.memory?.codePatterns?.frequentlyUsed || [];
    
    for (const pattern of patterns) {
      if (pattern.frequency > 10 && pattern.successRate > 0.85) {
        suggestions.push({
          id: `optimize-${pattern.id}`,
          type: 'optimization',
          title: `Optimize with ${pattern.pattern} pattern`,
          description: `Optimize code using the ${pattern.pattern} pattern for better performance`,
          content: pattern.example,
          confidence: pattern.successRate,
          reasoning: `This pattern has been used ${pattern.frequency} times with high success rate`,
          alternatives: this.getAlternativePatterns(pattern),
          context: context.currentFile,
          impact: 'high',
          effort: 'low'
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Generate architecture suggestions
   */
  private async generateArchitectureSuggestions(context: SuggestionContext): Promise<ContextualSuggestion[]> {
    const suggestions: ContextualSuggestion[] = [];
    const memory = this._memoryService as any;
    const decisions = memory.memory?.architecture?.decisions || [];
    
    for (const decision of decisions) {
      if (decision.impact === 'high') {
        suggestions.push({
          id: `arch-${decision.id}`,
          type: 'architecture',
          title: `Apply ${decision.decision} architecture decision`,
          description: decision.rationale,
          content: decision.decision,
          confidence: 0.9,
          reasoning: `This architecture decision has high impact and was made on ${decision.date}`,
          alternatives: this.getAlternativeArchitectureDecisions(decision),
          context: context.currentFile,
          impact: 'high',
          effort: 'high'
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Generate naming suggestions
   */
  private async generateNamingSuggestions(context: SuggestionContext): Promise<ContextualSuggestion[]> {
    const suggestions: ContextualSuggestion[] = [];
    const namingConventions = context.namingConventions;
    
    // Check if namingConventions exists and is an object
    if (!namingConventions || typeof namingConventions !== 'object') {
      this._logger.warn('No naming conventions found in context, using defaults');
      return this.generateDefaultNamingSuggestions(context);
    }
    
    try {
      for (const [type, conventions] of Object.entries(namingConventions)) {
        if (typeof conventions === 'object' && conventions !== null) {
          for (const [name, convention] of Object.entries(conventions)) {
            suggestions.push({
              id: `naming-${type}-${name}`,
              type: 'naming',
              title: `Use ${convention} naming convention for ${type}`,
              description: `Apply the ${convention} naming convention for ${type} variables/functions`,
              content: convention,
              confidence: 0.8,
              reasoning: `This naming convention has been used consistently for ${type}`,
              alternatives: this.getAlternativeNamingConventions(type),
              context: context.currentFile,
              impact: 'low',
              effort: 'low'
            });
          }
        }
      }
    } catch (error) {
      this._logger.error('Error generating naming suggestions:', error);
      return this.generateDefaultNamingSuggestions(context);
    }
    
    return suggestions;
  }

  /**
   * Generate default naming suggestions when no conventions are available
   */
  private generateDefaultNamingSuggestions(context: SuggestionContext): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = [];
    
    const defaultConventions = {
      variables: 'camelCase',
      functions: 'camelCase',
      classes: 'PascalCase',
      constants: 'UPPER_SNAKE_CASE',
      interfaces: 'PascalCase',
      types: 'PascalCase',
      enums: 'PascalCase',
      files: 'kebab-case'
    };
    
    for (const [type, convention] of Object.entries(defaultConventions)) {
      suggestions.push({
        id: `naming-default-${type}`,
        type: 'naming',
        title: `Use ${convention} naming convention for ${type}`,
        description: `Apply the standard ${convention} naming convention for ${type}`,
        content: convention,
        confidence: 0.7,
        reasoning: `This is the standard naming convention for ${type} in TypeScript/JavaScript`,
        alternatives: this.getAlternativeNamingConventions(type),
        context: context.currentFile,
        impact: 'low',
        effort: 'low'
      });
    }
    
    return suggestions;
  }

  /**
   * Check if pattern is relevant for file type
   */
  private isRelevantForFileType(pattern: any, fileType: string): boolean {
    const relevantPatterns = {
      'tsx': ['react-component', 'typescript-interface', 'event-handler'],
      'ts': ['service-class', 'error-handling', 'async-function'],
      'js': ['function', 'module', 'callback'],
      'jsx': ['react-component', 'jsx-element', 'props'],
      'py': ['class', 'function', 'async-function']
    };
    
    return relevantPatterns[fileType as keyof typeof relevantPatterns]?.some(p => 
      pattern.pattern.toLowerCase().includes(p)
    ) || false;
  }

  /**
   * Get alternative patterns
   */
  private getAlternativePatterns(pattern: any): string[] {
    const memory = this._memoryService as any;
    const patterns = memory.memory?.codePatterns?.frequentlyUsed || [];
    
    return patterns
      .filter((p: any) => p.id !== pattern.id && p.successRate > 0.7)
      .slice(0, 3)
      .map((p: any) => p.pattern);
  }

  /**
   * Get alternative architecture decisions
   */
  private getAlternativeArchitectureDecisions(decision: any): string[] {
    const memory = this._memoryService as any;
    const decisions = memory.memory?.architecture?.decisions || [];
    
    return decisions
      .filter((d: any) => d.id !== decision.id && d.impact === 'high')
      .slice(0, 3)
      .map((d: any) => d.decision);
  }

  /**
   * Get alternative naming conventions
   */
  private getAlternativeNamingConventions(type: string): string[] {
    const alternatives = {
      'variables': ['camelCase', 'snake_case', 'PascalCase'],
      'functions': ['camelCase', 'snake_case', 'PascalCase'],
      'components': ['PascalCase', 'camelCase', 'kebab-case'],
      'files': ['kebab-case', 'camelCase', 'snake_case'],
      'constants': ['UPPER_SNAKE_CASE', 'PascalCase', 'camelCase']
    };
    
    return alternatives[type as keyof typeof alternatives] || [];
  }

  /**
   * Get impact score
   */
  private getImpactScore(impact: string): number {
    const scores = { low: 1, medium: 2, high: 3 };
    return scores[impact as keyof typeof scores] || 1;
  }

  /**
   * Get pattern impact
   */
  private getPatternImpact(pattern: any): 'low' | 'medium' | 'high' {
    if (pattern.frequency > 15) return 'high';
    if (pattern.frequency > 8) return 'medium';
    return 'low';
  }

  /**
   * Get pattern effort
   */
  private getPatternEffort(pattern: any): 'low' | 'medium' | 'high' {
    if (pattern.successRate > 0.9) return 'low';
    if (pattern.successRate > 0.8) return 'medium';
    return 'high';
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): string {
    const parts = filename.split('.');
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Generate suggestions for a specific file
   */
  async generateSuggestions(filePath: string): Promise<ContextualSuggestion[]> {
    const context: SuggestionContext = {
      currentFile: filePath,
      fileType: this.getFileType(filePath),
      projectStructure: [],
      recentChanges: [],
      userPreferences: {},
      codingPatterns: [],
      architectureDecisions: [],
      namingConventions: {}
    };
    
    return await this.generateSuggestionsForContext(context);
  }

  /**
   * Record suggestion feedback
   */
  recordSuggestionFeedback(suggestionId: string, accepted: boolean, feedback?: string): void {
    this._learningService.learnFromFeedback(suggestionId, accepted, feedback);
    
    this._logger.info(`📝 Recorded suggestion feedback: ${suggestionId} (accepted: ${accepted})`);
    this.emit('suggestion:feedback', { suggestionId, accepted, feedback });
  }

  /**
   * Get suggestion statistics
   */
  getSuggestionStats(): any {
    return {
      totalSuggestions: Array.from(this.suggestionCache.values()).reduce((sum, suggestions) => sum + suggestions.length, 0),
      cachedContexts: this.suggestionCache.size,
      contextHistorySize: this.contextHistory.size,
      learningStats: this._learningService.getLearningStats()
    };
  }

  /**
   * Analyze code quality and return detailed scores
   */
  analyzeCodeQuality(code: string): { overall: number; security: number; performance: number; maintainability: number; readability: number } {
    try {
      if (!code || typeof code !== 'string') {
        return { overall: 0, security: 0, performance: 0, maintainability: 0, readability: 0 };
      }

      let securityScore = 1.0;
      let performanceScore = 1.0;
      let maintainabilityScore = 1.0;
      let readabilityScore = 1.0;
      const issues: string[] = [];

      // Security analysis
      if (code && code.includes('eval(') || code.includes('innerHTML') || code.includes('document.write')) {
        securityScore -= 0.5;
        issues.push('Security vulnerability detected');
      }
      if (code && code.includes('password') && !code.includes('hash') && !code.includes('encrypt')) {
        securityScore -= 0.2;
        issues.push('Potential password handling issue');
      }

      // Performance analysis
      if (code && code.includes('for (let i = 0; i <') || 
          code.includes('while (true)') ||
          code.includes('setInterval') ||
          code.includes('setTimeout')) {
        performanceScore -= 0.3;
        issues.push('Potential performance issue');
      }
      // Detect nested loops (O(n²) complexity)
      const forLoopCount = (code.match(/for\s*\(/g) || []).length;
      if (forLoopCount > 1) {
        performanceScore -= 0.4;
        issues.push('Nested loops detected (O(n²) complexity)');
      }
      // Prefer async/await over .then() chains
      if (code && code.includes('.then(') && !code.includes('async') && !code.includes('await')) {
        performanceScore -= 0.2;
        issues.push('Using .then() chains instead of async/await');
      }
      // Prefer functional methods over imperative loops
      if (code && code.includes('for (') && !code.includes('.map(') && !code.includes('.filter(') && !code.includes('.reduce(')) {
        performanceScore -= 0.1;
        issues.push('Consider using functional methods instead of imperative loops');
      }

      // Maintainability analysis
      const lines = code.split('\n').length;
      if (lines > 100) {
        maintainabilityScore -= 0.2;
        issues.push('High complexity (long file)');
      }
      const hasTryCatch = code.includes('try {') && code.includes('} catch');
      const hasAsyncAwait = code.includes('async') && code.includes('await');
      if (hasAsyncAwait && !hasTryCatch) {
        maintainabilityScore -= 0.3;
        issues.push('Missing error handling for async operations');
      }
      // Check for missing type annotations in function parameters
      if (code && code.includes('function ') && !code.includes(': string') && !code.includes(': number') && !code.includes(': boolean')) {
        maintainabilityScore -= 0.2;
        issues.push('Missing type annotations');
      }
      // Check for proper error handling in async operations
      if (code && code.includes('fetch(') && !hasTryCatch) {
        maintainabilityScore -= 0.3;
        issues.push('Missing error handling for fetch operations');
      }

      // Readability analysis
      const hasComments = code.includes('//') || code.includes('/*') || code.includes('*');
      if (!hasComments && lines > 20) {
        readabilityScore -= 0.2;
        issues.push('Missing documentation');
      }
      const hasBadNaming = code.includes('var ') || code.includes('function ') || 
                          /[a-z][A-Z]/.test(code) || code.includes('_');
      if (hasBadNaming) {
        readabilityScore -= 0.1;
        issues.push('Naming convention issues');
      }
      if (code && code.includes('any') && !code.includes('// @ts-ignore')) {
        readabilityScore -= 0.1;
        issues.push('Type safety issue (use of any)');
      }

      // Ensure scores are between 0 and 1
      securityScore = Math.max(0, Math.min(1, securityScore));
      performanceScore = Math.max(0, Math.min(1, performanceScore));
      maintainabilityScore = Math.max(0, Math.min(1, maintainabilityScore));
      readabilityScore = Math.max(0, Math.min(1, readabilityScore));

      // Calculate overall score
      const overallScore = (securityScore + performanceScore + maintainabilityScore + readabilityScore) / 4;
      
      this._logger.info(`🔍 Code quality analysis: overall=${overallScore.toFixed(3)}, security=${securityScore.toFixed(3)}, performance=${performanceScore.toFixed(3)} (${issues.length} issues)`);
      this.emit('code-quality:analyzed', { overall: overallScore, security: securityScore, performance: performanceScore, maintainability: maintainabilityScore, readability: readabilityScore, issues });
      
      return {
        overall: overallScore,
        security: securityScore,
        performance: performanceScore,
        maintainability: maintainabilityScore,
        readability: readabilityScore
      };
    } catch (error) {
      this._logger.error('Failed to analyze code quality:', error);
      return { overall: 0, security: 0, performance: 0, maintainability: 0, readability: 0 };
    }
  }

  /**
   * Clear suggestion cache
   */
  clearSuggestionCache(): void {
    this.suggestionCache.clear();
    this._logger.info('🗑️ Suggestion cache cleared');
    this.emit('suggestion-cache:cleared');
  }

  /**
   * Export suggestion data
   */
  async exportSuggestionData(exportPath: string): Promise<void> {
    try {
      const suggestionData = {
        cache: Array.from(this.suggestionCache.entries()),
        contextHistory: Array.from(this.contextHistory.entries()),
        stats: this.getSuggestionStats(),
        exportedAt: new Date().toISOString()
      };
      
      await fs.writeJson(exportPath, suggestionData, { spaces: 2 });
      this._logger.info(`📤 Suggestion data exported to: ${exportPath}`);
      this.emit('suggestion-data:exported', { exportPath });
    } catch (error) {
      this._logger.error('Failed to export suggestion data:', error);
      throw error;
    }
  }

  /**
   * Get current context information
   */
  getContext(): any {
    return {
      files: Array.from(this.contextHistory.keys()),
      relationships: this.buildFileRelationships(),
      patterns: this.getActivePatterns(),
      preferences: this._memoryService.getMemory().codePatterns.userPreferences
    };
  }

  /**
   * Build file relationships
   */
  private buildFileRelationships(): any[] {
    const relationships = [];
    const files = Array.from(this.contextHistory.keys());
    
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        relationships.push({
          source: files[i],
          target: files[j],
          type: 'dependency',
          strength: Math.random() * 0.8 + 0.2 // Simulate relationship strength
        });
      }
    }
    
    return relationships;
  }

  /**
   * Get active patterns
   */
  private getActivePatterns(): any[] {
    const memory = this._memoryService.getMemory();
    return memory.codePatterns.frequentlyUsed.slice(0, 5); // Return top 5 patterns
  }
}
