/**
 * Self-Review Service
 * AI-powered code review for solo development
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import { MemoryService } from '../memory/memory-service';
import { LearningService } from '../memory/learning-service';
import fs from 'fs-extra';
import path from 'path';
import { simpleGit } from 'simple-git';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { UserPreferences, MemoryServiceAccessor } from '../../types/common-types';
import type { ArchitectureDecision } from '../memory/memory-service';

// Code analysis result interfaces
interface CodeAnalysisResult {
  line?: number;
  code: string;
  [key: string]: unknown;
}

interface FunctionAnalysis extends CodeAnalysisResult {
  name: string;
  length: number;
}

const execAsync = promisify(exec);

export interface CodeReviewResult {
  id: string;
  filePath: string;
  score: number;
  suggestions: ReviewSuggestion[];
  summary: string;
  timestamp: string;
  confidence: number;
}

export interface ReviewSuggestion {
  id: string;
  type: 'readability' | 'performance' | 'security' | 'best-practices' | 'architecture';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  currentCode: string;
  suggestedCode: string;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export interface ReviewContext {
  filePath: string;
  fileType: string;
  changes: string[];
  gitDiff: string;
  projectStructure: string[];
  recentChanges: string[];
  userPreferences: UserPreferences;
  codingPatterns: string[];
  architectureDecisions: string[];
}

export interface QualityMetrics {
  readability: number;
  maintainability: number;
  performance: number;
  security: number;
  testability: number;
  overall: number;
}

export class SelfReviewService extends EventEmitter {
  private _logger: Logger;
  private _memoryService: MemoryService;
  private reviewCache: Map<string, CodeReviewResult>;
  private qualityThresholds: Record<string, { min: number; target: number }>;

  constructor(_config: Config, memoryService: MemoryService, _learningService: LearningService) {
    super();
    this._memoryService = memoryService;
    this._logger = new Logger('SelfReviewService');
    this.reviewCache = new Map();
    this.qualityThresholds = this.getDefaultQualityThresholds();
  }

  /**
   * Initialize self-review service
   */
  async initialize(): Promise<void> {
    this._logger.info('🔍 Initializing Self-Review Service...');
    
    try {
      await this.loadReviewConfiguration();
      await this.loadQualityThresholds();
      
      this._logger.info('✅ Self-Review Service initialized successfully');
      this.emit('self-review:initialized');
    } catch (error) {
      this._logger.error('Failed to initialize self-review service:', error);
      throw error;
    }
  }

  /**
   * Load review configuration
   */
  private async loadReviewConfiguration(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'review-config.json');
      const config = await fs.readJson(configPath);
      this.qualityThresholds = config.qualityThresholds;
      this._logger.info('📋 Review configuration loaded');
    } catch (error) {
      this._logger.warn('Review configuration not found, using defaults');
      this.qualityThresholds = this.getDefaultQualityThresholds();
    }
  }

  /**
   * Get default quality thresholds
   */
  private getDefaultQualityThresholds(): Record<string, { min: number; target: number }> {
    return {
      readability: { min: 0.7, target: 0.9 },
      maintainability: { min: 0.6, target: 0.8 },
      performance: { min: 0.7, target: 0.9 },
      security: { min: 0.8, target: 0.95 },
      testability: { min: 0.6, target: 0.8 },
      overall: { min: 0.7, target: 0.85 }
    };
  }

  /**
   * Load quality thresholds
   */
  private loadQualityThresholds(): void {
    // Load from configuration or use defaults
    if (!this.qualityThresholds) {
      this.qualityThresholds = this.getDefaultQualityThresholds();
    }
  }

  /**
   * Perform self-review on a file
   * Enhanced with git context for better suggestions
   */
  async reviewFile(filePath: string, context?: ReviewContext): Promise<CodeReviewResult> {
    this._logger.info(`🔍 Performing self-review on: ${filePath}`);
    
    try {
      // Check cache first
      const cacheKey = `${filePath}-${await this.getFileHash(filePath)}`;
      if (this.reviewCache.has(cacheKey)) {
        this._logger.info(`📋 Using cached review for ${filePath}`);
        return this.reviewCache.get(cacheKey)!;
      }

      // Read file content
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const fileType = path.extname(filePath).slice(1);
      
      // Get enhanced git context for better suggestions
      const gitContext = await this.getEnhancedGitContext(filePath);
      this._logger.info(`📊 Git context: ${gitContext.isNewFile ? 'New file' : gitContext.isModified ? 'Modified' : 'Clean'}`);
      
      // Create review context if not provided
      const reviewContext = context || await this.createReviewContext(filePath, fileContent, fileType);
      
      // Enhance context with git information
      reviewContext.changes = gitContext.changes;
      reviewContext.gitDiff = gitContext.diff;
      reviewContext.recentChanges = gitContext.recentCommits;
      
      // Perform review analysis
      const suggestions = await this.analyzeCode(fileContent, fileType, reviewContext);
      const metrics = await this.calculateQualityMetrics(fileContent, fileType, suggestions);
      const score = this.calculateOverallScore(metrics);
      
      // Create review result
      const reviewResult: CodeReviewResult = {
        id: this.generateReviewId(),
        filePath,
        score,
        suggestions,
        summary: this.generateReviewSummary(suggestions, metrics),
        timestamp: new Date().toISOString(),
        confidence: this.calculateConfidence(suggestions, metrics)
      };

      // Cache result
      this.reviewCache.set(cacheKey, reviewResult);
      
      // Record review in memory
      await this.recordReviewInMemory(reviewResult);
      
      this._logger.info(`✅ Self-review completed for ${filePath} (score: ${score.toFixed(2)})`);
      this.emit('review:completed', { filePath, score, suggestions: suggestions.length });
      
      return reviewResult;
    } catch (error) {
      this._logger.error(`Failed to review file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Create review context
   */
  private async createReviewContext(filePath: string, _fileContent: string, fileType: string): Promise<ReviewContext> {
    const memory = this._memoryService as unknown as MemoryServiceAccessor;
    
    try {
      // Get git diff (hybrid approach)
      const gitDiff = await this.getGitDiff(filePath);
      
      // Get recent changes (hybrid approach) - pass filePath for file-specific history
      const recentChanges = await this.getRecentChanges(filePath);
      
      // Get git statistics (execAsync for complex operations)
      const gitStats = await this.getGitStats();
      
      // Parse changes from diff
      const changes = this.parseChangesFromDiff(gitDiff);
      
      // Log git stats for debugging
      if (gitStats.filesChanged > 0) {
        this._logger.info(`Git stats: ${gitStats.filesChanged} files, +${gitStats.insertions}/-${gitStats.deletions} lines`);
      }
      
      return {
        filePath,
        fileType,
        changes,
        gitDiff,
        projectStructure: ['src', 'services', 'components'],
        recentChanges,
        userPreferences: (memory.memory?.codePatterns?.userPreferences as UserPreferences) || { preferredImports: [], preferredNaming: {}, preferredPatterns: [] },
        codingPatterns: [], // TODO: Get from memory
        architectureDecisions: memory.memory?.architecture?.decisions?.map((d: ArchitectureDecision) => d.id) || []
      };
    } catch (error) {
      this._logger.warn(`Failed to get git context for ${filePath}:`, { error: error instanceof Error ? error.message : String(error) });
      // Return context without git data if git fails
      return {
        filePath,
        fileType,
        changes: [],
        gitDiff: '',
        projectStructure: ['src', 'services', 'components'],
        recentChanges: [],
        userPreferences: (memory.memory?.codePatterns?.userPreferences as UserPreferences) || { preferredImports: [], preferredNaming: {}, preferredPatterns: [] },
        codingPatterns: [],
        architectureDecisions: memory.memory?.architecture?.decisions?.map((d: ArchitectureDecision) => d.id) || []
      };
    }
  }

  /**
   * Get git diff for a file
   * Hybrid: simple-git for basic diff, execAsync for advanced options
   * Enhanced with better context and logging
   */
  private async getGitDiff(filePath: string): Promise<string> {
    try {
      this._logger.info(`📋 Getting git diff for: ${filePath}`);
      
      // Use simple-git for basic, safe operations
      const git = simpleGit();
      
      // First, try to get diff for the specific file
      let diff = await git.diff(['HEAD', '--', filePath]);
      
      // If no diff against HEAD, try unstaged changes
      if (!diff || diff.trim().length === 0) {
        this._logger.debug('No staged diff found, checking unstaged changes...');
        diff = await git.diff(['--', filePath]);
      }
      
      // If still no diff, try all changes (for new files)
      if (!diff || diff.trim().length === 0) {
        this._logger.debug('Checking for uncommitted changes...');
        const status = await git.status();
        if (status.files.length > 0) {
          diff = await git.diff();
        }
      }
      
      // Log success
      if (diff && diff.trim().length > 0) {
        const lines = diff.split('\n').filter(line => line.startsWith('+') || line.startsWith('-')).length;
        this._logger.info(`✅ Git diff retrieved: ${lines} lines changed`);
      } else {
        this._logger.debug('No git diff found (file may be clean or not tracked)');
      }
      
      return diff || '';
    } catch (error) {
      this._logger.warn(`Failed to get git diff with simple-git, trying execAsync for ${filePath}:`, { error: error instanceof Error ? error.message : String(error) });
      
      // Fallback to execAsync for advanced operations
      try {
        const { stdout } = await execAsync(`git diff -- ${filePath}`);
        return stdout;
      } catch (execError) {
        this._logger.warn(`Failed to get git diff with execAsync for ${filePath}:`, { error: execError instanceof Error ? execError.message : String(execError) });
        return '';
      }
    }
  }

  /**
   * Get recent git changes
   * Hybrid: simple-git for structured data, execAsync for formatting
   * Enhanced with file-specific history
   */
  private async getRecentChanges(filePath?: string): Promise<string[]> {
    try {
      // Use simple-git for structured commit data
      const git = simpleGit();
      
      let log;
      if (filePath) {
        // Get history for specific file
        this._logger.info(`📋 Getting recent changes for: ${filePath}`);
        log = await git.log({ file: filePath, maxCount: 10 });
      } else {
        // Get general project history
        this._logger.debug('Getting recent project changes...');
        log = await git.log({ maxCount: 10 });
      }
      
      const changes = log.all.map(commit => {
        const shortHash = commit.hash.substring(0, 7);
        const date = new Date(commit.date).toLocaleDateString();
        return `${shortHash} - ${commit.message.trim()} (${date})`;
      });
      
      if (changes.length > 0) {
        this._logger.info(`✅ Retrieved ${changes.length} recent changes`);
      } else {
        this._logger.debug('No recent changes found');
      }
      
      return changes;
    } catch (error) {
      this._logger.warn('Failed to get recent changes with simple-git, trying execAsync:', { error: error instanceof Error ? error.message : String(error) });
      
      // Fallback to execAsync for custom formatting
      try {
        const { stdout } = await execAsync('git log --oneline -10');
        return stdout.split('\n').filter(line => line.trim());
      } catch (execError) {
        this._logger.warn('Failed to get recent changes with execAsync:', { error: execError instanceof Error ? execError.message : String(execError) });
        return [];
      }
    }
  }

  /**
   * Get detailed git statistics
   * Uses execAsync for complex operations
   */
  private async getGitStats(): Promise<{ filesChanged: number; insertions: number; deletions: number }> {
    try {
      // Use execAsync for complex git commands
      const { stdout: shortStat } = await execAsync('git diff --shortstat');
      const stats = this.parseGitStat(shortStat);
      return stats;
    } catch (error) {
      this._logger.warn('Failed to get git stats:', { error: error instanceof Error ? error.message : String(error) });
      return { filesChanged: 0, insertions: 0, deletions: 0 };
    }
  }

  /**
   * Parse git stat output
   */
  private parseGitStat(stat: string): { filesChanged: number; insertions: number; deletions: number } {
    const filesMatch = stat.match(/(\d+)\s+files? changed/);
    const insertionsMatch = stat.match(/(\d+)\s+insertions?/);
    const deletionsMatch = stat.match(/(\d+)\s+deletions?/);

    return {
      filesChanged: filesMatch ? parseInt(filesMatch[1] || '0', 10) : 0,
      insertions: insertionsMatch ? parseInt(insertionsMatch[1] || '0', 10) : 0,
      deletions: deletionsMatch ? parseInt(deletionsMatch[1] || '0', 10) : 0
    };
  }

  /**
   * Parse changes from git diff
   * Enhanced to extract meaningful changes for context
   */
  private parseChangesFromDiff(diff: string): string[] {
    if (!diff) return [];
    
    const changes: string[] = [];
    const lines = diff.split('\n');
    
    for (const line of lines) {
      // Include added lines (code changes)
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const content = line.substring(1).trim();
        // Filter out empty lines and metadata
        if (content && !content.startsWith('@@') && content.length > 3) {
          changes.push(content);
        }
      }
    }
    
    // Limit to most relevant changes (keep first 50 lines)
    return changes.slice(0, 50);
  }

  /**
   * Get enhanced git context for code analysis
   * Provides detailed git information to improve suggestions
   */
  private async getEnhancedGitContext(filePath: string): Promise<{
    diff: string;
    changes: string[];
    recentCommits: string[];
    stats: { filesChanged: number; insertions: number; deletions: number };
    isNewFile: boolean;
    isModified: boolean;
  }> {
    try {
      // Get git diff
      const diff = await this.getGitDiff(filePath);
      const changes = this.parseChangesFromDiff(diff);
      
      // Get recent commits
      const recentCommits = await this.getRecentChanges(filePath);
      
      // Get statistics
      const stats = await this.getGitStats();
      
      // Check file status safely
      let isNewFile = false;
      let isModified = false;
      
      try {
        const git = simpleGit();
        const status = await git.status();
        
        // Safely check if file is tracked
        if (status.tracked && Array.isArray(status.tracked)) {
          isNewFile = !status.tracked.includes(filePath);
        }
        
        // Safely check if file is modified
        if (status.files && Array.isArray(status.files)) {
          isModified = status.files.some((f: { path?: string }) => f?.path === filePath);
        }
      } catch (statusError) {
        this._logger.debug('Could not get file status:', { error: statusError instanceof Error ? statusError.message : String(statusError) });
      }
      
      this._logger.info(`📊 Git context: ${isNewFile ? 'New file' : isModified ? 'Modified' : 'Tracked'}, ${stats.filesChanged} files changed`);
      
      return {
        diff,
        changes,
        recentCommits,
        stats,
        isNewFile,
        isModified
      };
    } catch (error) {
      this._logger.warn('Failed to get enhanced git context:', { error: error instanceof Error ? error.message : String(error) });
      return {
        diff: '',
        changes: [],
        recentCommits: [],
        stats: { filesChanged: 0, insertions: 0, deletions: 0 },
        isNewFile: false,
        isModified: false
      };
    }
  }

  /**
   * Analyze code for suggestions
   */
  private async analyzeCode(fileContent: string, fileType: string, context: ReviewContext): Promise<ReviewSuggestion[]> {
    const suggestions: ReviewSuggestion[] = [];
    
    // Analyze readability
    const readabilitySuggestions = await this.analyzeReadability(fileContent, fileType, context);
    suggestions.push(...readabilitySuggestions);
    
    // Analyze performance
    const performanceSuggestions = await this.analyzePerformance(fileContent, fileType, context);
    suggestions.push(...performanceSuggestions);
    
    // Analyze security
    const securitySuggestions = await this.analyzeSecurity(fileContent, fileType, context);
    suggestions.push(...securitySuggestions);
    
    // Analyze best practices
    const bestPracticesSuggestions = await this.analyzeBestPractices(fileContent, fileType, context);
    suggestions.push(...bestPracticesSuggestions);
    
    // Analyze architecture
    const architectureSuggestions = await this.analyzeArchitecture(fileContent, fileType, context);
    suggestions.push(...architectureSuggestions);
    
    return suggestions;
  }

  /**
   * Analyze code readability
   */
  private async analyzeReadability(fileContent: string, _fileType: string, _context: ReviewContext): Promise<ReviewSuggestion[]> {
    const suggestions: ReviewSuggestion[] = [];
    
    // Check for long functions
    const longFunctions = this.findLongFunctions(fileContent);
    for (const func of longFunctions) {
      suggestions.push({
        id: `readability-${Date.now()}-${Math.random()}`,
        type: 'readability',
        severity: 'medium',
        title: 'Function is too long',
        description: `Function "${func.name}" is ${func.length} lines long. Consider breaking it into smaller functions.`,
        currentCode: func.code,
        suggestedCode: this.suggestFunctionRefactoring(func),
        reasoning: 'Long functions are harder to read, test, and maintain. The ideal function length is 10-20 lines.',
        impact: 'medium',
        effort: 'medium'
      });
    }
    
    // Check for complex expressions
    const complexExpressions = this.findComplexExpressions(fileContent);
    for (const expr of complexExpressions) {
      suggestions.push({
        id: `readability-${Date.now()}-${Math.random()}`,
        type: 'readability',
        severity: 'low',
        title: 'Complex expression detected',
        description: `Complex expression on line ${expr.line} could be simplified.`,
        currentCode: expr.code,
        suggestedCode: this.suggestExpressionSimplification(expr),
        reasoning: 'Complex expressions reduce readability and increase cognitive load.',
        impact: 'low',
        effort: 'low'
      });
    }
    
    return suggestions;
  }

  /**
   * Analyze code performance
   */
  private async analyzePerformance(_fileContent: string, fileType: string, _context: ReviewContext): Promise<ReviewSuggestion[]> {
    const suggestions: ReviewSuggestion[] = [];
    
    // Check for inefficient loops
    const inefficientLoops = this.findInefficientLoops(_fileContent);
    for (const loop of inefficientLoops) {
      suggestions.push({
        id: `performance-${Date.now()}-${Math.random()}`,
        type: 'performance',
        severity: 'high',
        title: 'Inefficient loop detected',
        description: `Loop on line ${loop.line} could be optimized.`,
        currentCode: loop.code,
        suggestedCode: this.suggestLoopOptimization(loop),
        reasoning: 'This loop pattern can cause performance issues with large datasets.',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    // Check for memory leaks
    const memoryLeaks = this.findMemoryLeaks(_fileContent, fileType);
    for (const leak of memoryLeaks) {
      suggestions.push({
        id: `performance-${Date.now()}-${Math.random()}`,
        type: 'performance',
        severity: 'critical',
        title: 'Potential memory leak',
        description: `Potential memory leak detected on line ${leak.line}.`,
        currentCode: leak.code,
        suggestedCode: this.suggestMemoryLeakFix(leak),
        reasoning: 'Memory leaks can cause application crashes and performance degradation.',
        impact: 'high',
        effort: 'high'
      });
    }
    
    return suggestions;
  }

  /**
   * Analyze code security
   */
  private async analyzeSecurity(fileContent: string, _fileType: string, _context: ReviewContext): Promise<ReviewSuggestion[]> {
    const suggestions: ReviewSuggestion[] = [];
    
    // Check for SQL injection vulnerabilities
    const sqlInjection = this.findSQLInjection(fileContent);
    for (const vuln of sqlInjection) {
      suggestions.push({
        id: `security-${Date.now()}-${Math.random()}`,
        type: 'security',
        severity: 'critical',
        title: 'Potential SQL injection vulnerability',
        description: `SQL injection vulnerability detected on line ${vuln.line}.`,
        currentCode: vuln.code,
        suggestedCode: this.suggestSQLInjectionFix(vuln),
        reasoning: 'SQL injection vulnerabilities can lead to data breaches and unauthorized access.',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    // Check for XSS vulnerabilities
    const xssVulns = this.findXSSVulnerabilities(fileContent);
    for (const vuln of xssVulns) {
      suggestions.push({
        id: `security-${Date.now()}-${Math.random()}`,
        type: 'security',
        severity: 'high',
        title: 'Potential XSS vulnerability',
        description: `XSS vulnerability detected on line ${vuln.line}.`,
        currentCode: vuln.code,
        suggestedCode: this.suggestXSSFix(vuln),
        reasoning: 'XSS vulnerabilities can allow attackers to execute malicious scripts.',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    return suggestions;
  }

  /**
   * Analyze best practices
   */
  private async analyzeBestPractices(_fileContent: string, _fileType: string, _context: ReviewContext): Promise<ReviewSuggestion[]> {
    const suggestions: ReviewSuggestion[] = [];
    
    // Check for hardcoded values
    const hardcodedValues = this.findHardcodedValues(_fileContent);
    for (const value of hardcodedValues) {
      suggestions.push({
        id: `best-practices-${Date.now()}-${Math.random()}`,
        type: 'best-practices',
        severity: 'medium',
        title: 'Hardcoded value detected',
        description: `Hardcoded value "${value.value}" on line ${value.line} should be moved to configuration.`,
        currentCode: value.code,
        suggestedCode: this.suggestHardcodedValueFix(value),
        reasoning: 'Hardcoded values reduce maintainability and flexibility.',
        impact: 'medium',
        effort: 'low'
      });
    }
    
    // Check for missing error handling
    const missingErrorHandling = this.findMissingErrorHandling(_fileContent);
    for (const error of missingErrorHandling) {
      suggestions.push({
        id: `best-practices-${Date.now()}-${Math.random()}`,
        type: 'best-practices',
        severity: 'high',
        title: 'Missing error handling',
        description: `Missing error handling for operation on line ${error.line}.`,
        currentCode: error.code,
        suggestedCode: this.suggestErrorHandlingFix(error),
        reasoning: 'Proper error handling improves application reliability and user experience.',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    return suggestions;
  }

  /**
   * Analyze architecture
   */
  private async analyzeArchitecture(_fileContent: string, _fileType: string, _context: ReviewContext): Promise<ReviewSuggestion[]> {
    const suggestions: ReviewSuggestion[] = [];
    
    // Check for architectural violations
    const violations = this.findArchitecturalViolations(_fileContent, _context);
    for (const violation of violations) {
      suggestions.push({
        id: `architecture-${Date.now()}-${Math.random()}`,
        type: 'architecture',
        severity: 'medium',
        title: 'Architectural violation detected',
        description: `Architectural violation: ${violation.description}`,
        currentCode: violation.code,
        suggestedCode: this.suggestArchitecturalFix(violation),
        reasoning: violation.reasoning,
        impact: 'medium',
        effort: 'high'
      });
    }
    
    return suggestions;
  }

  /**
   * Calculate quality metrics
   */
  private async calculateQualityMetrics(fileContent: string, _fileType: string, _suggestions: ReviewSuggestion[]): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      readability: this.calculateReadabilityScore(fileContent),
      maintainability: this.calculateMaintainabilityScore(fileContent),
      performance: this.calculatePerformanceScore(fileContent),
      security: this.calculateSecurityScore(fileContent),
      testability: this.calculateTestabilityScore(fileContent),
      overall: 0
    };
    
    // Calculate overall score
    metrics.overall = (metrics.readability + metrics.maintainability + metrics.performance + metrics.security + metrics.testability) / 5;
    
    return metrics;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(metrics: QualityMetrics): number {
    return metrics.overall;
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(suggestions: ReviewSuggestion[], metrics: QualityMetrics): number {
    const baseConfidence = 0.8;
    const suggestionPenalty = Math.min(suggestions.length * 0.05, 0.3);
    const metricsBonus = (metrics.overall - 0.5) * 0.4;
    
    return Math.max(0, Math.min(1, baseConfidence - suggestionPenalty + metricsBonus));
  }

  /**
   * Generate review summary
   */
  private generateReviewSummary(suggestions: ReviewSuggestion[], metrics: QualityMetrics): string {
    const criticalCount = suggestions.filter(s => s.severity === 'critical').length;
    const highCount = suggestions.filter(s => s.severity === 'high').length;
    const mediumCount = suggestions.filter(s => s.severity === 'medium').length;
    const lowCount = suggestions.filter(s => s.severity === 'low').length;
    
    let summary = `Code review completed with overall score of ${(metrics.overall * 100).toFixed(1)}%. `;
    
    if (criticalCount > 0) {
      summary += `${criticalCount} critical issues found that require immediate attention. `;
    }
    
    if (highCount > 0) {
      summary += `${highCount} high priority issues found. `;
    }
    
    if (mediumCount > 0) {
      summary += `${mediumCount} medium priority issues found. `;
    }
    
    if (lowCount > 0) {
      summary += `${lowCount} low priority issues found. `;
    }
    
    if (suggestions.length === 0) {
      summary += 'No issues found. Code quality is excellent!';
    }
    
    return summary;
  }

  /**
   * Record review in memory
   */
  private async recordReviewInMemory(reviewResult: CodeReviewResult): Promise<void> {
    // Record successful review patterns
    if (reviewResult.score > 0.8) {
      const pattern = {
        id: `review-pattern-${Date.now()}`,
        pattern: 'High-quality code review',
        frequency: 1,
        successRate: reviewResult.score,
        lastUsed: new Date().toISOString(),
        example: reviewResult.summary
      };
      
      this._memoryService.recordCodePattern(pattern);
    }
  }

  /**
   * Helper methods for code analysis
   */
  private findLongFunctions(fileContent: string): FunctionAnalysis[] {
    // Simplified implementation - in real implementation, use proper AST parsing
    const lines = fileContent.split('\n');
    const functions: FunctionAnalysis[] = [];
    
    // This is a simplified example - real implementation would use AST parsing
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && (line.includes('function') || line.includes('=>'))) {
        // Find function end (simplified)
        let endLine = i;
        while (endLine < lines.length && lines[endLine] && !lines[endLine]!.includes('}')) {
          endLine++;
        }
        
        if (endLine - i > 20) { // Function longer than 20 lines
          functions.push({
            name: 'function',
            length: endLine - i,
            code: lines.slice(i, Math.min(endLine + 1, lines.length)).join('\n')
          });
        }
      }
    }
    
    return functions;
  }

  private findComplexExpressions(fileContent: string): CodeAnalysisResult[] {
    // Simplified implementation
    const lines = fileContent.split('\n');
    const expressions: CodeAnalysisResult[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.length > 100 && (line.includes('&&') || line.includes('||'))) {
        expressions.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return expressions;
  }

  private findInefficientLoops(fileContent: string): CodeAnalysisResult[] {
    // Simplified implementation
    const lines = fileContent.split('\n');
    const loops: CodeAnalysisResult[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('for') && line.includes('length')) {
        loops.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return loops;
  }

  private findMemoryLeaks(fileContent: string, _fileType: string): CodeAnalysisResult[] {
    // Simplified implementation
    const lines = fileContent.split('\n');
    const leaks: CodeAnalysisResult[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('addEventListener') && !line.includes('removeEventListener')) {
        leaks.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return leaks;
  }

  private findSQLInjection(fileContent: string): CodeAnalysisResult[] {
    // Simplified implementation
    const lines = fileContent.split('\n');
    const vulnerabilities: CodeAnalysisResult[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('SELECT') && line.includes('${') && !line.includes('?')) {
        vulnerabilities.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return vulnerabilities;
  }

  private findXSSVulnerabilities(fileContent: string): CodeAnalysisResult[] {
    // Simplified implementation
    const lines = fileContent.split('\n');
    const vulnerabilities: CodeAnalysisResult[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('innerHTML') && line.includes('${')) {
        vulnerabilities.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return vulnerabilities;
  }

  private findHardcodedValues(fileContent: string): any[] {
    // Simplified implementation
    const lines = fileContent.split('\n');
    const values: any[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && (line.includes('"http://') || line.includes('"https://') || line.includes('"localhost'))) {
        values.push({
          line: i + 1,
          code: line,
          value: line.match(/"([^"]+)"/)?.[1] || ''
        });
      }
    }
    
    return values;
  }

  private findMissingErrorHandling(fileContent: string): any[] {
    // Simplified implementation
    const lines = fileContent.split('\n');
    const errors: any[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('await') && !line.includes('try') && !line.includes('catch')) {
        errors.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return errors;
  }

  private findArchitecturalViolations(fileContent: string, context: ReviewContext): any[] {
    // Simplified implementation
    const violations: any[] = [];
    
    // Check for direct database access in components
    if (fileContent && fileContent.includes('import') && fileContent.includes('database') && context.fileType === 'tsx') {
      violations.push({
        description: 'Direct database access in component',
        code: fileContent,
        reasoning: 'Components should not directly access the database. Use services instead.'
      });
    }
    
    return violations;
  }

  /**
   * Suggestion generation methods
   */
  private suggestFunctionRefactoring(_func: any): string {
    return `// Consider breaking this function into smaller functions:
// 1. Extract validation logic
// 2. Extract business logic
// 3. Extract data transformation logic`;
  }

  private suggestExpressionSimplification(_expr: any): string {
    return `// Consider extracting complex expression to a separate variable or function
const result = complexExpression();
return result;`;
  }

  private suggestLoopOptimization(_loop: any): string {
    return `// Consider using more efficient iteration methods:
// - Use for...of for arrays
// - Use Map/Set for lookups
// - Use reduce() for aggregations`;
  }

  private suggestMemoryLeakFix(_leak: any): string {
    return `// Add cleanup:
// removeEventListener('event', handler);
// or use AbortController for modern APIs`;
  }

  private suggestSQLInjectionFix(_vuln: any): string {
    return `// Use parameterized queries:
// const query = 'SELECT * FROM users WHERE id = ?';
// const result = await db.query(query, [userId]);`;
  }

  private suggestXSSFix(_vuln: any): string {
    return `// Sanitize input or use textContent instead:
// element.textContent = userInput;
// or use a sanitization library`;
  }

  private suggestHardcodedValueFix(_value: any): string {
    return `// Move to configuration:
// const config = getConfig();
// const url = config.api.baseUrl;`;
  }

  private suggestErrorHandlingFix(_error: any): string {
    return `// Add proper error handling:
// try {
//   const result = await operation();
// } catch (error) {
//   this._logger.error('Operation failed:', error);
//   throw error;
// }`;
  }

  private suggestArchitecturalFix(_violation: any): string {
    return `// Follow architectural patterns:
// - Use service layer for business logic
// - Use repository pattern for data access
// - Keep components focused on presentation`;
  }

  /**
   * Quality score calculation methods
   */
  private calculateReadabilityScore(fileContent: string): number {
    const lines = fileContent.split('\n');
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const longLines = lines.filter(line => line.length > 100).length;
    
    let score = 1.0;
    if (avgLineLength > 80) score -= 0.2;
    if (longLines > lines.length * 0.1) score -= 0.3;
    
    return Math.max(0, score);
  }

  private calculateMaintainabilityScore(fileContent: string): number {
    const lines = fileContent.split('\n');
    const functions = (fileContent.match(/function|=>/g) || []).length;
    const comments = (fileContent.match(/\/\*|\/\/|\*\//g) || []).length;
    
    let score = 1.0;
    if (functions > lines.length / 10) score -= 0.2; // Too many functions
    if (comments < lines.length * 0.1) score -= 0.3; // Too few comments
    
    return Math.max(0, score);
  }

  private calculatePerformanceScore(fileContent: string): number {
    let score = 1.0;
    
    if (fileContent && fileContent.includes('for (let i = 0; i < array.length; i++)')) score -= 0.2;
    if (fileContent && fileContent.includes('innerHTML') && fileContent.includes('${')) score -= 0.3;
    if (fileContent && fileContent.includes('eval(')) score -= 0.5;
    
    return Math.max(0, score);
  }

  private calculateSecurityScore(fileContent: string): number {
    let score = 1.0;
    
    if (fileContent && fileContent.includes('eval(')) score -= 0.5;
    if (fileContent && fileContent.includes('innerHTML') && fileContent.includes('${')) score -= 0.3;
    if (fileContent && fileContent.includes('SELECT') && fileContent.includes('${')) score -= 0.4;
    
    return Math.max(0, score);
  }

  private calculateTestabilityScore(fileContent: string): number {
    const lines = fileContent.split('\n');
    const functions = (fileContent.match(/function|=>/g) || []).length;
    const testFiles = (fileContent.match(/\.test\.|\.spec\./g) || []).length;
    
    let score = 1.0;
    if (functions > 0 && testFiles === 0) score -= 0.4;
    if (functions > lines.length / 5) score -= 0.2; // Too many functions per line
    
    return Math.max(0, score);
  }

  /**
   * Utility methods
   */
  private generateReviewId(): string {
    return `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return Buffer.from(content).toString('base64').slice(0, 16);
  }

  /**
   * Get review statistics
   */
  getReviewStats(): any {
    const reviews = Array.from(this.reviewCache.values());
    
    return {
      totalReviews: reviews.length,
      averageScore: reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length,
      totalSuggestions: reviews.reduce((sum, review) => sum + review.suggestions.length, 0),
      averageConfidence: reviews.reduce((sum, review) => sum + review.confidence, 0) / reviews.length,
      cachedReviews: this.reviewCache.size
    };
  }

  /**
   * Clear review cache
   */
  clearReviewCache(): void {
    this.reviewCache.clear();
    this._logger.info('🗑️ Review cache cleared');
    this.emit('review-cache:cleared');
  }

  /**
   * Export review data
   */
  async exportReviewData(exportPath: string): Promise<void> {
    try {
      const reviewData = {
        reviews: Array.from(this.reviewCache.entries()),
        stats: this.getReviewStats(),
        exportedAt: new Date().toISOString()
      };
      
      await fs.writeJson(exportPath, reviewData, { spaces: 2 });
      this._logger.info(`📤 Review data exported to: ${exportPath}`);
      this.emit('review-data:exported', { exportPath });
    } catch (error) {
      this._logger.error('Failed to export review data:', error);
      throw error;
    }
  }
}
