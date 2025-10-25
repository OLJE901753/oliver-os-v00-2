#!/usr/bin/env node

/**
 * Cursor Test Integration Script
 * Provides automatic test failure detection and quick fix commands for Cursor AI
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestResult {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  numTodoTests: number;
  duration: number;
  testResults: TestCase[];
}

interface TestCase {
  ancestorTitles: string[];
  duration: number;
  failureMessages: string[];
  fullName: string;
  numPassingAsserts: number;
  numFailingAsserts: number;
  status: 'passed' | 'failed' | 'pending' | 'todo';
  title: string;
  location: {
    column: number;
    line: number;
    path: string;
  };
}

interface FailureAnalysis {
  type: string;
  description: string;
  quickFix: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'test' | 'coverage' | 'quality' | 'security' | 'build' | 'lint' | 'typecheck';
  files: string[];
  suggestions: string[];
}

interface CursorIntegrationReport {
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    coverage: number;
    qualityScore: number;
    securityScore: number;
    buildStatus: 'success' | 'failed';
    overallStatus: 'success' | 'failed' | 'partial';
  };
  failures: FailureAnalysis[];
  quickFixes: string[];
  recommendations: string[];
  timestamp: string;
}

class CursorTestIntegration {
  private report: CursorIntegrationReport;

  constructor() {
    this.report = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        coverage: 0,
        qualityScore: 0,
        securityScore: 0,
        buildStatus: 'success',
        overallStatus: 'success'
      },
      failures: [],
      quickFixes: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze test failures and generate quick fix suggestions
   */
  async analyzeFailures(options: {
    testSuite: string;
    testResults: string;
    output: string;
  }): Promise<void> {
    console.log(`🔍 Analyzing test failures for ${options.testSuite}...`);

    try {
      const testData = JSON.parse(readFileSync(options.testResults, 'utf8'));
      const failures = this.analyzeTestResults(testData, options.testSuite);
      
      const analysis = {
        testSuite: options.testSuite,
        failures,
        quickFixes: this.generateQuickFixes(failures),
        timestamp: new Date().toISOString()
      };

      writeFileSync(options.output, JSON.stringify(analysis, null, 2));
      console.log(`✅ Analysis complete: ${options.output}`);
    } catch (error) {
      console.error(`❌ Failed to analyze test failures:`, error);
      throw error;
    }
  }

  /**
   * Analyze coverage results and generate improvement suggestions
   */
  async analyzeCoverage(options: {
    coverageResults: string;
    output: string;
  }): Promise<void> {
    console.log('📊 Analyzing coverage results...');

    try {
      const coverageData = JSON.parse(readFileSync(options.coverageResults, 'utf8'));
      const improvements = this.analyzeCoverageResults(coverageData);
      
      const analysis = {
        coverage: coverageData,
        improvements,
        quickFixes: this.generateCoverageFixes(improvements),
        timestamp: new Date().toISOString()
      };

      writeFileSync(options.output, JSON.stringify(analysis, null, 2));
      console.log(`✅ Coverage analysis complete: ${options.output}`);
    } catch (error) {
      console.error(`❌ Failed to analyze coverage:`, error);
      throw error;
    }
  }

  /**
   * Analyze quality results and generate improvement suggestions
   */
  async analyzeQuality(options: {
    qualityResults: string;
    output: string;
  }): Promise<void> {
    console.log('🎯 Analyzing quality results...');

    try {
      const qualityData = JSON.parse(readFileSync(options.qualityResults, 'utf8'));
      const improvements = this.analyzeQualityResults(qualityData);
      
      const analysis = {
        quality: qualityData,
        improvements,
        quickFixes: this.generateQualityFixes(improvements),
        timestamp: new Date().toISOString()
      };

      writeFileSync(options.output, JSON.stringify(analysis, null, 2));
      console.log(`✅ Quality analysis complete: ${options.output}`);
    } catch (error) {
      console.error(`❌ Failed to analyze quality:`, error);
      throw error;
    }
  }

  /**
   * Analyze security results and generate fix suggestions
   */
  async analyzeSecurity(options: {
    securityResults: string;
    output: string;
  }): Promise<void> {
    console.log('🔒 Analyzing security results...');

    try {
      const securityData = JSON.parse(readFileSync(options.securityResults, 'utf8'));
      const fixes = this.analyzeSecurityResults(securityData);
      
      const analysis = {
        security: securityData,
        fixes,
        quickFixes: this.generateSecurityFixes(fixes),
        timestamp: new Date().toISOString()
      };

      writeFileSync(options.output, JSON.stringify(analysis, null, 2));
      console.log(`✅ Security analysis complete: ${options.output}`);
    } catch (error) {
      console.error(`❌ Failed to analyze security:`, error);
      throw error;
    }
  }

  /**
   * Analyze build results and generate fix suggestions
   */
  async analyzeBuild(options: {
    buildOutput: string;
    healthCheck: string;
    output: string;
  }): Promise<void> {
    console.log('🔨 Analyzing build results...');

    try {
      const buildOutput = readFileSync(options.buildOutput, 'utf8');
      const healthCheck = existsSync(options.healthCheck) ? 
        JSON.parse(readFileSync(options.healthCheck, 'utf8')) : null;
      
      const fixes = this.analyzeBuildResults(buildOutput, healthCheck);
      
      const analysis = {
        buildOutput,
        healthCheck,
        fixes,
        quickFixes: this.generateBuildFixes(fixes),
        timestamp: new Date().toISOString()
      };

      writeFileSync(options.output, JSON.stringify(analysis, null, 2));
      console.log(`✅ Build analysis complete: ${options.output}`);
    } catch (error) {
      console.error(`❌ Failed to analyze build:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive Cursor integration report
   */
  async generateReport(options: {
    artifactsDir: string;
    output: string;
  }): Promise<void> {
    console.log('📋 Generating comprehensive Cursor integration report...');

    try {
      const artifacts = this.collectArtifacts(options.artifactsDir);
      this.report = this.compileReport(artifacts);
      
      writeFileSync(options.output, JSON.stringify(this.report, null, 2));
      console.log(`✅ Comprehensive report generated: ${options.output}`);
    } catch (error) {
      console.error(`❌ Failed to generate report:`, error);
      throw error;
    }
  }

  /**
   * Generate quick fix commands based on analysis
   */
  async generateQuickFixes(options: {
    report: string;
    output: string;
  }): Promise<void> {
    console.log('⚡ Generating quick fix commands...');

    try {
      const report = JSON.parse(readFileSync(options.report, 'utf8'));
      const quickFixes = this.generateQuickFixCommands(report);
      
      writeFileSync(options.output, JSON.stringify(quickFixes, null, 2));
      console.log(`✅ Quick fix commands generated: ${options.output}`);
    } catch (error) {
      console.error(`❌ Failed to generate quick fixes:`, error);
      throw error;
    }
  }

  /**
   * Send notifications about test results
   */
  async sendNotifications(options: {
    report: string;
    context: any;
  }): Promise<void> {
    console.log('📢 Sending notifications...');

    try {
      const report = JSON.parse(readFileSync(options.report, 'utf8'));
      this.sendNotificationReport(report, options.context);
      console.log(`✅ Notifications sent`);
    } catch (error) {
      console.error(`❌ Failed to send notifications:`, error);
      throw error;
    }
  }

  /**
   * Analyze test results and categorize failures
   */
  private analyzeTestResults(testData: TestResult, testSuite: string): FailureAnalysis[] {
    const failures: FailureAnalysis[] = [];

    if (testData.testResults) {
      testData.testResults.forEach(test => {
        if (test.status === 'failed') {
          const failure = this.categorizeTestFailure(test, testSuite);
          failures.push(failure);
        }
      });
    }

    return failures;
  }

  /**
   * Categorize individual test failure
   */
  private categorizeTestFailure(test: TestCase, testSuite: string): FailureAnalysis {
    const failureMessage = test.failureMessages[0] || '';
    
    // Common failure patterns
    if (failureMessage.includes('TypeError') || failureMessage.includes('ReferenceError')) {
      return {
        type: 'Type Error',
        description: `Type or reference error in ${test.fullName}`,
        quickFix: `pnpm type-check && pnpm lint:fix`,
        severity: 'high',
        category: 'test',
        files: [test.location.path],
        suggestions: [
          'Check for undefined variables or incorrect type usage',
          'Verify imports and exports',
          'Run type checking to identify specific issues'
        ]
      };
    }

    if (failureMessage.includes('timeout')) {
      return {
        type: 'Timeout Error',
        description: `Test timeout in ${test.fullName}`,
        quickFix: `pnpm test:${testSuite} --timeout=60000`,
        severity: 'medium',
        category: 'test',
        files: [test.location.path],
        suggestions: [
          'Increase test timeout',
          'Check for infinite loops or blocking operations',
          'Optimize test performance'
        ]
      };
    }

    if (failureMessage.includes('AssertionError')) {
      return {
        type: 'Assertion Error',
        description: `Assertion failed in ${test.fullName}`,
        quickFix: `pnpm test:${testSuite} --reporter=verbose`,
        severity: 'medium',
        category: 'test',
        files: [test.location.path],
        suggestions: [
          'Review test expectations',
          'Check test data and mock values',
          'Verify test setup and teardown'
        ]
      };
    }

    // Default failure analysis
    return {
      type: 'Test Failure',
      description: `Test failed in ${test.fullName}`,
      quickFix: `pnpm test:${testSuite} --reporter=verbose`,
      severity: 'medium',
      category: 'test',
      files: [test.location.path],
      suggestions: [
        'Review test implementation',
        'Check test dependencies',
        'Verify test environment setup'
      ]
    };
  }

  /**
   * Analyze coverage results
   */
  private analyzeCoverageResults(coverageData: any): any[] {
    const improvements = [];

    if (coverageData.coverageMap) {
      const coverage = coverageData.coverageMap;
      
      // Check for low coverage files
      Object.keys(coverage).forEach(file => {
        const fileCoverage = coverage[file];
        const lineCoverage = fileCoverage.getLineCoverage();
        
        Object.keys(lineCoverage).forEach(line => {
          if (lineCoverage[line] === 0) {
            improvements.push({
              file,
              line: parseInt(line),
              type: 'uncovered_line',
              suggestion: `Add test coverage for line ${line} in ${file}`
            });
          }
        });
      });
    }

    return improvements;
  }

  /**
   * Analyze quality results
   */
  private analyzeQualityResults(qualityData: any): any[] {
    const improvements = [];

    // Analyze quality metrics
    if (qualityData.metrics) {
      const metrics = qualityData.metrics;
      
      if (metrics.complexity > 10) {
        improvements.push({
          type: 'high_complexity',
          suggestion: 'Refactor complex functions to reduce cyclomatic complexity'
        });
      }

      if (metrics.maintainability < 0.8) {
        improvements.push({
          type: 'low_maintainability',
          suggestion: 'Improve code maintainability by reducing complexity and improving documentation'
        });
      }
    }

    return improvements;
  }

  /**
   * Analyze security results
   */
  private analyzeSecurityResults(securityData: any): any[] {
    const fixes = [];

    if (securityData.vulnerabilities) {
      securityData.vulnerabilities.forEach(vuln => {
        fixes.push({
          type: vuln.severity,
          package: vuln.package,
          suggestion: `Update ${vuln.package} to version ${vuln.fixVersion || 'latest'}`,
          quickFix: `pnpm update ${vuln.package}`
        });
      });
    }

    return fixes;
  }

  /**
   * Analyze build results
   */
  private analyzeBuildResults(buildOutput: string, healthCheck: any): any[] {
    const fixes = [];

    // Check for TypeScript errors
    if (buildOutput.includes('error TS')) {
      fixes.push({
        type: 'typescript_error',
        suggestion: 'Fix TypeScript compilation errors',
        quickFix: 'pnpm type-check'
      });
    }

    // Check for build failures
    if (buildOutput.includes('Build failed') || buildOutput.includes('ERROR')) {
      fixes.push({
        type: 'build_failure',
        suggestion: 'Fix build configuration or dependencies',
        quickFix: 'pnpm install && pnpm build'
      });
    }

    // Check health check
    if (!healthCheck || healthCheck.status !== 'ok') {
      fixes.push({
        type: 'health_check_failure',
        suggestion: 'Fix application health check issues',
        quickFix: 'pnpm start && curl -f http://localhost:3000/health'
      });
    }

    return fixes;
  }

  /**
   * Generate quick fixes for test failures
   */
  private generateQuickFixes(failures: FailureAnalysis[]): string[] {
    const quickFixes = [];

    if (failures && Array.isArray(failures)) {
      failures.forEach(failure => {
        quickFixes.push(failure.quickFix);
      });
    }

    return [...new Set(quickFixes)]; // Remove duplicates
  }

  /**
   * Generate coverage fixes
   */
  private generateCoverageFixes(improvements: any[]): string[] {
    const fixes = [];

    improvements.forEach(improvement => {
      if (improvement.type === 'uncovered_line') {
        fixes.push(`pnpm test:smart:coverage --reporter=verbose`);
      }
    });

    return [...new Set(fixes)];
  }

  /**
   * Generate quality fixes
   */
  private generateQualityFixes(improvements: any[]): string[] {
    const fixes = [];

    improvements.forEach(improvement => {
      if (improvement.type === 'high_complexity') {
        fixes.push('pnpm lint:fix && pnpm type-check');
      }
    });

    return [...new Set(fixes)];
  }

  /**
   * Generate security fixes
   */
  private generateSecurityFixes(fixes: any[]): string[] {
    const quickFixes = [];

    fixes.forEach(fix => {
      quickFixes.push(fix.quickFix);
    });

    return [...new Set(quickFixes)];
  }

  /**
   * Generate build fixes
   */
  private generateBuildFixes(fixes: any[]): string[] {
    const quickFixes = [];

    fixes.forEach(fix => {
      quickFixes.push(fix.quickFix);
    });

    return [...new Set(quickFixes)];
  }

  /**
   * Collect all artifacts from CI run
   */
  private collectArtifacts(artifactsDir: string): any {
    const artifacts = {};

    if (existsSync(artifactsDir)) {
      try {
        const files = readdirSync(artifactsDir);
        
        files.forEach(file => {
          const filePath = join(artifactsDir, file);
          try {
            const stat = statSync(filePath);
            
            if (stat.isDirectory()) {
              // Skip node_modules and other system directories
              if (!file.startsWith('.') && file !== 'node_modules') {
                artifacts[file] = this.collectArtifacts(filePath);
              }
            } else if (file.endsWith('.json')) {
              try {
                artifacts[file] = JSON.parse(readFileSync(filePath, 'utf8'));
              } catch (error) {
                console.warn(`Failed to parse ${file}:`, error.message);
              }
            }
          } catch (error) {
            // Skip files that can't be accessed (symlinks, permissions, etc.)
            console.warn(`Skipping ${file}:`, error.message);
          }
        });
      } catch (error) {
        console.warn(`Failed to read directory ${artifactsDir}:`, error.message);
      }
    }

    return artifacts;
  }

  /**
   * Compile comprehensive report from artifacts
   */
  private compileReport(artifacts: any): CursorIntegrationReport {
    const report: CursorIntegrationReport = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        coverage: 0,
        qualityScore: 0,
        securityScore: 0,
        buildStatus: 'success',
        overallStatus: 'success'
      },
      failures: [],
      quickFixes: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Compile test results
    Object.keys(artifacts).forEach(key => {
      if (key.includes('test-results')) {
        const testData = artifacts[key];
        if (testData.numTotalTests) {
          report.summary.totalTests += testData.numTotalTests;
          report.summary.passed += testData.numPassedTests;
          report.summary.failed += testData.numFailedTests;
        }
      }
    });

    // Compile coverage results
    if (artifacts['coverage-results']) {
      const coverageData = artifacts['coverage-results'];
      report.summary.coverage = coverageData.coverage || 0;
    }

    // Compile quality results
    if (artifacts['quality-results']) {
      const qualityData = artifacts['quality-results'];
      report.summary.qualityScore = qualityData.score || 0;
    }

    // Compile security results
    if (artifacts['security-results']) {
      const securityData = artifacts['security-results'];
      report.summary.securityScore = securityData.score || 0;
    }

    // Compile build results
    if (artifacts['build-artifacts']) {
      const buildData = artifacts['build-artifacts'];
      report.summary.buildStatus = buildData.status || 'success';
    }

    // Determine overall status
    if (report.summary.failed > 0 || report.summary.buildStatus === 'failed') {
      report.summary.overallStatus = 'failed';
    } else if (report.summary.coverage < 80 || report.summary.qualityScore < 0.8) {
      report.summary.overallStatus = 'partial';
    }

    return report;
  }

  /**
   * Generate quick fix commands
   */
  private generateQuickFixCommands(report: CursorIntegrationReport): any {
    const quickFixes = {
      commands: [],
      categories: {
        test: [],
        coverage: [],
        quality: [],
        security: [],
        build: []
      },
      recommendations: []
    };

    // Generate commands based on failures
    if (report.failures && Array.isArray(report.failures)) {
      report.failures.forEach(failure => {
        quickFixes.commands.push({
          command: failure.quickFix,
          description: failure.description,
          category: failure.category,
          severity: failure.severity
        });

        quickFixes.categories[failure.category].push(failure.quickFix);
      });
    }

    // Generate recommendations
    if (report.summary.coverage < 80) {
      quickFixes.recommendations.push('Run coverage tests and add missing test cases');
    }

    if (report.summary.qualityScore < 0.8) {
      quickFixes.recommendations.push('Improve code quality by refactoring complex functions');
    }

    if (report.summary.securityScore < 0.9) {
      quickFixes.recommendations.push('Update dependencies to fix security vulnerabilities');
    }

    return quickFixes;
  }

  /**
   * Send notification report
   */
  private sendNotificationReport(report: CursorIntegrationReport, context: any): void {
    // This would integrate with your notification system
    // For now, just log the report
    console.log('📊 Notification Report:');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Coverage: ${report.summary.coverage}%`);
    console.log(`Overall Status: ${report.summary.overallStatus}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const integration = new CursorTestIntegration();

  try {
    switch (command) {
      case 'analyze-failures':
        await integration.analyzeFailures({
          testSuite: args.find(arg => arg.startsWith('--test-suite'))?.split('=')[1] || 'unknown',
          testResults: args.find(arg => arg.startsWith('--test-results'))?.split('=')[1] || 'test-results.json',
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'failure-analysis.json'
        });
        break;

      case 'analyze-coverage':
        await integration.analyzeCoverage({
          coverageResults: args.find(arg => arg.startsWith('--coverage-results'))?.split('=')[1] || 'coverage-results.json',
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'coverage-analysis.json'
        });
        break;

      case 'analyze-quality':
        await integration.analyzeQuality({
          qualityResults: args.find(arg => arg.startsWith('--quality-results'))?.split('=')[1] || 'quality-results.json',
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'quality-analysis.json'
        });
        break;

      case 'analyze-security':
        await integration.analyzeSecurity({
          securityResults: args.find(arg => arg.startsWith('--security-results'))?.split('=')[1] || 'security-results.json',
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'security-analysis.json'
        });
        break;

      case 'analyze-build':
        await integration.analyzeBuild({
          buildOutput: args.find(arg => arg.startsWith('--build-output'))?.split('=')[1] || 'build-output.txt',
          healthCheck: args.find(arg => arg.startsWith('--health-check'))?.split('=')[1] || 'health-check.json',
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'build-analysis.json'
        });
        break;

      case 'generate-report':
        await integration.generateReport({
          artifactsDir: args.find(arg => arg.startsWith('--artifacts-dir'))?.split('=')[1] || '.',
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'cursor-integration-report.json'
        });
        break;

      case 'generate-quick-fixes':
        await integration.generateQuickFixes({
          report: args.find(arg => arg.startsWith('--report'))?.split('=')[1] || 'cursor-integration-report.json',
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'quick-fix-commands.json'
        });
        break;

      case 'send-notifications':
        await integration.sendNotifications({
          report: args.find(arg => arg.startsWith('--report'))?.split('=')[1] || 'cursor-integration-report.json',
          context: JSON.parse(args.find(arg => arg.startsWith('--context'))?.split('=')[1] || '{}')
        });
        break;

      default:
        console.log(`
🤖 Cursor Test Integration Script

Usage: node cursor-test-integration.js <command> [options]

Commands:
  analyze-failures     Analyze test failures and generate quick fixes
  analyze-coverage     Analyze coverage results and generate improvements
  analyze-quality      Analyze quality results and generate improvements
  analyze-security     Analyze security results and generate fixes
  analyze-build        Analyze build results and generate fixes
  generate-report      Generate comprehensive integration report
  generate-quick-fixes Generate quick fix commands
  send-notifications   Send notifications about test results

Examples:
  node cursor-test-integration.js analyze-failures --test-suite=algorithms --test-results=test-results.json --output=failure-analysis.json
  node cursor-test-integration.js generate-report --artifacts-dir=. --output=cursor-integration-report.json
  node cursor-test-integration.js generate-quick-fixes --report=cursor-integration-report.json --output=quick-fix-commands.json
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);

export { CursorTestIntegration };
