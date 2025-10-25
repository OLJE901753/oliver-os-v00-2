#!/usr/bin/env node

/**
 * CI Report Generator Script
 * Generates detailed reports for CI/CD pipeline components
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

class CIReportGenerator {
  /**
   * Generate lint and type check report
   */
  generateLintTypeCheckReport(options: {
    eslintResults: string;
    typecheckResults: string;
    eslintExitCode: number;
    typecheckExitCode: number;
    output: string;
  }): void {
    console.log('📝 Generating lint and type check report...');

    const report: CIReport = {
      type: 'lint-typecheck',
      status: 'success',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        duration: 0
      },
      details: [],
      recommendations: [],
      quickFixes: [],
      timestamp: new Date().toISOString()
    };

    // Process ESLint results
    if (existsSync(options.eslintResults)) {
      try {
        const eslintData = JSON.parse(readFileSync(options.eslintResults, 'utf8'));
        report.details.push({
          tool: 'eslint',
          results: eslintData,
          exitCode: options.eslintExitCode
        });

        if (options.eslintExitCode !== 0) {
          report.status = 'failed';
          report.summary.failed += eslintData.length || 0;
          report.quickFixes.push('pnpm lint:fix');
          report.recommendations.push('Fix ESLint errors using automatic fixes');
        } else {
          report.summary.passed += eslintData.length || 0;
        }
      } catch (error) {
        console.warn('Failed to parse ESLint results:', error.message);
      }
    }

    // Process TypeScript type check results
    if (existsSync(options.typecheckResults)) {
      try {
        const typecheckOutput = readFileSync(options.typecheckResults, 'utf8');
        report.details.push({
          tool: 'typescript',
          output: typecheckOutput,
          exitCode: options.typecheckExitCode
        });

        if (options.typecheckExitCode !== 0) {
          report.status = 'failed';
          report.quickFixes.push('pnpm type-check');
          report.recommendations.push('Fix TypeScript type errors');
        }
      } catch (error) {
        console.warn('Failed to parse TypeScript results:', error.message);
      }
    }

    report.summary.total = report.summary.passed + report.summary.failed;
    writeFileSync(options.output, JSON.stringify(report, null, 2));
    console.log(`✅ Lint and type check report generated: ${options.output}`);
  }

  /**
   * Generate test analysis report
   */
  generateTestAnalysisReport(options: {
    testSuite: string;
    testResults: string;
    testExitCode: number;
    output: string;
  }): void {
    console.log(`🧪 Generating test analysis report for ${options.testSuite}...`);

    const report: CIReport = {
      type: 'test-analysis',
      testSuite: options.testSuite,
      status: 'success',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        duration: 0
      },
      details: [],
      recommendations: [],
      quickFixes: [],
      timestamp: new Date().toISOString()
    };

    if (existsSync(options.testResults)) {
      try {
        const testData = JSON.parse(readFileSync(options.testResults, 'utf8'));
        report.details.push({
          testSuite: options.testSuite,
          results: testData,
          exitCode: options.testExitCode
        });

        report.summary.total = testData.numTotalTests || 0;
        report.summary.passed = testData.numPassedTests || 0;
        report.summary.failed = testData.numFailedTests || 0;
        report.summary.duration = testData.duration || 0;

        if (options.testExitCode !== 0 || testData.numFailedTests > 0) {
          report.status = 'failed';
          report.quickFixes.push(`pnpm test:${options.testSuite} --reporter=verbose`);
          report.recommendations.push(`Review and fix failing tests in ${options.testSuite} suite`);
        }
      } catch (error) {
        console.warn('Failed to parse test results:', error.message);
        report.status = 'failed';
        report.quickFixes.push(`pnpm test:${options.testSuite}`);
      }
    }

    writeFileSync(options.output, JSON.stringify(report, null, 2));
    console.log(`✅ Test analysis report generated: ${options.output}`);
  }

  /**
   * Generate coverage analysis report
   */
  generateCoverageAnalysisReport(options: {
    coverageResults: string;
    coverageExitCode: number;
    output: string;
  }): void {
    console.log('📊 Generating coverage analysis report...');

    const report: CIReport = {
      type: 'coverage-analysis',
      status: 'success',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        duration: 0
      },
      details: [],
      recommendations: [],
      quickFixes: [],
      timestamp: new Date().toISOString()
    };

    if (existsSync(options.coverageResults)) {
      try {
        const coverageData = JSON.parse(readFileSync(options.coverageResults, 'utf8'));
        report.details.push({
          coverage: coverageData,
          exitCode: options.coverageExitCode
        });

        const coverage = coverageData.coverage || 0;
        report.summary.total = 100;
        report.summary.passed = coverage;

        if (coverage < 80) {
          report.status = 'partial';
          report.quickFixes.push('pnpm test:smart:coverage');
          report.recommendations.push('Improve test coverage to meet 80% threshold');
        }
      } catch (error) {
        console.warn('Failed to parse coverage results:', error.message);
        report.status = 'failed';
        report.quickFixes.push('pnpm test:smart:coverage');
      }
    }

    writeFileSync(options.output, JSON.stringify(report, null, 2));
    console.log(`✅ Coverage analysis report generated: ${options.output}`);
  }

  /**
   * Generate quality analysis report
   */
  generateQualityAnalysisReport(options: {
    qualityResults: string;
    qualityExitCode: number;
    output: string;
  }): void {
    console.log('🎯 Generating quality analysis report...');

    const report: CIReport = {
      type: 'quality-analysis',
      status: 'success',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        duration: 0
      },
      details: [],
      recommendations: [],
      quickFixes: [],
      timestamp: new Date().toISOString()
    };

    if (existsSync(options.qualityResults)) {
      try {
        const qualityData = JSON.parse(readFileSync(options.qualityResults, 'utf8'));
        report.details.push({
          quality: qualityData,
          exitCode: options.qualityExitCode
        });

        const qualityScore = qualityData.score || 0;
        report.summary.total = 100;
        report.summary.passed = qualityScore;

        if (qualityScore < 80) {
          report.status = 'partial';
          report.quickFixes.push('pnpm test:quality');
          report.recommendations.push('Improve code quality to meet 80% threshold');
        }
      } catch (error) {
        console.warn('Failed to parse quality results:', error.message);
        report.status = 'failed';
        report.quickFixes.push('pnpm test:quality');
      }
    }

    writeFileSync(options.output, JSON.stringify(report, null, 2));
    console.log(`✅ Quality analysis report generated: ${options.output}`);
  }

  /**
   * Generate security analysis report
   */
  generateSecurityAnalysisReport(options: {
    securityResults: string;
    securityExitCode: number;
    output: string;
  }): void {
    console.log('🔒 Generating security analysis report...');

    const report: CIReport = {
      type: 'security-analysis',
      status: 'success',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        duration: 0
      },
      details: [],
      recommendations: [],
      quickFixes: [],
      timestamp: new Date().toISOString()
    };

    if (existsSync(options.securityResults)) {
      try {
        const securityData = JSON.parse(readFileSync(options.securityResults, 'utf8'));
        report.details.push({
          security: securityData,
          exitCode: options.securityExitCode
        });

        const vulnerabilities = securityData.vulnerabilities || [];
        report.summary.failed = vulnerabilities.length;

        if (vulnerabilities.length > 0) {
          report.status = 'failed';
          report.quickFixes.push('pnpm audit --fix');
          report.recommendations.push('Update dependencies to fix security vulnerabilities');
        }
      } catch (error) {
        console.warn('Failed to parse security results:', error.message);
        report.status = 'failed';
        report.quickFixes.push('pnpm audit');
      }
    }

    writeFileSync(options.output, JSON.stringify(report, null, 2));
    console.log(`✅ Security analysis report generated: ${options.output}`);
  }

  /**
   * Generate build analysis report
   */
  generateBuildAnalysisReport(options: {
    buildOutput: string;
    healthCheck: string;
    buildExitCode: number;
    buildTestExitCode: number;
    output: string;
  }): void {
    console.log('🔨 Generating build analysis report...');

    const report: CIReport = {
      type: 'build-analysis',
      status: 'success',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        duration: 0
      },
      details: [],
      recommendations: [],
      quickFixes: [],
      timestamp: new Date().toISOString()
    };

    // Process build output
    if (existsSync(options.buildOutput)) {
      try {
        const buildOutput = readFileSync(options.buildOutput, 'utf8');
        report.details.push({
          build: {
            output: buildOutput,
            exitCode: options.buildExitCode
          }
        });

        if (options.buildExitCode !== 0) {
          report.status = 'failed';
          report.quickFixes.push('pnpm install && pnpm build');
          report.recommendations.push('Fix build configuration or dependencies');
        }
      } catch (error) {
        console.warn('Failed to parse build output:', error.message);
      }
    }

    // Process health check
    if (existsSync(options.healthCheck)) {
      try {
        const healthCheck = JSON.parse(readFileSync(options.healthCheck, 'utf8'));
        report.details.push({
          healthCheck: {
            result: healthCheck,
            exitCode: options.buildTestExitCode
          }
        });

        if (options.buildTestExitCode !== 0 || healthCheck.status !== 'ok') {
          report.status = 'failed';
          report.quickFixes.push('pnpm start && curl -f http://localhost:3000/health');
          report.recommendations.push('Fix application health check issues');
        }
      } catch (error) {
        console.warn('Failed to parse health check:', error.message);
      }
    }

    writeFileSync(options.output, JSON.stringify(report, null, 2));
    console.log(`✅ Build analysis report generated: ${options.output}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const generator = new CIReportGenerator();

  try {
    switch (command) {
      case 'lint-typecheck':
        generator.generateLintTypeCheckReport({
          eslintResults: args.find(arg => arg.startsWith('--eslint-results'))?.split('=')[1] || 'eslint-results.json',
          typecheckResults: args.find(arg => arg.startsWith('--typecheck-results'))?.split('=')[1] || 'typecheck-results.txt',
          eslintExitCode: parseInt(args.find(arg => arg.startsWith('--eslint-exit-code'))?.split('=')[1] || '0'),
          typecheckExitCode: parseInt(args.find(arg => arg.startsWith('--typecheck-exit-code'))?.split('=')[1] || '0'),
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'ci-report-lint-typecheck.json'
        });
        break;

      case 'test-analysis':
        generator.generateTestAnalysisReport({
          testSuite: args.find(arg => arg.startsWith('--test-suite'))?.split('=')[1] || 'unknown',
          testResults: args.find(arg => arg.startsWith('--test-results'))?.split('=')[1] || 'test-results.json',
          testExitCode: parseInt(args.find(arg => arg.startsWith('--test-exit-code'))?.split('=')[1] || '0'),
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'test-analysis.json'
        });
        break;

      case 'coverage-analysis':
        generator.generateCoverageAnalysisReport({
          coverageResults: args.find(arg => arg.startsWith('--coverage-results'))?.split('=')[1] || 'coverage-results.json',
          coverageExitCode: parseInt(args.find(arg => arg.startsWith('--coverage-exit-code'))?.split('=')[1] || '0'),
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'coverage-analysis.json'
        });
        break;

      case 'quality-analysis':
        generator.generateQualityAnalysisReport({
          qualityResults: args.find(arg => arg.startsWith('--quality-results'))?.split('=')[1] || 'quality-results.json',
          qualityExitCode: parseInt(args.find(arg => arg.startsWith('--quality-exit-code'))?.split('=')[1] || '0'),
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'quality-analysis.json'
        });
        break;

      case 'security-analysis':
        generator.generateSecurityAnalysisReport({
          securityResults: args.find(arg => arg.startsWith('--security-results'))?.split('=')[1] || 'security-results.json',
          securityExitCode: parseInt(args.find(arg => arg.startsWith('--security-exit-code'))?.split('=')[1] || '0'),
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'security-analysis.json'
        });
        break;

      case 'build-analysis':
        generator.generateBuildAnalysisReport({
          buildOutput: args.find(arg => arg.startsWith('--build-output'))?.split('=')[1] || 'build-output.txt',
          healthCheck: args.find(arg => arg.startsWith('--health-check'))?.split('=')[1] || 'health-check.json',
          buildExitCode: parseInt(args.find(arg => arg.startsWith('--build-exit-code'))?.split('=')[1] || '0'),
          buildTestExitCode: parseInt(args.find(arg => arg.startsWith('--build-test-exit-code'))?.split('=')[1] || '0'),
          output: args.find(arg => arg.startsWith('--output'))?.split('=')[1] || 'build-analysis.json'
        });
        break;

      default:
        console.log(`
📋 CI Report Generator

Usage: node generate-ci-report.js <command> [options]

Commands:
  lint-typecheck     Generate lint and type check report
  test-analysis      Generate test analysis report
  coverage-analysis  Generate coverage analysis report
  quality-analysis   Generate quality analysis report
  security-analysis  Generate security analysis report
  build-analysis     Generate build analysis report

Examples:
  node generate-ci-report.js lint-typecheck --eslint-results=eslint-results.json --typecheck-results=typecheck-results.txt --output=ci-report-lint-typecheck.json
  node generate-ci-report.js test-analysis --test-suite=algorithms --test-results=test-results.json --output=test-analysis.json
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

export { CIReportGenerator };
