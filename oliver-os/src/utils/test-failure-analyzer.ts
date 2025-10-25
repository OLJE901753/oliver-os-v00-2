/**
 * Test Failure Analyzer with Pattern Recognition
 * Advanced analysis of test failures with intelligent pattern matching
 * Following BMAD principles: Break, Map, Automate, Document
 */

// Removed unused imports
// Removed unused imports and variables

interface TestFailurePattern {
  id: string;
  name: string;
  description: string;
  regex: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'test' | 'coverage' | 'quality' | 'security' | 'build' | 'lint' | 'typecheck';
  quickFix: string;
  suggestions: string[];
  autoFixable: boolean;
  confidence: number;
}

interface FailureAnalysis {
  pattern: TestFailurePattern;
  matches: string[];
  files: string[];
  lineNumbers: number[];
  context: string;
  confidence: number;
  autoFix: string | null;
}

interface TestFailureAnalyzerConfig {
  patterns: TestFailurePattern[];
  thresholds: {
    coverage: number;
    quality: number;
    security: number;
  };
  autoFixEnabled: boolean;
  confidenceThreshold: number;
}

class TestFailureAnalyzer {
  private config: TestFailureAnalyzerConfig;
  private patterns: TestFailurePattern[];

  constructor() {
    this.patterns = this.initializePatterns();
    this.config = {
      patterns: this.patterns,
      thresholds: {
        coverage: 80,
        quality: 80,
        security: 90
      },
      autoFixEnabled: true,
      confidenceThreshold: 0.7
    };
  }

