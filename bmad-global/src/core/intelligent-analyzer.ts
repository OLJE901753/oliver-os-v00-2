/**
 * Intelligent BMAD Code Analysis Engine
 * Advanced code analysis with actionable insights and recommendations
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from './logger';
import type { CodeMetrics, QualityGate, Recommendation } from '../types/bmad';

export interface CodeAnalysisConfig {
  complexityThresholds: {
    cyclomatic: number;
    cognitive: number;
    maintainability: number;
  };
  qualityGates: {
    testCoverage: number;
    codeDuplication: number;
    technicalDebt: number;
  };
  analysisDepth: 'shallow' | 'medium' | 'deep';
  includeRecommendations: boolean;
  generateReports: boolean;
}

export interface FileAnalysis {
  path: string;
  metrics: CodeMetrics;
  issues: QualityGate[];
  recommendations: Recommendation[];
  complexity: {
    cyclomatic: number;
    cognitive: number;
    maintainability: number;
  };
  dependencies: {
    internal: string[];
    external: string[];
    unused: string[];
  };
  patterns: {
    detected: string[];
    violations: string[];
    opportunities: string[];
  };
}

export interface ProjectAnalysis {
  overall: CodeMetrics;
  files: FileAnalysis[];
  architecture: {
    layers: string[];
    dependencies: Record<string, string[]>;
    violations: string[];
  };
  quality: {
    score: number;
    gates: QualityGate[];
    trends: Record<string, number>;
  };
  recommendations: Recommendation[];
  technicalDebt: {
    total: number;
    byCategory: Record<string, number>;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export class IntelligentCodeAnalyzer {
  private logger: Logger;
  private config: CodeAnalysisConfig;

  constructor(config: CodeAnalysisConfig) {
    this.config = config;
    this.logger = new Logger('CodeAnalyzer');
  }

  /**
   * Perform comprehensive code analysis following BMAD principles
   */
  async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    this.logger.info(`🔍 Starting comprehensive code analysis for: ${projectPath}`);

    const files = await this.discoverCodeFiles(projectPath);
    const fileAnalyses: FileAnalysis[] = [];

    // Analyze each file
    for (const file of files) {
      try {
        const analysis = await this.analyzeFile(file);
        fileAnalyses.push(analysis);
      } catch (error) {
        this.logger.error(`Failed to analyze file: ${file}`, error);
      }
    }

    // Perform architectural analysis
    const architecture = await this.analyzeArchitecture(projectPath, fileAnalyses);

    // Calculate overall metrics
    const overall = this.calculateOverallMetrics(fileAnalyses);

    // Generate quality assessment
    const quality = this.assessQuality(fileAnalyses);

    // Calculate technical debt
    const technicalDebt = this.calculateTechnicalDebt(fileAnalyses);

    // Generate recommendations
    const recommendations = this.generateRecommendations(fileAnalyses, architecture, quality);

    const analysis: ProjectAnalysis = {
      overall,
      files: fileAnalyses,
      architecture,
      quality,
      recommendations,
      technicalDebt
    };

    this.logger.info(`✅ Code analysis completed. Quality score: ${quality.score}/100`);

    return analysis;
  }

  /**
   * Analyze individual file with BMAD principles
   */
  private async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();

    const metrics = this.calculateFileMetrics(content, ext);
    const complexity = this.calculateComplexity(content, ext);
    const dependencies = await this.analyzeDependencies(content, filePath);
    const patterns = this.detectPatterns(content, ext);
    const issues = this.identifyIssues(metrics, complexity, patterns);
    const recommendations = this.generateFileRecommendations(metrics, complexity, issues);

    return {
      path: filePath,
      metrics,
      issues,
      recommendations,
      complexity,
      dependencies,
      patterns
    };
  }

  /**
   * Calculate complexity metrics
   */
  private calculateComplexity(content: string, extension: string): {
    cyclomatic: number;
    cognitive: number;
    maintainability: number;
  } {
    return {
      cyclomatic: this.calculateCyclomaticComplexity(content),
      cognitive: this.calculateCognitiveComplexity(content),
      maintainability: this.calculateMaintainabilityIndex(content)
    };
  }

  /**
   * Calculate comprehensive file metrics
   */
  private calculateFileMetrics(content: string, extension: string): CodeMetrics {
    const lines = content.split('\n');
    const codeLines = lines.filter(line => 
      line.trim().length > 0 && 
      !line.trim().startsWith('//') && 
      !line.trim().startsWith('/*') &&
      !line.trim().startsWith('*')
    );

    return {
      linesOfCode: codeLines.length,
      totalLines: lines.length,
      commentRatio: this.calculateCommentRatio(content),
      functionCount: this.countFunctions(content, extension),
      classCount: this.countClasses(content, extension),
      importCount: this.countImports(content, extension),
      exportCount: this.countExports(content, extension),
      cyclomaticComplexity: this.calculateCyclomaticComplexity(content),
      cognitiveComplexity: this.calculateCognitiveComplexity(content),
      maintainabilityIndex: this.calculateMaintainabilityIndex(content),
      duplicationRatio: this.calculateDuplicationRatio(content),
      testCoverage: 0, // Would be calculated from test files
      technicalDebt: this.calculateTechnicalDebtScore(content)
    };
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateCyclomaticComplexity(content: string): number {
    const complexityKeywords = [
      'if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?'
    ];

    let complexity = 1; // Base complexity

    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Calculate cognitive complexity
   */
  private calculateCognitiveComplexity(content: string): number {
    // Simplified cognitive complexity calculation
    // In a real implementation, this would be more sophisticated
    const nestingKeywords = ['if', 'else', 'while', 'for', 'switch', 'try', 'catch'];
    let complexity = 0;
    let nestingLevel = 0;

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      for (const keyword of nestingKeywords) {
        if (trimmed.includes(keyword)) {
          complexity += nestingLevel + 1;
          nestingLevel++;
          break;
        }
      }

      // Decrease nesting level for closing braces
      if (trimmed.includes('}')) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }
    }

    return complexity;
  }

  /**
   * Calculate maintainability index
   */
  private calculateMaintainabilityIndex(content: string): number {
    const linesOfCode = content.split('\n').length;
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(content);
    const commentRatio = this.calculateCommentRatio(content);

    // Simplified maintainability index calculation
    // Real implementation would use Halstead complexity measures
    const baseScore = 100;
    const complexityPenalty = Math.min(cyclomaticComplexity * 2, 50);
    const commentBonus = Math.min(commentRatio * 10, 20);

    return Math.max(0, baseScore - complexityPenalty + commentBonus);
  }

  /**
   * Calculate comment ratio
   */
  private calculateCommentRatio(content: string): number {
    const lines = content.split('\n');
    const commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') ||
      line.trim().startsWith('*')
    ).length;

    return lines.length > 0 ? commentLines / lines.length : 0;
  }

  /**
   * Count functions based on file type
   */
  private countFunctions(content: string, extension: string): number {
    const patterns = {
      '.ts': /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(|export\s+(?:async\s+)?function)/g,
      '.js': /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(|export\s+(?:async\s+)?function)/g,
      '.py': /def\s+\w+/g,
      '.java': /(?:public|private|protected)?\s*(?:static\s+)?\w+\s+\w+\s*\(/g,
      '.cs': /(?:public|private|protected)?\s*(?:static\s+)?\w+\s+\w+\s*\(/g
    };

    const pattern = patterns[extension as keyof typeof patterns];
    if (!pattern) return 0;

    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Count classes based on file type
   */
  private countClasses(content: string, extension: string): number {
    const patterns = {
      '.ts': /class\s+\w+/g,
      '.js': /class\s+\w+/g,
      '.py': /class\s+\w+/g,
      '.java': /class\s+\w+/g,
      '.cs': /class\s+\w+/g
    };

    const pattern = patterns[extension as keyof typeof patterns];
    if (!pattern) return 0;

    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Count imports
   */
  private countImports(content: string, extension: string): number {
    const patterns = {
      '.ts': /import\s+.*from\s+['"]/g,
      '.js': /import\s+.*from\s+['"]/g,
      '.py': /import\s+\w+/g,
      '.java': /import\s+\w+/g,
      '.cs': /using\s+\w+/g
    };

    const pattern = patterns[extension as keyof typeof patterns];
    if (!pattern) return 0;

    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Count exports
   */
  private countExports(content: string, extension: string): number {
    const patterns = {
      '.ts': /export\s+(?:const|function|class|interface|type)/g,
      '.js': /export\s+(?:const|function|class)/g,
      '.py': /^[a-zA-Z_][a-zA-Z0-9_]*\s*=/g,
      '.java': /public\s+(?:class|interface|enum)/g,
      '.cs': /public\s+(?:class|interface|enum)/g
    };

    const pattern = patterns[extension as keyof typeof patterns];
    if (!pattern) return 0;

    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Calculate duplication ratio
   */
  private calculateDuplicationRatio(content: string): number {
    // Simplified duplication detection
    // Real implementation would use more sophisticated algorithms
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const uniqueLines = new Set(lines);
    
    return lines.length > 0 ? 1 - (uniqueLines.size / lines.length) : 0;
  }

  /**
   * Calculate technical debt score
   */
  private calculateTechnicalDebtScore(content: string): number {
    const linesOfCode = content.split('\n').length;
    const complexity = this.calculateCyclomaticComplexity(content);
    const duplication = this.calculateDuplicationRatio(content);
    const commentRatio = this.calculateCommentRatio(content);

    // Technical debt calculation based on various factors
    const complexityDebt = Math.min(complexity * 0.5, 20);
    const duplicationDebt = duplication * 15;
    const commentDebt = commentRatio < 0.1 ? 10 : 0;

    return complexityDebt + duplicationDebt + commentDebt;
  }

  /**
   * Analyze dependencies
   */
  private async analyzeDependencies(content: string, filePath: string): Promise<{
    internal: string[];
    external: string[];
    unused: string[];
  }> {
    const imports = this.extractImports(content);
    const internal: string[] = [];
    const external: string[] = [];
    const unused: string[] = [];

    for (const importPath of imports) {
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        internal.push(importPath);
      } else {
        external.push(importPath);
      }
    }

    // Check for unused imports (simplified)
    const usedIdentifiers = this.extractUsedIdentifiers(content);
    for (const importPath of imports) {
      const importName = path.basename(importPath, path.extname(importPath));
      if (!usedIdentifiers.includes(importName)) {
        unused.push(importPath);
      }
    }

    return { internal, external, unused };
  }

  /**
   * Extract imports from content
   */
  private extractImports(content: string): string[] {
    const importRegex = /import\s+.*from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Extract used identifiers from content
   */
  private extractUsedIdentifiers(content: string): string[] {
    // Simplified identifier extraction
    const identifierRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const identifiers: string[] = [];
    let match;

    while ((match = identifierRegex.exec(content)) !== null) {
      identifiers.push(match[0]);
    }

    return Array.from(new Set(identifiers));
  }

  /**
   * Detect code patterns
   */
  private detectPatterns(content: string, extension: string): {
    detected: string[];
    violations: string[];
    opportunities: string[];
  } {
    const patterns = {
      detected: [] as string[],
      violations: [] as string[],
      opportunities: [] as string[]
    };

    // Detect common patterns
    if (content.includes('async/await')) patterns.detected.push('async-await');
    if (content.includes('Promise')) patterns.detected.push('promises');
    if (content.includes('class ')) patterns.detected.push('classes');
    if (content.includes('interface ')) patterns.detected.push('interfaces');

    // Detect violations
    if (content.includes('any')) patterns.violations.push('any-type-usage');
    if (content.includes('console.log')) patterns.violations.push('console-logging');
    if (content.includes('TODO') || content.includes('FIXME')) patterns.violations.push('todo-comments');

    // Detect opportunities
    if (content.includes('function ') && !content.includes('const ')) {
      patterns.opportunities.push('arrow-functions');
    }
    if (content.includes('var ')) patterns.opportunities.push('let-const');

    return patterns;
  }

  /**
   * Identify quality issues
   */
  private identifyIssues(metrics: CodeMetrics, complexity: any, patterns: any): QualityGate[] {
    const issues: QualityGate[] = [];

    if (metrics.cyclomaticComplexity > this.config.complexityThresholds.cyclomatic) {
      issues.push({
        type: 'complexity',
        severity: 'high',
        message: `Cyclomatic complexity ${metrics.cyclomaticComplexity} exceeds threshold ${this.config.complexityThresholds.cyclomatic}`,
        file: '',
        line: 0,
        rule: 'cyclomatic-complexity'
      });
    }

    if (metrics.maintainabilityIndex < this.config.complexityThresholds.maintainability) {
      issues.push({
        type: 'maintainability',
        severity: 'medium',
        message: `Maintainability index ${metrics.maintainabilityIndex} below threshold ${this.config.complexityThresholds.maintainability}`,
        file: '',
        line: 0,
        rule: 'maintainability-index'
      });
    }

    if (metrics.duplicationRatio > this.config.qualityGates.codeDuplication) {
      issues.push({
        type: 'duplication',
        severity: 'medium',
        message: `Code duplication ${(metrics.duplicationRatio * 100).toFixed(1)}% exceeds threshold ${(this.config.qualityGates.codeDuplication * 100).toFixed(1)}%`,
        file: '',
        line: 0,
        rule: 'code-duplication'
      });
    }

    return issues;
  }

  /**
   * Generate file-specific recommendations
   */
  private generateFileRecommendations(metrics: CodeMetrics, complexity: any, issues: QualityGate[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (metrics.cyclomaticComplexity > 10) {
      recommendations.push({
        type: 'refactoring',
        priority: 'high',
        title: 'Reduce cyclomatic complexity',
        description: 'Consider breaking down complex functions into smaller, more manageable pieces',
        action: 'Extract methods and simplify conditional logic',
        impact: 'high',
        effort: 'medium'
      });
    }

    if (metrics.commentRatio < 0.1) {
      recommendations.push({
        type: 'documentation',
        priority: 'medium',
        title: 'Add more documentation',
        description: 'Increase code documentation to improve maintainability',
        action: 'Add JSDoc comments and inline documentation',
        impact: 'medium',
        effort: 'low'
      });
    }

    if (metrics.duplicationRatio > 0.1) {
      recommendations.push({
        type: 'refactoring',
        priority: 'medium',
        title: 'Reduce code duplication',
        description: 'Extract common code into reusable functions or components',
        action: 'Create utility functions or shared components',
        impact: 'medium',
        effort: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Discover code files in project
   */
  private async discoverCodeFiles(projectPath: string): Promise<string[]> {
    const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs'];
    const files: string[] = [];

    const walkDir = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walkDir(fullPath);
        } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
          files.push(fullPath);
        }
      }
    };

    await walkDir(projectPath);
    return files;
  }

  /**
   * Analyze project architecture
   */
  private async analyzeArchitecture(projectPath: string, fileAnalyses: FileAnalysis[]): Promise<{
    layers: string[];
    dependencies: Record<string, string[]>;
    violations: string[];
  }> {
    // Simplified architecture analysis
    const layers = ['frontend', 'backend', 'services', 'database'];
    const dependencies: Record<string, string[]> = {};
    const violations: string[] = [];

    // Analyze dependency relationships
    for (const analysis of fileAnalyses) {
      const layer = this.determineLayer(analysis.path);
      dependencies[layer] = dependencies[layer] || [];
      dependencies[layer].push(...analysis.dependencies.external);
    }

    return { layers, dependencies, violations };
  }

  /**
   * Determine layer based on file path
   */
  private determineLayer(filePath: string): string {
    if (filePath.includes('frontend') || filePath.includes('src/components')) return 'frontend';
    if (filePath.includes('backend') || filePath.includes('src/routes')) return 'backend';
    if (filePath.includes('services') || filePath.includes('src/services')) return 'services';
    if (filePath.includes('database') || filePath.includes('src/db')) return 'database';
    return 'unknown';
  }

  /**
   * Calculate overall project metrics
   */
  private calculateOverallMetrics(fileAnalyses: FileAnalysis[]): CodeMetrics {
    const totals = fileAnalyses.reduce((acc, analysis) => ({
      linesOfCode: acc.linesOfCode + analysis.metrics.linesOfCode,
      totalLines: acc.totalLines + analysis.metrics.totalLines,
      functionCount: acc.functionCount + analysis.metrics.functionCount,
      classCount: acc.classCount + analysis.metrics.classCount,
      importCount: acc.importCount + analysis.metrics.importCount,
      exportCount: acc.exportCount + analysis.metrics.exportCount,
      cyclomaticComplexity: acc.cyclomaticComplexity + analysis.metrics.cyclomaticComplexity,
      cognitiveComplexity: acc.cognitiveComplexity + analysis.metrics.cognitiveComplexity,
      maintainabilityIndex: acc.maintainabilityIndex + analysis.metrics.maintainabilityIndex,
      duplicationRatio: acc.duplicationRatio + analysis.metrics.duplicationRatio,
      testCoverage: acc.testCoverage + analysis.metrics.testCoverage,
      technicalDebt: acc.technicalDebt + analysis.metrics.technicalDebt
    }), {
      linesOfCode: 0,
      totalLines: 0,
      functionCount: 0,
      classCount: 0,
      importCount: 0,
      exportCount: 0,
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0,
      maintainabilityIndex: 0,
      duplicationRatio: 0,
      testCoverage: 0,
      technicalDebt: 0
    });

    return {
      ...totals,
      commentRatio: totals.totalLines > 0 ? (totals.totalLines - totals.linesOfCode) / totals.totalLines : 0,
      maintainabilityIndex: fileAnalyses.length > 0 ? totals.maintainabilityIndex / fileAnalyses.length : 0,
      duplicationRatio: fileAnalyses.length > 0 ? totals.duplicationRatio / fileAnalyses.length : 0,
      testCoverage: fileAnalyses.length > 0 ? totals.testCoverage / fileAnalyses.length : 0
    };
  }

  /**
   * Assess overall quality
   */
  private assessQuality(fileAnalyses: FileAnalysis[]): {
    score: number;
    gates: QualityGate[];
    trends: Record<string, number>;
  } {
    const allIssues = fileAnalyses.flatMap(analysis => analysis.issues);
    const score = Math.max(0, 100 - (allIssues.length * 5));
    
    return {
      score,
      gates: allIssues,
      trends: {
        complexity: fileAnalyses.reduce((acc, a) => acc + a.complexity.cyclomatic, 0) / fileAnalyses.length,
        maintainability: fileAnalyses.reduce((acc, a) => acc + a.complexity.maintainability, 0) / fileAnalyses.length,
        duplication: fileAnalyses.reduce((acc, a) => acc + a.metrics.duplicationRatio, 0) / fileAnalyses.length
      }
    };
  }

  /**
   * Calculate technical debt
   */
  private calculateTechnicalDebt(fileAnalyses: FileAnalysis[]): {
    total: number;
    byCategory: Record<string, number>;
    priority: 'low' | 'medium' | 'high' | 'critical';
  } {
    const total = fileAnalyses.reduce((acc, analysis) => acc + analysis.metrics.technicalDebt, 0);
    
    const byCategory = {
      complexity: fileAnalyses.reduce((acc, analysis) => acc + analysis.complexity.cyclomatic, 0),
      duplication: fileAnalyses.reduce((acc, analysis) => acc + analysis.metrics.duplicationRatio * 100, 0),
      maintainability: fileAnalyses.reduce((acc, analysis) => acc + (100 - analysis.complexity.maintainability), 0)
    };

    const priority = total > 100 ? 'critical' : total > 50 ? 'high' : total > 20 ? 'medium' : 'low';

    return { total, byCategory, priority };
  }

  /**
   * Generate comprehensive recommendations
   */
  private generateRecommendations(
    fileAnalyses: FileAnalysis[],
    architecture: any,
    quality: any
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Add all file-specific recommendations
    fileAnalyses.forEach(analysis => {
      recommendations.push(...analysis.recommendations);
    });

    // Add architecture-level recommendations
    if (quality.score < 70) {
      recommendations.push({
        type: 'architecture',
        priority: 'high',
        title: 'Improve overall code quality',
        description: 'Focus on reducing complexity and improving maintainability',
        action: 'Implement code review process and refactoring sprints',
        impact: 'high',
        effort: 'high'
      });
    }

    return recommendations;
  }
}
