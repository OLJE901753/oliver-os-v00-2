/**
 * End-to-End Test Runner
 * Orchestrates and runs all E2E tests
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestSuite {
  name: string;
  file: string;
  description: string;
  timeout: number;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'websocket',
    file: 'websocket.test.ts',
    description: 'WebSocket communication tests',
    timeout: 60000
  },
  {
    name: 'database',
    file: 'database.test.ts',
    description: 'Database integration tests',
    timeout: 120000
  },
  {
    name: 'ai-services',
    file: 'ai-services.test.ts',
    description: 'AI services integration tests',
    timeout: 60000
  }
];

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  error?: string;
  output: string;
}

class E2ETestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Oliver-OS End-to-End Tests');
    console.log('=====================================\n');

    this.startTime = Date.now();

    // Ensure test results directory exists
    const resultsDir = join(process.cwd(), 'test-results');
    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir, { recursive: true });
    }

    // Run each test suite
    for (const suite of TEST_SUITES) {
      console.log(`📋 Running ${suite.name} tests...`);
      console.log(`   ${suite.description}`);
      
      const result = await this.runTestSuite(suite);
      this.results.push(result);
      
      if (result.passed) {
        console.log(`   ✅ ${suite.name} tests passed (${result.duration}ms)\n`);
      } else {
        console.log(`   ❌ ${suite.name} tests failed (${result.duration}ms)`);
        console.log(`   Error: ${result.error}\n`);
      }
    }

    // Generate summary
    this.generateSummary();
  }

  private async runTestSuite(suite: TestSuite): Promise<TestResult> {
    const startTime = Date.now();
    let passed = false;
    let error: string | undefined;
    let output = '';

    try {
      // Run the test suite with vitest
      const command = `npx vitest run tests/e2e/${suite.file} --reporter=verbose --timeout=${suite.timeout}`;
      
      output = execSync(command, {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      }).toString();

      passed = true;
    } catch (err: any) {
      error = err.message;
      output = err.stdout || err.stderr || error;
    }

    const duration = Date.now() - startTime;

    // Save individual test results
    const resultFile = join(process.cwd(), 'test-results', `${suite.name}-results.txt`);
    writeFileSync(resultFile, output);

    return {
      suite: suite.name,
      passed,
      duration,
      error,
      output
    };
  }

  private generateSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passedSuites = this.results.filter(r => r.passed).length;
    const totalSuites = this.results.length;
    const failedSuites = totalSuites - passedSuites;

    console.log('📊 E2E Test Summary');
    console.log('==================');
    console.log(`Total Suites: ${totalSuites}`);
    console.log(`Passed: ${passedSuites}`);
    console.log(`Failed: ${failedSuites}`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('');

    // Detailed results
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`${status} ${result.suite.padEnd(15)} ${duration}s`);
    });

    console.log('');

    // Failed test details
    if (failedSuites > 0) {
      console.log('❌ Failed Test Details');
      console.log('======================');
      
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`\n${result.suite}:`);
          console.log(`  Error: ${result.error}`);
          console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);
        });
    }

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalSuites,
        passed: passedSuites,
        failed: failedSuites,
        duration: totalDuration
      },
      results: this.results.map(r => ({
        suite: r.suite,
        passed: r.passed,
        duration: r.duration,
        error: r.error
      }))
    };

    const reportFile = join(process.cwd(), 'test-results', 'e2e-report.json');
    writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n📄 Detailed report saved to: test-results/e2e-report.json`);

    // Exit with appropriate code
    if (failedSuites > 0) {
      console.log('\n❌ Some tests failed. Check the details above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All E2E tests passed!');
      process.exit(0);
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ E2E test runner failed:', error);
    process.exit(1);
  });
}

export { E2ETestRunner, TEST_SUITES };
