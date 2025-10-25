/**
 * Quick Fix Command Generator
 * Generates automated fix commands for common test failures
 * Following BMAD principles: Break, Map, Automate, Document
 */

// Removed unused imports
// Removed unused imports and variables

interface QuickFixCommand {
  id: string;
  name: string;
  description: string;
  command: string;
  category: 'test' | 'coverage' | 'quality' | 'security' | 'build' | 'lint' | 'typecheck';
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFixable: boolean;
  prerequisites: string[];
  postActions: string[];
  examples: string[];
  confidence: number;
}

interface QuickFixContext {
  testSuite: string;
  failureType: string;
  files: string[];
  lineNumbers: number[];
  errorMessage: string;
  environment: 'development' | 'staging' | 'production';
}

interface QuickFixResult {
  command: QuickFixCommand;
  context: QuickFixContext;
  success: boolean;
  output: string;
  duration: number;
  timestamp: string;
}

class QuickFixCommandGenerator {
  private commands: QuickFixCommand[];
  private context: QuickFixContext | null = null;

  constructor() {
    this.commands = this.initializeCommands();
  }

  /**
   * Initialize quick fix commands
   */
  private initializeCommands(): QuickFixCommand[] {
    return [
      // Test Commands
      {
        id: 'test-rerun',
        name: 'Rerun Failed Tests',
        description: 'Rerun the failed test suite with verbose output',
        command: 'pnpm test:smart --reporter=verbose',
        category: 'test',
        severity: 'medium',
        autoFixable: false,
        prerequisites: ['pnpm install'],
        postActions: ['Check test output for specific failures'],
        examples: [
          'pnpm test:algorithms --reporter=verbose',
          'pnpm test:integration --reporter=verbose',
          'pnpm test:performance --reporter=verbose'
        ],
        confidence: 0.8
      },
      {
        id: 'test-timeout-increase',
        name: 'Increase Test Timeout',
        description: 'Increase test timeout for slow tests',
        command: 'pnpm test:smart --timeout=60000',
        category: 'test',
        severity: 'medium',
        autoFixable: true,
        prerequisites: [],
        postActions: ['Monitor test performance'],
        examples: [
          'pnpm test:smart --timeout=120000',
          'pnpm test:integration --timeout=60000'
        ],
        confidence: 0.9
      },
      {
        id: 'test-watch-mode',
        name: 'Run Tests in Watch Mode',
        description: 'Run tests in watch mode for development',
        command: 'pnpm test:smart:watch',
        category: 'test',
        severity: 'low',
        autoFixable: false,
        prerequisites: [],
        postActions: ['Tests will rerun on file changes'],
        examples: [
          'pnpm test:smart:watch',
          'pnpm test:algorithms --watch'
        ],
        confidence: 0.7
      },

      // Coverage Commands
      {
        id: 'coverage-generate',
        name: 'Generate Coverage Report',
        description: 'Generate detailed coverage report',
        command: 'pnpm test:smart:coverage',
        category: 'coverage',
        severity: 'medium',
        autoFixable: false,
        prerequisites: ['pnpm install'],
        postActions: ['Review coverage report', 'Add missing tests'],
        examples: [
          'pnpm test:smart:coverage',
          'pnpm test:algorithms --coverage'
        ],
        confidence: 0.8
      },
      {
        id: 'coverage-ui',
        name: 'Open Coverage UI',
        description: 'Open coverage report in browser',
        command: 'pnpm test:smart:ui',
        category: 'coverage',
        severity: 'low',
        autoFixable: false,
        prerequisites: ['pnpm test:smart:coverage'],
        postActions: ['Review coverage in browser'],
        examples: [
          'pnpm test:smart:ui',
          'pnpm test:coverage --ui'
        ],
        confidence: 0.7
      },

      // Quality Commands
      {
        id: 'quality-gates',
        name: 'Run Quality Gates',
        description: 'Run quality gate tests',
        command: 'pnpm test:quality',
        category: 'quality',
        severity: 'medium',
        autoFixable: false,
        prerequisites: ['pnpm install'],
        postActions: ['Review quality metrics'],
        examples: [
          'pnpm test:quality',
          'pnpm test:smart:quality'
        ],
        confidence: 0.8
      },
      {
        id: 'quality-lint-fix',
        name: 'Fix Linting Issues',
        description: 'Automatically fix linting issues',
        command: 'pnpm lint:fix',
        category: 'quality',
        severity: 'medium',
        autoFixable: true,
        prerequisites: [],
        postActions: ['Review fixed code', 'Run tests'],
        examples: [
          'pnpm lint:fix',
          'pnpm lint --fix'
        ],
        confidence: 0.9
      },

      // Security Commands
      {
        id: 'security-audit',
        name: 'Run Security Audit',
        description: 'Run security audit and fix vulnerabilities',
        command: 'pnpm audit --fix',
        category: 'security',
        severity: 'high',
        autoFixable: true,
        prerequisites: [],
        postActions: ['Review security fixes', 'Test application'],
        examples: [
          'pnpm audit --fix',
          'pnpm audit --audit-level moderate'
        ],
        confidence: 0.9
      },
      {
        id: 'security-update',
        name: 'Update Dependencies',
        description: 'Update all dependencies to latest versions',
        command: 'pnpm update',
        category: 'security',
        severity: 'medium',
        autoFixable: true,
        prerequisites: [],
        postActions: ['Run tests', 'Check for breaking changes'],
        examples: [
          'pnpm update',
          'pnpm update --latest'
        ],
        confidence: 0.7
      },

      // Build Commands
      {
        id: 'build-clean',
        name: 'Clean and Rebuild',
        description: 'Clean build artifacts and rebuild',
        command: 'pnpm clean; pnpm build',
        category: 'build',
        severity: 'high',
        autoFixable: true,
        prerequisites: ['pnpm install'],
        postActions: ['Verify build success'],
        examples: [
          'pnpm clean; pnpm build',
          'pnpm build:dev'
        ],
        confidence: 0.9
      },
      {
        id: 'build-type-check',
        name: 'Fix TypeScript Errors',
        description: 'Run type check and fix errors',
        command: 'pnpm type-check',
        category: 'build',
        severity: 'high',
        autoFixable: false,
        prerequisites: [],
        postActions: ['Fix type errors manually'],
        examples: [
          'pnpm type-check',
          'pnpm type-check:strict'
        ],
        confidence: 0.8
      },

      // Lint Commands
      {
        id: 'lint-fix-all',
        name: 'Fix All Linting Issues',
        description: 'Fix all linting issues automatically',
        command: 'pnpm lint:fix; pnpm type-check',
        category: 'lint',
        severity: 'medium',
        autoFixable: true,
        prerequisites: [],
        postActions: ['Review fixed code', 'Run tests'],
        examples: [
          'pnpm lint:fix; pnpm type-check',
          'pnpm lint --fix'
        ],
        confidence: 0.9
      },
      {
        id: 'lint-strict',
        name: 'Run Strict Linting',
        description: 'Run strict linting with all rules',
        command: 'pnpm lint --max-warnings=0',
        category: 'lint',
        severity: 'medium',
        autoFixable: false,
        prerequisites: [],
        postActions: ['Fix remaining issues'],
        examples: [
          'pnpm lint --max-warnings=0',
          'pnpm lint:strict'
        ],
        confidence: 0.8
      },

      // TypeCheck Commands
      {
        id: 'typecheck-strict',
        name: 'Run Strict Type Check',
        description: 'Run strict TypeScript type checking',
        command: 'pnpm type-check:strict',
        category: 'typecheck',
        severity: 'high',
        autoFixable: false,
        prerequisites: [],
        postActions: ['Fix type errors'],
        examples: [
          'pnpm type-check:strict',
          'pnpm type-check --noEmit'
        ],
        confidence: 0.9
      },
      {
        id: 'typecheck-dev',
        name: 'Run Development Type Check',
        description: 'Run TypeScript type check for development',
        command: 'pnpm type-check:dev',
        category: 'typecheck',
        severity: 'medium',
        autoFixable: false,
        prerequisites: [],
        postActions: ['Fix type errors'],
        examples: [
          'pnpm type-check:dev',
          'pnpm type-check --project tsconfig.dev.json'
        ],
        confidence: 0.8
      },

      // Comprehensive Commands
      {
        id: 'full-ci',
        name: 'Run Full CI Pipeline',
        description: 'Run complete CI pipeline locally',
        command: 'pnpm ci:full',
        category: 'test',
        severity: 'medium',
        autoFixable: false,
        prerequisites: ['pnpm install'],
        postActions: ['Review all results'],
        examples: [
          'pnpm ci:full',
          'pnpm ci:validate; pnpm ci:test; pnpm ci:coverage'
        ],
        confidence: 0.8
      },
      {
        id: 'smart-assistance',
        name: 'Run Smart Assistance Tests',
        description: 'Run all smart assistance test suites',
        command: 'pnpm test:smart:all',
        category: 'test',
        severity: 'medium',
        autoFixable: false,
        prerequisites: ['pnpm install'],
        postActions: ['Review test results'],
        examples: [
          'pnpm test:smart:all',
          'pnpm test:smart:coverage'
        ],
        confidence: 0.8
      }
    ];
  }

