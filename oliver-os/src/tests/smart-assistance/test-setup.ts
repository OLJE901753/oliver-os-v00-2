/**
 * Smart Assistance Test Setup
 * Test configuration and utilities for the smart assistance system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import { MemoryService } from '../../services/memory/memory-service';
import { LearningService } from '../../services/memory/learning-service';
import { ContextualSuggestionEngine } from '../../services/memory/contextual-suggestion-engine';
// import { SmartAssistanceExample } from '../../../examples/smart-assistance-example';
import fs from 'fs-extra';
import path from 'path';

export interface TestContext {
  config: Config;
  logger: Logger;
  memoryService: MemoryService;
  learningService: LearningService;
  suggestionEngine: ContextualSuggestionEngine;
  testDir: string;
  cleanup: () => Promise<void>;
}

export class TestSetup {
  private static instance: TestSetup;
  private testContext: TestContext | null = null;
  private testFiles: string[] = [];

  static getInstance(): TestSetup {
    if (!TestSetup.instance) {
      TestSetup.instance = new TestSetup();
    }
    return TestSetup.instance;
  }

  async setupTestContext(): Promise<TestContext> {
    if (this.testContext) {
      return this.testContext;
    }

    const config = new Config();
    const logger = new Logger('TestSetup');
    const memoryService = new MemoryService(config);
    const learningService = new LearningService(config, memoryService);
    const suggestionEngine = new ContextualSuggestionEngine(config, memoryService, learningService);
    // Initialize services
    await learningService.initialize();
    await suggestionEngine.initialize();

    // Create test directory
    const testDir = path.join(process.cwd(), 'test-temp');
    await fs.ensureDir(testDir);

    const cleanup = async () => {
      // Clean up test files
      for (const file of this.testFiles) {
        if (await fs.pathExists(file)) {
          await fs.remove(file);
        }
      }
      this.testFiles = [];

      // Clean up test directory
      if (await fs.pathExists(testDir)) {
        await fs.remove(testDir);
      }
    };

    this.testContext = {
      config,
      logger,
      memoryService,
      learningService,
      suggestionEngine,
      testDir,
      cleanup
    };

    return this.testContext;
  }

  async createTestFile(content: string, filename?: string): Promise<string> {
    const testDir = this.testContext?.testDir || path.join(process.cwd(), 'test-temp');
    await fs.ensureDir(testDir);

    const fileName = filename || `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.ts`;
    const filePath = path.join(testDir, fileName);
    
    await fs.writeFile(filePath, content);
    this.testFiles.push(filePath);
    
    return filePath;
  }

  async createTestCodeFile(lineCount: number = 100): Promise<string> {
    let content = 'export class TestClass {\n';
    
    for (let i = 0; i < lineCount; i++) {
      content += `  method${i}(): string {\n`;
      content += `    return 'test${i}';\n`;
      content += `  }\n\n`;
    }
    
    content += '}\n';
    
    return this.createTestFile(content);
  }

  async createTestCodeWithIssues(): Promise<string> {
    const content = `
      // Test file with various code issues
      import { Config } from './config';
      import { Logger } from './logger';

      export class TestService {
        private _config: Config;
        private _logger: Logger;

        constructor(config: Config) {
          this._config = config;
          this._logger = new Logger('TestService');
        }

        // Missing error handling
        async fetchData(url: string): Promise<any> {
          const response = await fetch(url);
          return await response.json();
        }

        // Inefficient loop
        processData(data: any[]): any[] {
          let result = [];
          for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data.length; j++) {
              result.push(data[i] + data[j]);
            }
          }
          return result;
        }

        // Security issue
        executeQuery(query: string): any {
          return eval(query);
        }

        // Type safety issue
        processInput(input: any): string {
          return input.toString();
        }

        // Missing documentation
        calculateTotal(items: number[]): number {
          let total = 0;
          for (let i = 0; i < items.length; i++) {
            total += items[i];
          }
          return total;
        }
      }
    `;
    
    return this.createTestFile(content);
  }

  async createLargeTestFile(lineCount: number = 1000): Promise<string> {
    let content = 'export class LargeTestClass {\n';
    
    for (let i = 0; i < lineCount; i++) {
      content += `  method${i}(): string {\n`;
      content += `    return 'test${i}';\n`;
      content += `  }\n\n`;
    }
    
    content += '}\n';
    
    return this.createTestFile(content);
  }

  async cleanup(): Promise<void> {
    if (this.testContext) {
      await this.testContext.cleanup();
      this.testContext = null;
    }
  }

  getTestFiles(): string[] {
    return [...this.testFiles];
  }

  addTestFile(filePath: string): void {
    this.testFiles.push(filePath);
  }
}

// Global test setup
let testSetup: TestSetup;

beforeAll(async () => {
  testSetup = TestSetup.getInstance();
  await testSetup.setupTestContext();
});

afterAll(async () => {
  if (testSetup) {
    await testSetup.cleanup();
  }
});

beforeEach(async () => {
  // Reset test files for each test
  testSetup = TestSetup.getInstance();
});

afterEach(async () => {
  // Clean up test files after each test
  if (testSetup) {
    const files = testSetup.getTestFiles();
    for (const file of files) {
      if (await fs.pathExists(file)) {
        await fs.remove(file);
      }
    }
  }
});

export { testSetup };

// Test utilities
export class TestUtils {
  static async generateRandomCode(length: number = 100): Promise<string> {
    const keywords = ['function', 'class', 'interface', 'type', 'const', 'let', 'var'];
    const types = ['string', 'number', 'boolean', 'any', 'void', 'Promise'];
    const operations = ['+', '-', '*', '/', '===', '!==', '&&', '||'];
    
    let code = '';
    
    for (let i = 0; i < length; i++) {
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      code += `${keyword} test${i}(): ${type} {\n`;
      code += `  return 'test${i}' ${operation} 'value';\n`;
      code += `}\n\n`;
    }
    
    return code;
  }

  static async measurePerformance<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    return { result, duration };
  }

  static async measureMemoryUsage<T>(fn: () => Promise<T>): Promise<{ result: T; memoryIncrease: number }> {
    const initialMemory = process.memoryUsage();
    const result = await fn();
    const finalMemory = process.memoryUsage();
    
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    return { result, memoryIncrease };
  }

  static createMockPattern(id: string, pattern: string, context: string) {
    return {
      id,
      type: 'code' as const,
      pattern,
      context,
      successRate: Math.random(),
      frequency: Math.floor(Math.random() * 10) + 1,
      lastUsed: new Date().toISOString(),
      confidence: Math.random()
    };
  }

  static createMockSuggestion(id: string, type: string, description: string) {
    return {
      id,
      type,
      description,
      impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      confidence: Math.random(),
      effort: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      reasoning: `This is a test suggestion for ${type}`,
      current: 'current code',
      suggested: 'suggested code'
    };
  }
}

// Test data generators
export class TestDataGenerator {
  static generateCodePatterns(count: number) {
    const patterns = [];
    
    for (let i = 0; i < count; i++) {
      patterns.push(TestUtils.createMockPattern(
        `pattern-${i}`,
        `pattern_${i}`,
        `context_${i % 5}`
      ));
    }
    
    return patterns;
  }

  static generateSuggestions(count: number) {
    const suggestions = [];
    const types = ['performance', 'security', 'maintainability', 'readability'];
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      suggestions.push(TestUtils.createMockSuggestion(
        `suggestion-${i}`,
        type,
        `Test suggestion ${i} for ${type}`
      ));
    }
    
    return suggestions;
  }

  static generateTestFiles(count: number, _lineCount: number = 100) {
    const files = [];
    
    for (let i = 0; i < count; i++) {
      files.push({
        name: `test-file-${i}.ts`,
        content: `// Generated test file ${i}\nexport class TestClass${i} {\n  method(): string {\n    return 'test${i}';\n  }\n}`
      });
    }
    
    return files;
  }
}
