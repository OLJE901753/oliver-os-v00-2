#!/usr/bin/env node

/**
 * Cursor CI Integration Demo Script
 * Demonstrates the Cursor CI/CD integration system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { TestFailureAnalyzer } from './src/utils/test-failure-analyzer.js';
import { QuickFixCommandGenerator } from './src/utils/quick-fix-command-generator.js';
import { readFileSync, existsSync } from 'fs';

class CursorCIDemo {
  private analyzer: TestFailureAnalyzer;
  private commandGenerator: QuickFixCommandGenerator;

  constructor() {
    this.analyzer = new TestFailureAnalyzer();
    this.commandGenerator = new QuickFixCommandGenerator();
  }

  /**
   * Run comprehensive demo
   */
  async runDemo(): Promise<void> {
    console.log('🤖 Cursor CI/CD Integration Demo\n');
    console.log('This demo shows how Cursor can automatically detect test failures and provide quick fix commands.\n');

    // Demo 1: Test Failure Analysis
    await this.demoTestFailureAnalysis();

    // Demo 2: Quick Fix Generation
    await this.demoQuickFixGeneration();

    // Demo 3: Pattern Recognition
    await this.demoPatternRecognition();

    // Demo 4: Command Execution
    await this.demoCommandExecution();

    console.log('\n✅ Demo completed successfully!');
    console.log('\n📚 Next Steps:');
    console.log('1. Run: pnpm ci:enhanced');
    console.log('2. Check: cursor-integration-report.json');
    console.log('3. Use: pnpm ci:quick-fix');
    console.log('4. Review: CURSOR_CI_INTEGRATION.md');
  }

  /**
   * Demo test failure analysis
   */
  private async demoTestFailureAnalysis(): Promise<void> {
    console.log('🔍 Demo 1: Test Failure Analysis');
    console.log('=====================================');

    // Simulate test failure data
    const mockTestData = {
      numTotalTests: 10,
      numPassedTests: 7,
      numFailedTests: 3,
      numPendingTests: 0,
      numTodoTests: 0,
      duration: 5000,
      testResults: [
        {
          ancestorTitles: ['Smart Assistance Tests'],
          duration: 1000,
          failureMessages: ['TypeError: Cannot read property "name" of undefined'],
          fullName: 'Smart Assistance Tests should analyze code patterns',
          numPassingAsserts: 0,
          numFailingAsserts: 1,
          status: 'failed',
          title: 'should analyze code patterns',
          location: {
            column: 15,
            line: 42,
            path: 'src/tests/smart-assistance/algorithm-tests.test.ts'
          }
        },
        {
          ancestorTitles: ['Smart Assistance Tests'],
          duration: 2000,
          failureMessages: ['Timeout - Async callback was not invoked within the 5000ms timeout'],
          fullName: 'Smart Assistance Tests should handle large datasets',
          numPassingAsserts: 0,
          numFailingAsserts: 1,
          status: 'failed',
          title: 'should handle large datasets',
          location: {
            column: 8,
            line: 78,
            path: 'src/tests/smart-assistance/performance-tests.test.ts'
          }
        },
        {
          ancestorTitles: ['Smart Assistance Tests'],
          duration: 500,
          failureMessages: ['AssertionError: expected "low" to equal "high"'],
          fullName: 'Smart Assistance Tests should calculate quality score',
          numPassingAsserts: 0,
          numFailingAsserts: 1,
          status: 'failed',
          title: 'should calculate quality score',
          location: {
            column: 12,
            line: 156,
            path: 'src/tests/smart-assistance/quality-gates.test.ts'
          }
        }
      ]
    };

    const analyses = this.analyzer.analyzeTestResults(mockTestData, 'smart-assistance');
    
    console.log(`Found ${analyses.length} failure patterns:`);
    analyses.forEach((analysis, index) => {
      console.log(`\n${index + 1}. ${analysis.pattern.name}`);
      console.log(`   Description: ${analysis.pattern.description}`);
      console.log(`   Severity: ${analysis.pattern.severity}`);
      console.log(`   Category: ${analysis.pattern.category}`);
      console.log(`   Confidence: ${analysis.confidence}`);
      console.log(`   Files: ${analysis.files.join(', ')}`);
      console.log(`   Quick Fix: ${analysis.pattern.quickFix}`);
    });

    console.log('\n');
  }

  /**
   * Demo quick fix generation
   */
  private async demoQuickFixGeneration(): Promise<void> {
    console.log('⚡ Demo 2: Quick Fix Generation');
    console.log('================================');

    const mockFailureAnalysis = {
      type: 'Type Error',
      category: 'typecheck',
      testSuite: 'algorithms',
      files: ['src/tests/smart-assistance/algorithm-tests.test.ts'],
      lineNumbers: [42],
      description: 'TypeScript error in algorithm tests'
    };

    const quickFix = this.commandGenerator.generateQuickFix(mockFailureAnalysis);
    
    if (quickFix) {
      console.log('Generated Quick Fix Command:');
      console.log(`Name: ${quickFix.name}`);
      console.log(`Description: ${quickFix.description}`);
      console.log(`Command: ${quickFix.command}`);
      console.log(`Category: ${quickFix.category}`);
      console.log(`Severity: ${quickFix.severity}`);
      console.log(`Auto-fixable: ${quickFix.autoFixable}`);
      console.log(`Confidence: ${quickFix.confidence}`);
      console.log(`Prerequisites: ${quickFix.prerequisites.join(', ')}`);
      console.log(`Post Actions: ${quickFix.postActions.join(', ')}`);
    } else {
      console.log('No quick fix command generated');
    }

    console.log('\n');
  }

  /**
   * Demo pattern recognition
   */
  private async demoPatternRecognition(): Promise<void> {
    console.log('🎯 Demo 3: Pattern Recognition');
    console.log('================================');

    const patterns = this.analyzer.getPatternsByCategory('test');
    console.log(`Found ${patterns.length} test failure patterns:`);
    
    patterns.forEach((pattern, index) => {
      console.log(`\n${index + 1}. ${pattern.name}`);
      console.log(`   ID: ${pattern.id}`);
      console.log(`   Regex: ${pattern.regex.source}`);
      console.log(`   Severity: ${pattern.severity}`);
      console.log(`   Auto-fixable: ${pattern.autoFixable}`);
      console.log(`   Confidence: ${pattern.confidence}`);
    });

    console.log('\n');
  }

  /**
   * Demo command execution
   */
  private async demoCommandExecution(): Promise<void> {
    console.log('🚀 Demo 4: Command Execution');
    console.log('=============================');

    const commands = this.commandGenerator.getAutoFixableCommands();
    console.log(`Found ${commands.length} auto-fixable commands:`);
    
    commands.slice(0, 5).forEach((command, index) => {
      console.log(`\n${index + 1}. ${command.name}`);
      console.log(`   Command: ${command.command}`);
      console.log(`   Category: ${command.category}`);
      console.log(`   Severity: ${command.severity}`);
      console.log(`   Confidence: ${command.confidence}`);
    });

    console.log('\n');
  }

  /**
   * Show available commands
   */
  showAvailableCommands(): void {
    console.log('\n📋 Available Commands:');
    console.log('======================');
    console.log('pnpm ci:enhanced              # Run enhanced CI pipeline');
    console.log('pnpm ci:cursor-integration    # Generate Cursor integration report');
    console.log('pnpm ci:quick-fix             # Generate quick fix commands');
    console.log('pnpm ci:analyze-failures      # Analyze test failures');
    console.log('pnpm ci:analyze-coverage      # Analyze coverage results');
    console.log('pnpm ci:analyze-quality        # Analyze quality results');
    console.log('pnpm ci:analyze-security       # Analyze security results');
    console.log('pnpm ci:analyze-build          # Analyze build results');
    console.log('pnpm ci:report:lint-typecheck # Generate lint/typecheck report');
    console.log('pnpm ci:report:test-analysis  # Generate test analysis report');
    console.log('pnpm ci:report:coverage-analysis # Generate coverage analysis report');
    console.log('pnpm ci:report:quality-analysis # Generate quality analysis report');
    console.log('pnpm ci:report:security-analysis # Generate security analysis report');
    console.log('pnpm ci:report:build-analysis # Generate build analysis report');
  }

  /**
   * Show integration benefits
   */
  showBenefits(): void {
    console.log('\n🎯 Integration Benefits:');
    console.log('=========================');
    console.log('✅ No more copy-paste operations');
    console.log('✅ Automatic test failure detection');
    console.log('✅ Intelligent pattern recognition');
    console.log('✅ Quick fix command generation');
    console.log('✅ Real-time CI/CD integration');
    console.log('✅ PR comment automation');
    console.log('✅ Comprehensive reporting');
    console.log('✅ BMAD methodology compliance');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const demo = new CursorCIDemo();

  try {
    switch (command) {
      case 'demo':
        await demo.runDemo();
        break;
      case 'commands':
        demo.showAvailableCommands();
        break;
      case 'benefits':
        demo.showBenefits();
        break;
      default:
        console.log(`
🤖 Cursor CI/CD Integration Demo

Usage: node cursor-ci-demo.js <command>

Commands:
  demo        Run comprehensive demo
  commands    Show available commands
  benefits    Show integration benefits

Examples:
  node cursor-ci-demo.js demo
  node cursor-ci-demo.js commands
  node cursor-ci-demo.js benefits
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CursorCIDemo };