  /**
   * Generate quick fix command based on failure analysis
   */
  generateQuickFix(failureAnalysis: any): QuickFixCommand | null {
    const context = this.extractContext(failureAnalysis);
    this.context = context;

    // Find matching command based on failure type
    const matchingCommand = this.findMatchingCommand(failureAnalysis);
    
    if (matchingCommand) {
      return this.customizeCommand(matchingCommand, context);
    }

    return null;
  }

  /**
   * Extract context from failure analysis
   */
  private extractContext(failureAnalysis: any): QuickFixContext {
    return {
      testSuite: failureAnalysis.testSuite || 'unknown',
      failureType: failureAnalysis.type || 'unknown',
      files: failureAnalysis.files || [],
      lineNumbers: failureAnalysis.lineNumbers || [],
      errorMessage: failureAnalysis.description || '',
      environment: 'development'
    };
  }

  /**
   * Find matching command based on failure analysis
   */
  private findMatchingCommand(failureAnalysis: any): QuickFixCommand | null {
    const failureType = failureAnalysis.type?.toLowerCase() || '';
    const category = failureAnalysis.category || 'test';

    // Direct matches
    const directMatch = this.commands.find(cmd => 
      cmd.name.toLowerCase().includes(failureType) ||
      cmd.description.toLowerCase().includes(failureType)
    );

    if (directMatch) {
      return directMatch;
    }

    // Category matches
    const categoryMatch = this.commands.find(cmd => 
      cmd.category === category && cmd.autoFixable
    );

    if (categoryMatch) {
      return categoryMatch;
    }

    // Fallback to general commands
    if (category === 'test') {
      return this.commands.find(cmd => cmd.id === 'test-rerun') || null;
    }

    if (category === 'coverage') {
      return this.commands.find(cmd => cmd.id === 'coverage-generate') || null;
    }

    if (category === 'quality') {
      return this.commands.find(cmd => cmd.id === 'quality-lint-fix') || null;
    }

    if (category === 'security') {
      return this.commands.find(cmd => cmd.id === 'security-audit') || null;
    }

    if (category === 'build') {
      return this.commands.find(cmd => cmd.id === 'build-clean') || null;
    }

    if (category === 'lint') {
      return this.commands.find(cmd => cmd.id === 'lint-fix-all') || null;
    }

    if (category === 'typecheck') {
      return this.commands.find(cmd => cmd.id === 'typecheck-strict') || null;
    }

    return null;
  }

