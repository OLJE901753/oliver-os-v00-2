#!/usr/bin/env tsx

/**
 * Smart Assistance Test Runner
 * Comprehensive test execution and quality reporting
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';

const execAsync = promisify(exec);

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  coverage?: number;
  errors?: string[];
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalDuration: number;
  passed: number;
  failed: number;
  coverage: number;
}

class SmartAssistanceTestRunner {
  private results: TestSuite[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Smart Assistance Test Suite...\n');
    this.startTime = Date.now();

    try {
      // Run all test suites
      await this.runTestSuite('Algorithm Tests', 'pnpm test:algorithms');
      await this.runTestSuite('Integration Tests', 'pnpm test:integration');
      await this.runTestSuite('Performance Tests', 'pnpm test:performance');
      await this.runTestSuite('Quality Gates', 'pnpm test:quality');
      
      // Generate comprehensive report
      await this.generateReport();
      
      // Check if all tests passed
      const allPassed = this.results.every(suite => suite.failed === 0);
      
      if (allPassed) {
        console.log('\n✅ All Smart Assistance Tests Passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Some Smart Assistance Tests Failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  private async runTestSuite(name: string, command: string): Promise<void> {
    console.log(`🧪 Running ${name}...`);
    const suiteStartTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(command);
      const duration = Date.now() - suiteStartTime;
      
      // Parse test results (simplified)
      const lines = stdout.split('\n');
      const passed = lines.filter(line => line.includes('✓')).length;
      const failed = lines.filter(line => line.includes('✗') || line.includes('FAIL')).length;
      
      const suite: TestSuite = {
        name,
        tests: [], // Would parse individual test results in a real implementation
        totalDuration: duration,
        passed,
        failed,
        coverage: 0 // Would extract from coverage report
      };
      
      this.results.push(suite);
      
      console.log(`  ✅ ${name} completed in ${duration}ms (${passed} passed, ${failed} failed)`);
      
      if (stderr) {
        console.warn(`  ⚠️  Warnings: ${stderr}`);
      }
    } catch (error) {
      const duration = Date.now() - suiteStartTime;
      console.error(`  ❌ ${name} failed after ${duration}ms:`, error);
      
      this.results.push({
        name,
        tests: [],
        totalDuration: duration,
        passed: 0,
        failed: 1,
        coverage: 0
      });
    }
  }

  private async generateReport(): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failed, 0);
    const totalTests = totalPassed + totalFailed;
    
    console.log('\n📊 Smart Assistance Test Report');
    console.log('================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Test Suite Results:');
    this.results.forEach(suite => {
      const status = suite.failed === 0 ? '✅' : '❌';
      const successRate = suite.passed + suite.failed > 0 
        ? ((suite.passed / (suite.passed + suite.failed)) * 100).toFixed(1)
        : '0.0';
      
      console.log(`  ${status} ${suite.name}: ${suite.passed} passed, ${suite.failed} failed (${successRate}%)`);
    });
    
    // Generate HTML report
    await this.generateHtmlReport();
    
    // Generate JSON report
    await this.generateJsonReport();
  }

  private async generateHtmlReport(): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Smart Assistance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .suite { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { background: #d4edda; }
        .failed { background: #f8d7da; }
        .summary { font-size: 18px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Smart Assistance Test Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
    
    <div class="summary">
        Total Tests: ${this.results.reduce((sum, suite) => sum + suite.passed + suite.failed, 0)} |
        Passed: ${this.results.reduce((sum, suite) => sum + suite.passed, 0)} |
        Failed: ${this.results.reduce((sum, suite) => sum + suite.failed, 0)}
    </div>
    
    ${this.results.map(suite => `
        <div class="suite ${suite.failed === 0 ? 'passed' : 'failed'}">
            <h3>${suite.name}</h3>
            <p>Passed: ${suite.passed} | Failed: ${suite.failed} | Duration: ${suite.totalDuration}ms</p>
        </div>
    `).join('')}
</body>
</html>
    `;
    
    const reportPath = path.join(process.cwd(), 'test-results', 'smart-assistance-report.html');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeFile(reportPath, html);
    
    console.log(`\n📄 HTML report generated: ${reportPath}`);
  }

  private async generateJsonReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      suites: this.results,
      summary: {
        totalTests: this.results.reduce((sum, suite) => sum + suite.passed + suite.failed, 0),
        passed: this.results.reduce((sum, suite) => sum + suite.passed, 0),
        failed: this.results.reduce((sum, suite) => sum + suite.failed, 0),
        successRate: this.results.reduce((sum, suite) => sum + suite.passed, 0) / 
                    this.results.reduce((sum, suite) => sum + suite.passed + suite.failed, 0) * 100
      }
    };
    
    const reportPath = path.join(process.cwd(), 'test-results', 'smart-assistance-report.json');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 JSON report generated: ${reportPath}`);
  }
}

// Run the test suite
async function main() {
  const runner = new SmartAssistanceTestRunner();
  await runner.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}
