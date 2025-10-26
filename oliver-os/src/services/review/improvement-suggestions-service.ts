/**
 * Improvement Suggestions Service
 * Generate actionable suggestions for code improvement
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import { MemoryService } from '../memory/memory-service';
import { LearningService } from '../memory/learning-service';
import fs from 'fs-extra';
import path from 'path';

export interface ImprovementSuggestion {
  id: string;
  type: 'readability' | 'performance' | 'security' | 'maintainability' | 'best-practices' | 'architecture';
  category: 'code' | 'structure' | 'design' | 'documentation' | 'testing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  currentCode: string;
  suggestedCode: string;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  confidence: number;
  examples: string[];
  references: string[];
}

export interface UserPreferences {
  theme?: string;
  indentation?: number;
  lineLength?: number;
  codingStyle?: 'strict' | 'moderate' | 'relaxed';
  preferredPatterns?: string[];
  [key: string]: unknown;
}

export interface QualityMetrics {
  complexity: number;
  maintainability: number;
  performance: number;
  testCoverage?: number;
  [key: string]: unknown;
}

export interface SuggestionContext {
  filePath: string;
  fileType: string;
  fileContent: string;
  projectStructure: string[];
  recentChanges: string[];
  userPreferences: UserPreferences;
  codingPatterns: string[];
  architectureDecisions: string[];
  qualityMetrics: QualityMetrics;
}

export interface SuggestionConfig {
  enabled: boolean;
  categories: {
    readability: boolean;
    performance: boolean;
    security: boolean;
    maintainability: boolean;
    bestPractices: boolean;
    architecture: boolean;
  };
  thresholds: {
    minConfidence: number;
    maxSuggestions: number;
    severityFilter: string[];
  };
  learning: {
    useMemory: boolean;
    adaptToFeedback: boolean;
    trackSuccess: boolean;
  };
}

// Analysis result interfaces
export interface FunctionAnalysis {
  name: string;
  length: number;
  code: string;
}

export interface CodeAnalysis {
  line: number;
  code: string;
}

export interface ComplexExpression extends CodeAnalysis {
  line: number;
  code: string;
}

export interface MagicNumber extends CodeAnalysis {
  value: string;
}

export interface OptimizationSuggestion extends CodeAnalysis {}

export interface SecurityVulnerability extends CodeAnalysis {}

export interface Secret extends CodeAnalysis {}

export interface DocumentationIssue extends CodeAnalysis {
  type: string;
}

export interface HardcodedValue extends CodeAnalysis {
  value: string;
}

export interface ImportIssue extends CodeAnalysis {
  name: string;
}

export interface DuplicateCode extends CodeAnalysis {
  lines: number[];
}

export interface ArchitectureViolation {
  description: string;
  code: string;
  reasoning: string;
}

export interface Stats {
  totalSuggestions: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  averageConfidence: number;
  lastSuggestions: ImprovementSuggestion[];
}

export class ImprovementSuggestionsService extends EventEmitter {
  private _logger: Logger;
  // private _config!: Config; // Unused for now
  private _memoryService: MemoryService;
  // private _learningService!: LearningService; // Unused for now
  private suggestionConfig: SuggestionConfig;
  private suggestionHistory: Map<string, ImprovementSuggestion[]>;

  constructor(_config: Config, memoryService: MemoryService, _learningService: LearningService) {
    super();
    this._memoryService = memoryService;
    this._logger = new Logger('ImprovementSuggestionsService');
    this.suggestionConfig = this.getDefaultSuggestionConfig();
    this.suggestionHistory = new Map();
    this.loadSuggestionConfig();
  }

  /**
   * Initialize improvement suggestions service
   */
  async initialize(): Promise<void> {
    this._logger.info('💡 Initializing Improvement Suggestions Service...');
    
    try {
      await this.loadSuggestionConfig();
      await this.loadSuggestionHistory();
      
      this._logger.info('✅ Improvement Suggestions Service initialized successfully');
      this.emit('improvement-suggestions:initialized');
    } catch (error) {
      this._logger.error('Failed to initialize improvement suggestions service:', error);
      throw error;
    }
  }

  /**
   * Load suggestion configuration
   */
  private async loadSuggestionConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'improvement-suggestions-config.json');
      if (await fs.pathExists(configPath)) {
        this.suggestionConfig = await fs.readJson(configPath);
        this._logger.info('📋 Improvement suggestions configuration loaded');
      } else {
        this.suggestionConfig = this.getDefaultSuggestionConfig();
        await this.saveSuggestionConfig();
        this._logger.info('📋 Using default improvement suggestions configuration');
      }
    } catch (error) {
      this._logger.warn('Failed to load improvement suggestions configuration, using defaults');
      this.suggestionConfig = this.getDefaultSuggestionConfig();
    }
  }

  /**
   * Get default suggestion configuration
   */
  private getDefaultSuggestionConfig(): SuggestionConfig {
    return {
      enabled: true,
      categories: {
        readability: true,
        performance: true,
        security: true,
        maintainability: true,
        bestPractices: true,
        architecture: true
      },
      thresholds: {
        minConfidence: 0.7,
        maxSuggestions: 10,
        severityFilter: ['low', 'medium', 'high', 'critical']
      },
      learning: {
        useMemory: true,
        adaptToFeedback: true,
        trackSuccess: true
      }
    };
  }

  /**
   * Save suggestion configuration
   */
  private async saveSuggestionConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'improvement-suggestions-config.json');
      await fs.writeJson(configPath, this.suggestionConfig, { spaces: 2 });
      this._logger.info('💾 Improvement suggestions configuration saved');
    } catch (error) {
      this._logger.error('Failed to save improvement suggestions configuration:', error);
    }
  }

  /**
   * Load suggestion history
   */
  private async loadSuggestionHistory(): Promise<void> {
    try {
      const historyPath = path.join(process.cwd(), 'suggestion-history.json');
      if (await fs.pathExists(historyPath)) {
        const history = await fs.readJson(historyPath);
        this.suggestionHistory = new Map(history);
        this._logger.info('📚 Suggestion history loaded');
      }
    } catch (error) {
      this._logger.warn('Failed to load suggestion history');
    }
  }

  /**
   * Generate improvement suggestions for a file
   */
  async generateSuggestions(filePath: string, context?: SuggestionContext): Promise<ImprovementSuggestion[]> {
    this._logger.info(`💡 Generating improvement suggestions for: ${filePath}`);
    
    try {
      // Read file content if not provided in context
      const fileContent = context?.fileContent || await fs.readFile(filePath, 'utf-8');
      const fileType = path.extname(filePath).slice(1);
      
      // Create context if not provided
      const suggestionContext = context || await this.createSuggestionContext(filePath, fileContent, fileType);
      
      // Generate suggestions for each category
      const suggestions: ImprovementSuggestion[] = [];
      
      if (this.suggestionConfig.categories.readability) {
        const readabilitySuggestions = await this.generateReadabilitySuggestions(fileContent, fileType, suggestionContext);
        suggestions.push(...readabilitySuggestions);
      }
      
      if (this.suggestionConfig.categories.performance) {
        const performanceSuggestions = await this.generatePerformanceSuggestions(fileContent, fileType, suggestionContext);
        suggestions.push(...performanceSuggestions);
      }
      
      if (this.suggestionConfig.categories.security) {
        const securitySuggestions = await this.generateSecuritySuggestions(fileContent, fileType, suggestionContext);
        suggestions.push(...securitySuggestions);
      }
      
      if (this.suggestionConfig.categories.maintainability) {
        const maintainabilitySuggestions = await this.generateMaintainabilitySuggestions(fileContent, fileType, suggestionContext);
        suggestions.push(...maintainabilitySuggestions);
      }
      
      if (this.suggestionConfig.categories.bestPractices) {
        const bestPracticesSuggestions = await this.generateBestPracticesSuggestions(fileContent, fileType, suggestionContext);
        suggestions.push(...bestPracticesSuggestions);
      }
      
      if (this.suggestionConfig.categories.architecture) {
        const architectureSuggestions = await this.generateArchitectureSuggestions(fileContent, fileType, suggestionContext);
        suggestions.push(...architectureSuggestions);
      }
      
      // Filter and rank suggestions
      const filteredSuggestions = this.filterSuggestions(suggestions);
      const rankedSuggestions = this.rankSuggestions(filteredSuggestions, suggestionContext);
      
      // Store suggestions
      this.suggestionHistory.set(filePath, rankedSuggestions);
      
      this._logger.info(`✅ Generated ${rankedSuggestions.length} improvement suggestions for ${filePath}`);
      this.emit('improvement-suggestions:generated', { filePath, suggestions: rankedSuggestions.length });
      
      return rankedSuggestions;
    } catch (error) {
      this._logger.error(`Failed to generate improvement suggestions for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Create suggestion context
   */
  private async createSuggestionContext(filePath: string, fileContent: string, fileType: string): Promise<SuggestionContext> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memory = this._memoryService as any;
    
    return {
      filePath,
      fileType,
      fileContent,
      projectStructure: ['src', 'services', 'components'],
      recentChanges: [],
      userPreferences: memory.memory?.codePatterns?.userPreferences || {},
      codingPatterns: [],
      architectureDecisions: memory.memory?.architecture?.decisions?.map((d: { id: string }) => d.id) || [],
      qualityMetrics: {
        complexity: this.analyzeComplexity(fileContent),
        maintainability: this.analyzeMaintainability(fileContent),
        performance: this.analyzePerformance(fileContent)
      }
    };
  }

  /**
   * Generate readability suggestions
   */
  private async generateReadabilitySuggestions(fileContent: string, _fileType: string, _context: SuggestionContext): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Check for long functions
    const longFunctions = this.findLongFunctions(fileContent);
    for (const func of longFunctions) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'readability',
        category: 'code',
        severity: 'medium',
        title: 'Function is too long',
        description: `Function "${func.name}" is ${func.length} lines long. Consider breaking it into smaller functions.`,
        currentCode: func.code,
        suggestedCode: this.suggestFunctionRefactoring(func),
        reasoning: 'Long functions are harder to read, test, and maintain. The ideal function length is 10-20 lines.',
        impact: 'medium',
        effort: 'medium',
        confidence: 0.9,
        examples: ['Extract validation logic', 'Extract business logic', 'Extract data transformation'],
        references: ['Clean Code by Robert Martin', 'Function length best practices']
      });
    }
    
    // Check for complex expressions
    const complexExpressions = this.findComplexExpressions(fileContent);
    for (const expr of complexExpressions) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'readability',
        category: 'code',
        severity: 'low',
        title: 'Complex expression detected',
        description: `Complex expression on line ${expr.line} could be simplified.`,
        currentCode: expr.code,
        suggestedCode: this.suggestExpressionSimplification(expr),
        reasoning: 'Complex expressions reduce readability and increase cognitive load.',
        impact: 'low',
        effort: 'low',
        confidence: 0.8,
        examples: ['Extract to variables', 'Use helper functions', 'Simplify boolean logic'],
        references: ['Clean Code principles', 'Cognitive complexity guidelines']
      });
    }
    
    // Check for magic numbers
    const magicNumbers = this.findMagicNumbers(fileContent);
    for (const magic of magicNumbers) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'readability',
        category: 'code',
        severity: 'low',
        title: 'Magic number detected',
        description: `Magic number ${magic.value} on line ${magic.line} should be replaced with a named constant.`,
        currentCode: magic.code,
        suggestedCode: this.suggestMagicNumberFix(magic),
        reasoning: 'Magic numbers reduce code readability and maintainability.',
        impact: 'low',
        effort: 'low',
        confidence: 0.85,
        examples: ['const MAX_RETRIES = 3', 'const TIMEOUT_MS = 5000'],
        references: ['Clean Code principles', 'Magic number anti-pattern']
      });
    }
    
    return suggestions;
  }

  /**
   * Generate performance suggestions
   */
  private async generatePerformanceSuggestions(fileContent: string, _fileType: string, _context: SuggestionContext): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Check for inefficient loops
    const inefficientLoops = this.findInefficientLoops(fileContent);
    for (const loop of inefficientLoops) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'performance',
        category: 'code',
        severity: 'high',
        title: 'Inefficient loop detected',
        description: `Loop on line ${loop.line} could be optimized for better performance.`,
        currentCode: loop.code,
        suggestedCode: this.suggestLoopOptimization(loop),
        reasoning: 'This loop pattern can cause performance issues with large datasets.',
        impact: 'high',
        effort: 'medium',
        confidence: 0.9,
        examples: ['Use for...of instead of for loop', 'Use Map/Set for lookups', 'Use reduce() for aggregations'],
        references: ['JavaScript performance optimization', 'Loop optimization techniques']
      });
    }
    
    // Check for memory leaks
    const memoryLeaks = this.findMemoryLeaks(fileContent, _fileType);
    for (const leak of memoryLeaks) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'performance',
        category: 'code',
        severity: 'critical',
        title: 'Potential memory leak',
        description: `Potential memory leak detected on line ${leak.line}.`,
        currentCode: leak.code,
        suggestedCode: this.suggestMemoryLeakFix(leak),
        reasoning: 'Memory leaks can cause application crashes and performance degradation.',
        impact: 'high',
        effort: 'high',
        confidence: 0.95,
        examples: ['Remove event listeners', 'Use AbortController', 'Clear timers'],
        references: ['Memory leak prevention', 'JavaScript memory management']
      });
    }
    
    // Check for unnecessary re-renders
    const unnecessaryRenders = this.findUnnecessaryRenders(fileContent);
    for (const render of unnecessaryRenders) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'performance',
        category: 'code',
        severity: 'medium',
        title: 'Unnecessary re-render detected',
        description: `Component may re-render unnecessarily on line ${render.line}.`,
        currentCode: render.code,
        suggestedCode: this.suggestRenderOptimization(render),
        reasoning: 'Unnecessary re-renders can impact performance, especially with large components.',
        impact: 'medium',
        effort: 'medium',
        confidence: 0.8,
        examples: ['Use React.memo', 'Use useMemo', 'Use useCallback'],
        references: ['React performance optimization', 'Re-render prevention techniques']
      });
    }
    
    return suggestions;
  }

  /**
   * Generate security suggestions
   */
  private async generateSecuritySuggestions(fileContent: string, _fileType: string, _context: SuggestionContext): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Check for SQL injection vulnerabilities
    const sqlInjection = this.findSQLInjection(fileContent);
    for (const vuln of sqlInjection) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'security',
        category: 'code',
        severity: 'critical',
        title: 'Potential SQL injection vulnerability',
        description: `SQL injection vulnerability detected on line ${vuln.line}.`,
        currentCode: vuln.code,
        suggestedCode: this.suggestSQLInjectionFix(vuln),
        reasoning: 'SQL injection vulnerabilities can lead to data breaches and unauthorized access.',
        impact: 'high',
        effort: 'medium',
        confidence: 0.95,
        examples: ['Use parameterized queries', 'Use ORM methods', 'Validate input'],
        references: ['OWASP SQL Injection Prevention', 'Secure coding practices']
      });
    }
    
    // Check for XSS vulnerabilities
    const xssVulns = this.findXSSVulnerabilities(fileContent);
    for (const vuln of xssVulns) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'security',
        category: 'code',
        severity: 'high',
        title: 'Potential XSS vulnerability',
        description: `XSS vulnerability detected on line ${vuln.line}.`,
        currentCode: vuln.code,
        suggestedCode: this.suggestXSSFix(vuln),
        reasoning: 'XSS vulnerabilities can allow attackers to execute malicious scripts.',
        impact: 'high',
        effort: 'medium',
        confidence: 0.9,
        examples: ['Use textContent instead of innerHTML', 'Sanitize input', 'Use CSP headers'],
        references: ['OWASP XSS Prevention', 'Client-side security best practices']
      });
    }
    
    // Check for hardcoded secrets
    const hardcodedSecrets = this.findHardcodedSecrets(fileContent);
    for (const secret of hardcodedSecrets) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'security',
        category: 'code',
        severity: 'critical',
        title: 'Hardcoded secret detected',
        description: `Hardcoded secret detected on line ${secret.line}.`,
        currentCode: secret.code,
        suggestedCode: this.suggestSecretFix(secret),
        reasoning: 'Hardcoded secrets can be exposed in version control and compromise security.',
        impact: 'high',
        effort: 'low',
        confidence: 0.95,
        examples: ['Use environment variables', 'Use secret management', 'Use configuration files'],
        references: ['Secret management best practices', 'Environment variable security']
      });
    }
    
    return suggestions;
  }

  /**
   * Generate maintainability suggestions
   */
  private async generateMaintainabilitySuggestions(fileContent: string, _fileType: string, _context: SuggestionContext): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Check for duplicate code
    const duplicateCode = this.findDuplicateCode(fileContent);
    for (const duplicate of duplicateCode) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'maintainability',
        category: 'code',
        severity: 'medium',
        title: 'Duplicate code detected',
        description: `Duplicate code detected on lines ${duplicate.lines.join(', ')}.`,
        currentCode: duplicate.code,
        suggestedCode: this.suggestDuplicateCodeFix(duplicate),
        reasoning: 'Duplicate code increases maintenance burden and can lead to inconsistencies.',
        impact: 'medium',
        effort: 'medium',
        confidence: 0.85,
        examples: ['Extract to common function', 'Create utility class', 'Use shared component'],
        references: ['DRY principle', 'Code duplication prevention']
      });
    }
    
    // Check for missing error handling
    const missingErrorHandling = this.findMissingErrorHandling(fileContent);
    for (const error of missingErrorHandling) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'maintainability',
        category: 'code',
        severity: 'high',
        title: 'Missing error handling',
        description: `Missing error handling for operation on line ${error.line}.`,
        currentCode: error.code,
        suggestedCode: this.suggestErrorHandlingFix(error),
        reasoning: 'Proper error handling improves application reliability and user experience.',
        impact: 'high',
        effort: 'medium',
        confidence: 0.9,
        examples: ['Add try-catch blocks', 'Handle async errors', 'Provide user feedback'],
        references: ['Error handling best practices', 'Robust error management']
      });
    }
    
    // Check for missing documentation
    const missingDocumentation = this.findMissingDocumentation(fileContent);
    for (const doc of missingDocumentation) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'maintainability',
        category: 'documentation',
        severity: 'low',
        title: 'Missing documentation',
        description: `Missing documentation for ${doc.type} on line ${doc.line}.`,
        currentCode: doc.code,
        suggestedCode: this.suggestDocumentationFix(doc),
        reasoning: 'Documentation improves code maintainability and helps other developers understand the code.',
        impact: 'low',
        effort: 'low',
        confidence: 0.8,
        examples: ['Add JSDoc comments', 'Document function parameters', 'Explain complex logic'],
        references: ['Documentation best practices', 'Code commenting guidelines']
      });
    }
    
    return suggestions;
  }

  /**
   * Generate best practices suggestions
   */
  private async generateBestPracticesSuggestions(fileContent: string, _fileType: string, _context: SuggestionContext): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Check for hardcoded values
    const hardcodedValues = this.findHardcodedValues(fileContent);
    for (const value of hardcodedValues) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'best-practices',
        category: 'code',
        severity: 'medium',
        title: 'Hardcoded value detected',
        description: `Hardcoded value "${value.value}" on line ${value.line} should be moved to configuration.`,
        currentCode: value.code,
        suggestedCode: this.suggestHardcodedValueFix(value),
        reasoning: 'Hardcoded values reduce maintainability and flexibility.',
        impact: 'medium',
        effort: 'low',
        confidence: 0.85,
        examples: ['Move to configuration file', 'Use environment variables', 'Create constants'],
        references: ['Configuration management', 'Hardcoded value anti-pattern']
      });
    }
    
    // Check for unused imports
    const unusedImports = this.findUnusedImports(fileContent);
    for (const import_ of unusedImports) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'best-practices',
        category: 'code',
        severity: 'low',
        title: 'Unused import detected',
        description: `Unused import "${import_.name}" on line ${import_.line} should be removed.`,
        currentCode: import_.code,
        suggestedCode: this.suggestUnusedImportFix(import_),
        reasoning: 'Unused imports increase bundle size and reduce code clarity.',
        impact: 'low',
        effort: 'low',
        confidence: 0.9,
        examples: ['Remove unused imports', 'Use tree shaking', 'Clean up dependencies'],
        references: ['Bundle optimization', 'Import management']
      });
    }
    
    // Check for inconsistent naming
    const inconsistentNaming = this.findInconsistentNaming(fileContent);
    for (const naming of inconsistentNaming) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'best-practices',
        category: 'code',
        severity: 'low',
        title: 'Inconsistent naming detected',
        description: `Inconsistent naming convention detected on line ${naming.line}.`,
        currentCode: naming.code,
        suggestedCode: this.suggestNamingFix(naming),
        reasoning: 'Consistent naming conventions improve code readability and maintainability.',
        impact: 'low',
        effort: 'low',
        confidence: 0.8,
        examples: ['Use camelCase for variables', 'Use PascalCase for components', 'Use UPPER_CASE for constants'],
        references: ['Naming conventions', 'Code style guidelines']
      });
    }
    
    return suggestions;
  }

  /**
   * Generate architecture suggestions
   */
  private async generateArchitectureSuggestions(fileContent: string, _fileType: string, _context: SuggestionContext): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Check for architectural violations
    const violations = this.findArchitecturalViolations(fileContent, _context);
    for (const violation of violations) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'architecture',
        category: 'design',
        severity: 'medium',
        title: 'Architectural violation detected',
        description: `Architectural violation: ${violation.description}`,
        currentCode: violation.code,
        suggestedCode: this.suggestArchitecturalFix(violation),
        reasoning: violation.reasoning,
        impact: 'medium',
        effort: 'high',
        confidence: 0.8,
        examples: ['Follow layered architecture', 'Use dependency injection', 'Separate concerns'],
        references: ['Architectural patterns', 'Design principles']
      });
    }
    
    // Check for tight coupling
    const tightCoupling = this.findTightCoupling(fileContent);
    for (const coupling of tightCoupling) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'architecture',
        category: 'design',
        severity: 'medium',
        title: 'Tight coupling detected',
        description: `Tight coupling detected on line ${coupling.line}.`,
        currentCode: coupling.code,
        suggestedCode: this.suggestCouplingFix(coupling),
        reasoning: 'Tight coupling reduces code flexibility and makes testing difficult.',
        impact: 'medium',
        effort: 'high',
        confidence: 0.8,
        examples: ['Use dependency injection', 'Implement interfaces', 'Reduce direct dependencies'],
        references: ['Loose coupling principles', 'Dependency inversion']
      });
    }
    
    return suggestions;
  }

  /**
   * Filter suggestions based on configuration
   */
  private filterSuggestions(suggestions: ImprovementSuggestion[]): ImprovementSuggestion[] {
    return suggestions.filter(suggestion => {
      // Filter by confidence
      if (suggestion.confidence < this.suggestionConfig.thresholds.minConfidence) {
        return false;
      }
      
      // Filter by severity
      if (!this.suggestionConfig.thresholds.severityFilter.includes(suggestion.severity)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Rank suggestions by importance and impact
   */
  private rankSuggestions(suggestions: ImprovementSuggestion[], context: SuggestionContext): ImprovementSuggestion[] {
    return suggestions.sort((a, b) => {
      // Calculate priority score
      const scoreA = this.calculatePriorityScore(a, context);
      const scoreB = this.calculatePriorityScore(b, context);
      
      return scoreB - scoreA;
    }).slice(0, this.suggestionConfig.thresholds.maxSuggestions);
  }

  /**
   * Calculate priority score for a suggestion
   */
  private calculatePriorityScore(suggestion: ImprovementSuggestion, _context: SuggestionContext): number {
    let score = 0;
    
    // Severity weight
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    score += severityWeights[suggestion.severity] * 10;
    
    // Impact weight
    const impactWeights = { low: 1, medium: 2, high: 3 };
    score += impactWeights[suggestion.impact] * 5;
    
    // Confidence weight
    score += suggestion.confidence * 20;
    
    // Effort penalty (lower effort = higher priority)
    const effortPenalties = { low: 0, medium: 5, high: 10 };
    score -= effortPenalties[suggestion.effort];
    
    return score;
  }

  /**
   * Helper methods for code analysis
   */
  private findLongFunctions(fileContent: string): FunctionAnalysis[] {
    // Simplified implementation
    const lines = fileContent.split('\n');
    const functions: FunctionAnalysis[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && (line.includes('function') || line.includes('=>'))) {
        let endLine = i;
        while (endLine < lines.length && lines[endLine] && !lines[endLine]?.includes('}')) {
          endLine++;
        }
        
        if (endLine - i > 20) {
          functions.push({
            name: 'function',
            length: endLine - i,
            code: lines.slice(i, endLine + 1).join('\n')
          });
        }
      }
    }
    
    return functions;
  }

  private findComplexExpressions(fileContent: string): ComplexExpression[] {
    const lines = fileContent.split('\n');
    const expressions: ComplexExpression[] = [];
    
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

  private findMagicNumbers(fileContent: string): MagicNumber[] {
    const lines = fileContent.split('\n');
    const magicNumbers: MagicNumber[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      const numbers = line.match(/\b\d+\b/g);
      
      if (numbers) {
        numbers.forEach(number => {
          if (parseInt(number) > 1 && parseInt(number) < 1000) {
            magicNumbers.push({
              line: i + 1,
              value: number,
              code: line
            });
          }
        });
      }
    }
    
    return magicNumbers;
  }

  private findInefficientLoops(fileContent: string): OptimizationSuggestion[] {
    const lines = fileContent.split('\n');
    const loops: OptimizationSuggestion[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('for (let i = 0; i < array.length; i++)')) {
        loops.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return loops;
  }

  private findMemoryLeaks(fileContent: string, _fileType: string): OptimizationSuggestion[] {
    const lines = fileContent.split('\n');
    const leaks: OptimizationSuggestion[] = [];
    
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

  private findUnnecessaryRenders(fileContent: string): OptimizationSuggestion[] {
    const lines = fileContent.split('\n');
    const renders: OptimizationSuggestion[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line && line.includes('useState') && !line.includes('useMemo')) {
        renders.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return renders;
  }

  private findSQLInjection(fileContent: string): SecurityVulnerability[] {
    const lines = fileContent.split('\n');
    const vulnerabilities: SecurityVulnerability[] = [];
    
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

  private findXSSVulnerabilities(fileContent: string): SecurityVulnerability[] {
    const lines = fileContent.split('\n');
    const vulnerabilities: SecurityVulnerability[] = [];
    
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

  private findHardcodedSecrets(fileContent: string): Secret[] {
    const lines = fileContent.split('\n');
    const secrets: Secret[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && (line.includes('password') || line.includes('secret') || line.includes('key'))) {
        secrets.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return secrets;
  }

  private findDuplicateCode(_fileContent: string): DuplicateCode[] {
    // Simplified implementation
    return [];
  }

  private findMissingErrorHandling(fileContent: string): OptimizationSuggestion[] {
    const lines = fileContent.split('\n');
    const errors: OptimizationSuggestion[] = [];
    
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

  private findMissingDocumentation(fileContent: string): DocumentationIssue[] {
    const lines = fileContent.split('\n');
    const missing: DocumentationIssue[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('function') && !line.includes('/**')) {
        missing.push({
          line: i + 1,
          type: 'function',
          code: line
        });
      }
    }
    
    return missing;
  }

  private findHardcodedValues(fileContent: string): HardcodedValue[] {
    const lines = fileContent.split('\n');
    const values: HardcodedValue[] = [];
    
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

  private findUnusedImports(fileContent: string): ImportIssue[] {
    const lines = fileContent.split('\n');
    const imports: ImportIssue[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('import') && line.includes('from')) {
        const importMatch = line.match(/import\s+{([^}]+)}/);
        if (importMatch) {
          const importNames = importMatch[1]!.split(',').map(name => name.trim());
          importNames.forEach(name => {
            if (!fileContent.includes(name) || fileContent.indexOf(name) === fileContent.indexOf(line)) {
              imports.push({
                line: i + 1,
                name,
                code: line
              });
            }
          });
        }
      }
    }
    
    return imports;
  }

  private findInconsistentNaming(fileContent: string): CodeAnalysis[] {
    const lines = fileContent.split('\n');
    const naming: CodeAnalysis[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('const') && line.includes('_')) {
        naming.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return naming;
  }

  private findArchitecturalViolations(fileContent: string, context: SuggestionContext): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = [];
    
    if (fileContent && fileContent.includes('import') && fileContent.includes('database') && context.fileType === 'tsx') {
      violations.push({
        description: 'Direct database access in component',
        code: fileContent,
        reasoning: 'Components should not directly access the database. Use services instead.'
      });
    }
    
    return violations;
  }

  private findTightCoupling(fileContent: string): CodeAnalysis[] {
    const lines = fileContent.split('\n');
    const coupling: CodeAnalysis[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('new ') && line.includes('Service')) {
        coupling.push({
          line: i + 1,
          code: line
        });
      }
    }
    
    return coupling;
  }

  /**
   * Suggestion generation methods
   */
  private suggestFunctionRefactoring(_func: FunctionAnalysis): string {
    return `// Consider breaking this function into smaller functions:
// 1. Extract validation logic
// 2. Extract business logic
// 3. Extract data transformation logic`;
  }

  private suggestExpressionSimplification(_expr: ComplexExpression): string {
    return `// Consider extracting complex expression to a separate variable or function
const result = complexExpression();
return result;`;
  }

  private suggestMagicNumberFix(magic: MagicNumber): string {
    return `// Replace magic number with named constant
const MAX_RETRIES = ${magic.value};
// ... use MAX_RETRIES instead of ${magic.value}`;
  }

  private suggestLoopOptimization(_loop: OptimizationSuggestion): string {
    return `// Consider using more efficient iteration methods:
// - Use for...of for arrays
// - Use Map/Set for lookups
// - Use reduce() for aggregations`;
  }

  private suggestMemoryLeakFix(_leak: OptimizationSuggestion): string {
    return `// Add cleanup:
// removeEventListener('event', handler);
// or use AbortController for modern APIs`;
  }

  private suggestRenderOptimization(_render: OptimizationSuggestion): string {
    return `// Consider using React.memo or useMemo to prevent unnecessary re-renders
const MemoizedComponent = React.memo(Component);`;
  }

  private suggestSQLInjectionFix(_vuln: SecurityVulnerability): string {
    return `// Use parameterized queries:
// const query = 'SELECT * FROM users WHERE id = ?';
// const result = await db.query(query, [userId]);`;
  }

  private suggestXSSFix(_vuln: SecurityVulnerability): string {
    return `// Sanitize input or use textContent instead:
// element.textContent = userInput;
// or use a sanitization library`;
  }

  private suggestSecretFix(_secret: Secret): string {
    return `// Use environment variables:
// const secret = process.env.SECRET_KEY;
// or use a secret management service`;
  }

  private suggestDuplicateCodeFix(_duplicate: DuplicateCode): string {
    return `// Extract to common function:
// function commonFunction() { ... }
// Use commonFunction() in both places`;
  }

  private suggestErrorHandlingFix(_error: OptimizationSuggestion): string {
    return `// Add proper error handling:
// try {
//   const result = await operation();
// } catch (error) {
//   this._logger.error('Operation failed:', error);
//   throw error;
// }`;
  }

  private suggestDocumentationFix(doc: DocumentationIssue): string {
    return `// Add documentation:
// /**
//  * ${doc.type} description
//  * @param {type} param - parameter description
//  * @returns {type} return description
//  */`;
  }

  private suggestHardcodedValueFix(_value: HardcodedValue): string {
    return `// Move to configuration:
// const config = getConfig();
// const url = config.api.baseUrl;`;
  }

  private suggestUnusedImportFix(_import_: ImportIssue): string {
    return `// Remove unused import:
// import { usedImport } from 'module';`;
  }

  private suggestNamingFix(_naming: CodeAnalysis): string {
    return `// Use consistent naming convention:
// const camelCaseVariable = value;`;
  }

  private suggestArchitecturalFix(_violation: ArchitectureViolation): string {
    return `// Follow architectural patterns:
// - Use service layer for business logic
// - Use repository pattern for data access
// - Keep components focused on presentation`;
  }

  private suggestCouplingFix(_coupling: CodeAnalysis): string {
    return `// Reduce coupling:
// - Use dependency injection
// - Implement interfaces
// - Reduce direct dependencies`;
  }

  /**
   * Analysis methods
   */
  private analyzeComplexity(fileContent: string): number {
    const lines = fileContent.split('\n');
    const functions = (fileContent.match(/function|=>/g) || []).length;
    const complexity = (fileContent.match(/if|for|while|switch|try/g) || []).length;
    
    return Math.min(1, (functions + complexity) / lines.length);
  }

  private analyzeMaintainability(fileContent: string): number {
    const lines = fileContent.split('\n');
    const comments = (fileContent.match(/\/\*|\/\/|\*\//g) || []).length;
    const functions = (fileContent.match(/function|=>/g) || []).length;
    
    let score = 1.0;
    if (functions > lines.length / 10) score -= 0.2;
    if (comments < lines.length * 0.1) score -= 0.3;
    
    return Math.max(0, score);
  }

  private analyzePerformance(fileContent: string): number {
    let score = 1.0;
    
    if (fileContent && fileContent.includes('for (let i = 0; i < array.length; i++)')) score -= 0.2;
    if (fileContent && fileContent.includes('innerHTML') && fileContent.includes('${')) score -= 0.3;
    if (fileContent && fileContent.includes('eval(')) score -= 0.5;
    
    return Math.max(0, score);
  }

  /**
   * Utility methods
   */
  private generateSuggestionId(): string {
    return `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get improvement suggestions statistics
   */
  getImprovementSuggestionsStats(): Stats {
    const suggestions = Array.from(this.suggestionHistory.values()).flat();
    
    return {
      totalSuggestions: suggestions.length,
      byType: suggestions.reduce((acc, suggestion) => {
        acc[suggestion.type] = (acc[suggestion.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: suggestions.reduce((acc, suggestion) => {
        acc[suggestion.severity] = (acc[suggestion.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageConfidence: suggestions.length > 0 
        ? suggestions.reduce((sum, suggestion) => sum + suggestion.confidence, 0) / suggestions.length 
        : 0,
      lastSuggestions: suggestions.slice(-10)
    };
  }

  /**
   * Clear suggestion history
   */
  clearSuggestionHistory(): void {
    this.suggestionHistory.clear();
    this._logger.info('🗑️ Improvement suggestions history cleared');
    this.emit('improvement-suggestions-history:cleared');
  }

  /**
   * Export improvement suggestions data
   */
  async exportImprovementSuggestionsData(exportPath: string): Promise<void> {
    try {
      const suggestionData = {
        suggestions: Array.from(this.suggestionHistory.entries()),
        stats: this.getImprovementSuggestionsStats(),
        config: this.suggestionConfig,
        exportedAt: new Date().toISOString()
      };
      
      await fs.writeJson(exportPath, suggestionData, { spaces: 2 });
      this._logger.info(`📤 Improvement suggestions data exported to: ${exportPath}`);
      this.emit('improvement-suggestions-data:exported', { exportPath });
    } catch (error) {
      this._logger.error('Failed to export improvement suggestions data:', error);
      throw error;
    }
  }
}