  /**
   * Initialize failure patterns
   */
  private initializePatterns(): TestFailurePattern[] {
    return [
      // TypeScript Errors
      {
        id: 'ts-error-undefined',
        name: 'TypeScript Undefined Variable',
        description: 'Variable is used before being declared or is undefined',
        regex: /error TS\d+: Cannot find name '(\w+)'/g,
        severity: 'high',
        category: 'typecheck',
        quickFix: 'pnpm type-check && pnpm lint:fix',
        suggestions: [
          'Check for typos in variable names',
          'Verify imports and exports',
          'Ensure variables are declared before use'
        ],
        autoFixable: false,
        confidence: 0.9
      },
      {
        id: 'ts-error-type',
        name: 'TypeScript Type Error',
        description: 'Type mismatch or incorrect type usage',
        regex: /error TS\d+: Type '(\w+)' is not assignable to type '(\w+)'/g,
        severity: 'high',
        category: 'typecheck',
        quickFix: 'pnpm type-check',
        suggestions: [
          'Check type definitions',
          'Verify function signatures',
          'Update type annotations'
        ],
        autoFixable: false,
        confidence: 0.8
      },

      // Test Failures
      {
        id: 'test-timeout',
        name: 'Test Timeout',
        description: 'Test exceeded maximum execution time',
        regex: /Timeout - Async callback was not invoked within the (\d+)ms timeout/g,
        severity: 'medium',
        category: 'test',
        quickFix: 'pnpm test:smart --timeout=60000',
        suggestions: [
          'Increase test timeout',
          'Check for infinite loops',
          'Optimize test performance',
          'Use proper async/await patterns'
        ],
        autoFixable: true,
        confidence: 0.9
      },
      {
        id: 'test-assertion',
        name: 'Test Assertion Failure',
        description: 'Test assertion failed',
        regex: /AssertionError: (.+)/g,
        severity: 'medium',
        category: 'test',
        quickFix: 'pnpm test:smart --reporter=verbose',
        suggestions: [
          'Review test expectations',
          'Check test data and mock values',
          'Verify test setup and teardown'
        ],
        autoFixable: false,
        confidence: 0.8
      },
      {
        id: 'test-mock',
        name: 'Test Mock Failure',
        description: 'Test mock or spy failed',
        regex: /Expected (\d+) calls, but was called (\d+) times/g,
        severity: 'medium',
        category: 'test',
        quickFix: 'pnpm test:smart --reporter=verbose',
        suggestions: [
          'Check mock setup',
          'Verify function calls',
          'Update mock expectations'
        ],
        autoFixable: false,
        confidence: 0.7
      },

      // Coverage Issues
      {
        id: 'coverage-low',
        name: 'Low Test Coverage',
        description: 'Test coverage below threshold',
        regex: /Coverage: (\d+)% \(threshold: (\d+)%\)/g,
        severity: 'medium',
        category: 'coverage',
        quickFix: 'pnpm test:smart:coverage',
        suggestions: [
          'Add missing test cases',
          'Improve existing tests',
          'Remove unused code'
        ],
        autoFixable: false,
        confidence: 0.9
      },
      {
        id: 'coverage-branch',
        name: 'Branch Coverage Low',
        description: 'Branch coverage below threshold',
        regex: /Branches: (\d+)% \(threshold: (\d+)%\)/g,
        severity: 'medium',
        category: 'coverage',
        quickFix: 'pnpm test:smart:coverage',
        suggestions: [
          'Add tests for conditional branches',
          'Test edge cases',
          'Improve test scenarios'
        ],
        autoFixable: false,
        confidence: 0.8
      },

      // Quality Issues
      {
        id: 'quality-complexity',
        name: 'High Cyclomatic Complexity',
        description: 'Function complexity exceeds threshold',
        regex: /Complexity: (\d+) \(threshold: (\d+)\)/g,
        severity: 'medium',
        category: 'quality',
        quickFix: 'pnpm lint:fix',
        suggestions: [
          'Refactor complex functions',
          'Extract smaller functions',
          'Reduce conditional logic'
        ],
        autoFixable: true,
        confidence: 0.8
      },
      {
        id: 'quality-maintainability',
        name: 'Low Maintainability Score',
        description: 'Code maintainability below threshold',
        regex: /Maintainability: (\d+) \(threshold: (\d+)\)/g,
        severity: 'medium',
        category: 'quality',
        quickFix: 'pnpm lint:fix && pnpm type-check',
        suggestions: [
          'Improve code documentation',
          'Reduce complexity',
          'Follow coding standards'
        ],
        autoFixable: false,
        confidence: 0.7
      },

      // Security Issues
      {
        id: 'security-vulnerability',
        name: 'Security Vulnerability',
        description: 'Security vulnerability detected',
        regex: /vulnerability found in (\w+)@(\d+\.\d+\.\d+)/g,
        severity: 'critical',
        category: 'security',
        quickFix: 'pnpm audit --fix',
        suggestions: [
          'Update vulnerable dependencies',
          'Review security implications',
          'Apply security patches'
        ],
        autoFixable: true,
        confidence: 0.9
      },
      {
        id: 'security-audit',
        name: 'Security Audit Failure',
        description: 'Security audit failed',
        regex: /found (\d+) vulnerabilities/g,
        severity: 'high',
        category: 'security',
        quickFix: 'pnpm audit --audit-level moderate',
        suggestions: [
          'Review all vulnerabilities',
          'Update dependencies',
          'Apply security fixes'
        ],
        autoFixable: false,
        confidence: 0.8
      },

      // Build Issues
      {
        id: 'build-compilation',
        name: 'Build Compilation Error',
        description: 'Build compilation failed',
        regex: /error TS\d+: (.+)/g,
        severity: 'high',
        category: 'build',
        quickFix: 'pnpm install && pnpm build',
        suggestions: [
          'Fix compilation errors',
          'Check dependencies',
          'Verify build configuration'
        ],
        autoFixable: false,
        confidence: 0.9
      },
      {
        id: 'build-dependency',
        name: 'Build Dependency Error',
        description: 'Build dependency issue',
        regex: /Cannot resolve module '(\w+)'/g,
        severity: 'high',
        category: 'build',
        quickFix: 'pnpm install',
        suggestions: [
          'Install missing dependencies',
          'Check package.json',
          'Verify import paths'
        ],
        autoFixable: true,
        confidence: 0.8
      },

      // Lint Issues
      {
        id: 'lint-error',
        name: 'ESLint Error',
        description: 'ESLint error detected',
        regex: /error\s+(\w+)\s+(.+)/g,
        severity: 'medium',
        category: 'lint',
        quickFix: 'pnpm lint:fix',
        suggestions: [
          'Fix ESLint errors',
          'Follow coding standards',
          'Use automatic fixes'
        ],
        autoFixable: true,
        confidence: 0.8
      },
      {
        id: 'lint-warning',
        name: 'ESLint Warning',
        description: 'ESLint warning detected',
        regex: /warning\s+(\w+)\s+(.+)/g,
        severity: 'low',
        category: 'lint',
        quickFix: 'pnpm lint:fix',
        suggestions: [
          'Address ESLint warnings',
          'Improve code quality',
          'Follow best practices'
        ],
        autoFixable: true,
        confidence: 0.7
      }
    ];
  }