  /**
   * Customize command based on context
   */
  private customizeCommand(command: QuickFixCommand, context: QuickFixContext): QuickFixCommand {
    const customizedCommand = { ...command };

    // Customize based on test suite
    if (context.testSuite !== 'unknown') {
      customizedCommand.command = customizedCommand.command.replace(
        'test:smart',
        `test:${context.testSuite}`
      );
    }

    // Customize based on files
    if (context.files.length > 0) {
      const filePattern = context.files[0];
      if (filePattern && filePattern.includes('test')) {
        customizedCommand.command += ` --testPathPattern="${filePattern}"`;
      }
    }

    // Customize based on severity
    if (context.failureType.includes('timeout')) {
      customizedCommand.command += ' --timeout=60000';
    }

    return customizedCommand;
  }

  /**
   * Execute quick fix command
   */
  async executeQuickFix(command: QuickFixCommand): Promise<QuickFixResult> {
    const startTime = Date.now();
    
    try {
      // Check prerequisites
      for (const prereq of command.prerequisites) {
        await this.executeCommand(prereq);
      }

      // Execute main command
      const output = await this.executeCommand(command.command);

      // Execute post actions
      for (const postAction of command.postActions) {
        console.log(`Post-action: ${postAction}`);
      }

      const duration = Date.now() - startTime;

      return {
        command,
        context: this.context!,
        success: true,
        output,
        duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        command,
        context: this.context!,
        success: false,
        output: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute a command
   */
  private async executeCommand(command: string): Promise<string> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(command);
      return stdout + stderr;
    } catch (error) {
      throw new Error(`Command failed: ${command}\n${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all available commands
   */
  getAllCommands(): QuickFixCommand[] {
    return [...this.commands];
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: string): QuickFixCommand[] {
    return this.commands.filter(cmd => cmd.category === category);
  }

  /**
   * Get commands by severity
   */
  getCommandsBySeverity(severity: string): QuickFixCommand[] {
    return this.commands.filter(cmd => cmd.severity === severity);
  }

  /**
   * Get auto-fixable commands
   */
  getAutoFixableCommands(): QuickFixCommand[] {
    return this.commands.filter(cmd => cmd.autoFixable);
  }

  /**
   * Generate command suggestions based on failure patterns
   */
  generateSuggestions(failurePatterns: string[]): QuickFixCommand[] {
    const suggestions: QuickFixCommand[] = [];

    failurePatterns.forEach(pattern => {
      const matchingCommands = this.commands.filter(cmd =>
        cmd.name.toLowerCase().includes(pattern.toLowerCase()) ||
        cmd.description.toLowerCase().includes(pattern.toLowerCase())
      );

      suggestions.push(...matchingCommands);
    });

    return [...new Set(suggestions)];
  }

  /**
   * Validate command before execution
   */
  validateCommand(command: QuickFixCommand): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.command) {
      errors.push('Command is empty');
    }

    if (!command.prerequisites) {
      errors.push('Prerequisites not defined');
    }

    if (!command.postActions) {
      errors.push('Post actions not defined');
    }

    if (command.confidence < 0.5) {
      errors.push('Command confidence is too low');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate command documentation
   */
  generateDocumentation(): string {
    let doc = '# Quick Fix Commands\n\n';
    doc += 'This document contains all available quick fix commands for the CI/CD pipeline.\n\n';

    const categories = ['test', 'coverage', 'quality', 'security', 'build', 'lint', 'typecheck'];
    
    categories.forEach(category => {
      const categoryCommands = this.getCommandsByCategory(category);
      if (categoryCommands.length > 0) {
        doc += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Commands\n\n`;
        
        categoryCommands.forEach(cmd => {
          doc += `### ${cmd.name}\n\n`;
          doc += `**Description:** ${cmd.description}\n\n`;
          doc += `**Command:** \`${cmd.command}\`\n\n`;
          doc += `**Severity:** ${cmd.severity}\n\n`;
          doc += `**Auto-fixable:** ${cmd.autoFixable ? 'Yes' : 'No'}\n\n`;
          doc += `**Confidence:** ${cmd.confidence}\n\n`;
          
          if (cmd.examples.length > 0) {
            doc += `**Examples:**\n`;
            cmd.examples.forEach(example => {
              doc += `- \`${example}\`\n`;
            });
            doc += '\n';
          }
        });
      }
    });

    return doc;
  }
}

export { QuickFixCommandGenerator };
export type { QuickFixCommand, QuickFixContext, QuickFixResult };