  /**
   * Analyze test results and identify failure patterns
   */
  analyzeTestResults(testData: any, testSuite: string): FailureAnalysis[] {
    const analyses: FailureAnalysis[] = [];
    const testOutput = this.extractTestOutput(testData);

    this.patterns.forEach(pattern => {
      const matches = this.findPatternMatches(pattern, testOutput);
      if (matches.length > 0) {
        const analysis = this.createFailureAnalysis(pattern, matches, testData, testSuite);
        if (analysis.confidence >= this.config.confidenceThreshold) {
          analyses.push(analysis);
        }
      }
    });

    return analyses.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract test output from test data
   */
  private extractTestOutput(testData: any): string {
    let output = '';

    if (testData.testResults) {
      testData.testResults.forEach((test: any) => {
        if (test.failureMessages) {
          output += `${test.failureMessages.join('\n')  }\n`;
        }
        if (test.status === 'failed') {
          output += `Test failed: ${test.fullName}\n`;
        }
      });
    }

    if (testData.failureMessages) {
      output += `${testData.failureMessages.join('\n')  }\n`;
    }

    return output;
  }

  /**
   * Find pattern matches in test output
   */
  private findPatternMatches(pattern: TestFailurePattern, output: string): string[] {
    const matches: string[] = [];
    let match;

    while ((match = pattern.regex.exec(output)) !== null) {
      matches.push(match[0]);
    }

    return matches;
  }

  /**
   * Create failure analysis from pattern matches
   */
  private createFailureAnalysis(
    pattern: TestFailurePattern,
    matches: string[],
    testData: any,
    _testSuite: string
  ): FailureAnalysis {
    const files = this.extractFiles(testData);
    const lineNumbers = this.extractLineNumbers(testData);
    const context = this.extractContext(testData);

    return {
      pattern,
      matches,
      files,
      lineNumbers,
      context,
      confidence: pattern.confidence,
      autoFix: pattern.autoFixable ? pattern.quickFix : null
    };
  }

  /**
   * Extract files from test data
   */
  private extractFiles(testData: any): string[] {
    const files: string[] = [];

    if (testData.testResults) {
      testData.testResults.forEach((test: any) => {
        if (test.location && test.location.path) {
          files.push(test.location.path);
        }
      });
    }

    return [...new Set(files)];
  }

  /**
   * Extract line numbers from test data
   */
  private extractLineNumbers(testData: any): number[] {
    const lineNumbers: number[] = [];

    if (testData.testResults) {
      testData.testResults.forEach((test: any) => {
        if (test.location && test.location.line) {
          lineNumbers.push(test.location.line);
        }
      });
    }

    return [...new Set(lineNumbers)];
  }

  /**
   * Extract context from test data
   */
  private extractContext(testData: any): string {
    let context = '';

    if (testData.testResults) {
      testData.testResults.forEach((test: any) => {
        if (test.failureMessages) {
          context += `${test.failureMessages.join('\n')  }\n`;
        }
      });
    }

    return context.trim();
  }

  /**
   * Generate quick fix commands based on analysis
   */
  generateQuickFixCommands(analyses: FailureAnalysis[]): string[] {
    const commands: string[] = [];

    analyses.forEach(analysis => {
      if (analysis.autoFix) {
        commands.push(analysis.autoFix);
      } else {
        commands.push(analysis.pattern.quickFix);
      }
    });

    return [...new Set(commands)];
  }

  /**
   * Generate detailed recommendations
   */
  generateRecommendations(analyses: FailureAnalysis[]): string[] {
    const recommendations: string[] = [];

    analyses.forEach(analysis => {
      analysis.pattern.suggestions.forEach(suggestion => {
        recommendations.push(suggestion);
      });
    });

    return [...new Set(recommendations)];
  }

  /**
   * Analyze coverage results
   */
  analyzeCoverageResults(coverageData: any): FailureAnalysis[] {
    const analyses: FailureAnalysis[] = [];
    const coverageOutput = JSON.stringify(coverageData);

    // Check for low coverage patterns
    const lowCoveragePattern = this.patterns.find(p => p.id === 'coverage-low');
    if (lowCoveragePattern) {
      const matches = this.findPatternMatches(lowCoveragePattern, coverageOutput);
      if (matches.length > 0) {
        const analysis = this.createFailureAnalysis(lowCoveragePattern, matches, coverageData, 'coverage');
        analyses.push(analysis);
      }
    }

    return analyses;
  }

  /**
   * Analyze quality results
   */
  analyzeQualityResults(qualityData: any): FailureAnalysis[] {
    const analyses: FailureAnalysis[] = [];
    const qualityOutput = JSON.stringify(qualityData);

    // Check for quality issues
    const qualityPatterns = this.patterns.filter(p => p.category === 'quality');
    qualityPatterns.forEach(pattern => {
      const matches = this.findPatternMatches(pattern, qualityOutput);
      if (matches.length > 0) {
        const analysis = this.createFailureAnalysis(pattern, matches, qualityData, 'quality');
        analyses.push(analysis);
      }
    });

    return analyses;
  }

  /**
   * Analyze security results
   */
  analyzeSecurityResults(securityData: any): FailureAnalysis[] {
    const analyses: FailureAnalysis[] = [];
    const securityOutput = JSON.stringify(securityData);

    // Check for security issues
    const securityPatterns = this.patterns.filter(p => p.category === 'security');
    securityPatterns.forEach(pattern => {
      const matches = this.findPatternMatches(pattern, securityOutput);
      if (matches.length > 0) {
        const analysis = this.createFailureAnalysis(pattern, matches, securityData, 'security');
        analyses.push(analysis);
      }
    });

    return analyses;
  }

  /**
   * Analyze build results
   */
  analyzeBuildResults(buildOutput: string, healthCheck: any): FailureAnalysis[] {
    const analyses: FailureAnalysis[] = [];

    // Check for build issues
    const buildPatterns = this.patterns.filter(p => p.category === 'build');
    buildPatterns.forEach(pattern => {
      const matches = this.findPatternMatches(pattern, buildOutput);
      if (matches.length > 0) {
        const analysis = this.createFailureAnalysis(pattern, matches, { buildOutput, healthCheck }, 'build');
        analyses.push(analysis);
      }
    });

    return analyses;
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): TestFailurePattern | undefined {
    return this.patterns.find(p => p.id === id);
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(category: string): TestFailurePattern[] {
    return this.patterns.filter(p => p.category === category);
  }

  /**
   * Get patterns by severity
   */
  getPatternsBySeverity(severity: string): TestFailurePattern[] {
    return this.patterns.filter(p => p.severity === severity);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TestFailureAnalyzerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TestFailureAnalyzerConfig {
    return { ...this.config };
  }
}

export { TestFailureAnalyzer };
export type { TestFailurePattern, FailureAnalysis, TestFailureAnalyzerConfig };
