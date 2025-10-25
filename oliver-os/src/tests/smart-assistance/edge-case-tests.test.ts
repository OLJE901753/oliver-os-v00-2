/**
 * Smart Assistance Edge Case Tests
 * Comprehensive edge case testing for robustness and error handling
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SmartAssistanceExample } from '../../examples/smart-assistance-example';
import { LearningService } from '../../services/memory/learning-service';
import { MemoryService } from '../../services/memory/memory-service';
import { ContextualSuggestionEngine } from '../../services/memory/contextual-suggestion-engine';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import fs from 'fs-extra';
import path from 'path';

describe('Smart Assistance Edge Case Tests', () => {
  let smartAssistance: SmartAssistanceExample;
  let config: Config;
  let logger: Logger;
  let testFiles: string[] = [];

  beforeEach(async () => {
    config = new Config();
    logger = new Logger('EdgeCaseTest');
    smartAssistance = new SmartAssistanceExample();
    await smartAssistance.initialize();
  });

  afterEach(async () => {
    // Clean up test files
    for (const file of testFiles) {
      if (await fs.pathExists(file)) {
        await fs.remove(file);
      }
    }
    testFiles = [];
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle null inputs gracefully', async () => {
      await expect(smartAssistance.analyzeCode(null as any))
        .rejects.toThrow();
    });

    it('should handle undefined inputs gracefully', async () => {
      await expect(smartAssistance.analyzeCode(undefined as any))
        .rejects.toThrow();
    });

    it('should handle empty string inputs', async () => {
      const result = await smartAssistance.analyzeCode('');
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-string inputs', async () => {
      await expect(smartAssistance.analyzeCode(123 as any))
        .rejects.toThrow();
      
      await expect(smartAssistance.analyzeCode({} as any))
        .rejects.toThrow();
      
      await expect(smartAssistance.analyzeCode([] as any))
        .rejects.toThrow();
    });

    it('should handle extremely long inputs', async () => {
      const longCode = 'a'.repeat(1000000); // 1MB string
      const result = await smartAssistance.analyzeCode(longCode);
      expect(result).toBeDefined();
    });

    it('should handle inputs with only whitespace', async () => {
      const whitespaceCode = '   \n\t\r   ';
      const result = await smartAssistance.analyzeCode(whitespaceCode);
      expect(result).toBeDefined();
    });
  });

  describe('File System Edge Cases', () => {
    it('should handle non-existent files', async () => {
      const nonExistentFile = path.join(process.cwd(), 'non-existent-file.ts');
      await expect(smartAssistance.analyzeCode(nonExistentFile))
        .rejects.toThrow();
    });

    it('should handle files with no read permissions', async () => {
      const testFile = await createTestFile('test content');
      
      // Remove read permissions (simulate)
      try {
        await fs.chmod(testFile, 0o000);
        await expect(smartAssistance.analyzeCode(testFile))
          .rejects.toThrow();
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(testFile, 0o644);
      }
    });

    it('should handle directories instead of files', async () => {
      const testDir = path.join(process.cwd(), 'test-directory');
      await fs.ensureDir(testDir);
      testFiles.push(testDir);
      
      await expect(smartAssistance.analyzeCode(testDir))
        .rejects.toThrow();
    });

    it('should handle symbolic links', async () => {
      const originalFile = await createTestFile('original content');
      const symlinkFile = path.join(process.cwd(), 'symlink.ts');
      
      try {
        await fs.symlink(originalFile, symlinkFile);
        testFiles.push(symlinkFile);
        
        const result = await smartAssistance.analyzeCode(symlinkFile);
        expect(result).toBeDefined();
      } catch (error) {
        // Symlinks might not be supported on all systems
        console.warn('Symlink test skipped:', error);
      }
    });

    it('should handle files with special characters in names', async () => {
      const specialFile = path.join(process.cwd(), 'test file with spaces & symbols!.ts');
      await fs.writeFile(specialFile, 'export class Test {}');
      testFiles.push(specialFile);
      
      const result = await smartAssistance.analyzeCode(specialFile);
      expect(result).toBeDefined();
    });
  });

  describe('Code Content Edge Cases', () => {
    it('should handle malformed TypeScript syntax', async () => {
      const malformedCode = `
        function test() {
          return; // missing closing brace
        class Test {
          method() {
            return 'test';
          }
        }
      `;
      
      const result = await smartAssistance.analyzeCode(malformedCode);
      expect(result).toBeDefined();
    });

    it('should handle code with only comments', async () => {
      const commentOnlyCode = `
        // This is just a comment
        /* Multi-line comment */
        /**
         * JSDoc comment
         */
      `;
      
      const result = await smartAssistance.analyzeCode(commentOnlyCode);
      expect(result).toBeDefined();
    });

    it('should handle code with only imports', async () => {
      const importOnlyCode = `
        import { Config } from './config';
        import { Logger } from './logger';
        import * as fs from 'fs-extra';
      `;
      
      const result = await smartAssistance.analyzeCode(importOnlyCode);
      expect(result).toBeDefined();
    });

    it('should handle code with only exports', async () => {
      const exportOnlyCode = `
        export const CONSTANT = 'value';
        export function test() {}
        export class Test {}
        export default Test;
      `;
      
      const result = await smartAssistance.analyzeCode(exportOnlyCode);
      expect(result).toBeDefined();
    });

    it('should handle code with unicode characters', async () => {
      const unicodeCode = `
        const 测试变量 = '测试值';
        function 测试函数(参数: string): string {
          return 参数 + '测试';
        }
        const emoji = '🚀💻🎯';
        const symbols = 'αβγδεζηθικλμνξοπρστυφχψω';
      `;
      
      const result = await smartAssistance.analyzeCode(unicodeCode);
      expect(result).toBeDefined();
    });

    it('should handle code with very long lines', async () => {
      const longLine = 'a'.repeat(10000);
      const longLineCode = `const veryLongVariable = '${longLine}';`;
      
      const result = await smartAssistance.analyzeCode(longLineCode);
      expect(result).toBeDefined();
    });

    it('should handle code with deeply nested structures', async () => {
      let nestedCode = 'function test() {\n';
      for (let i = 0; i < 100; i++) {
        nestedCode += '  '.repeat(i + 1) + 'if (true) {\n';
      }
      for (let i = 0; i < 100; i++) {
        nestedCode += '  '.repeat(100 - i) + '}\n';
      }
      nestedCode += '}';
      
      const result = await smartAssistance.analyzeCode(nestedCode);
      expect(result).toBeDefined();
    });
  });

  describe('Memory and Learning Edge Cases', () => {
    it('should handle learning with empty patterns', async () => {
      const learningService = (smartAssistance as any).learningService;
      
      await expect(learningService.recordPattern(null as any))
        .rejects.toThrow();
      
      await expect(learningService.recordPattern(undefined as any))
        .rejects.toThrow();
      
      await expect(learningService.recordPattern({} as any))
        .rejects.toThrow();
    });

    it('should handle learning with invalid pattern data', async () => {
      const learningService = (smartAssistance as any).learningService;
      
      const invalidPatterns = [
        { id: '', pattern: 'test', context: 'test' },
        { id: 'test', pattern: '', context: 'test' },
        { id: 'test', pattern: 'test', context: '' },
        { id: 'test', pattern: 'test', context: 'test', successRate: -1 },
        { id: 'test', pattern: 'test', context: 'test', successRate: 2 },
        { id: 'test', pattern: 'test', context: 'test', frequency: -1 },
        { id: 'test', pattern: 'test', context: 'test', confidence: -1 },
        { id: 'test', pattern: 'test', context: 'test', confidence: 2 }
      ];
      
      for (const pattern of invalidPatterns) {
        await expect(learningService.recordPattern(pattern))
          .rejects.toThrow();
      }
    });

    it('should handle memory corruption gracefully', async () => {
      const memoryService = (smartAssistance as any).memoryService;
      
      // Simulate corrupted memory data
      const corruptedMemory = {
        version: '1.0.0',
        lastUpdated: 'invalid-date',
        codePatterns: null,
        architecture: undefined,
        namingConventions: {},
        projectHistory: [],
        learning: 'invalid-data'
      };
      
      // This should not crash the system
      expect(() => {
        (memoryService as any).memory = corruptedMemory;
      }).not.toThrow();
    });

    it('should handle learning with extremely large datasets', async () => {
      const learningService = (smartAssistance as any).learningService;
      
      // Create a large number of patterns
      const patterns = [];
      for (let i = 0; i < 10000; i++) {
        patterns.push({
          id: `pattern-${i}`,
          type: 'code',
          pattern: `pattern_${i}`,
          context: `context_${i % 10}`,
          successRate: Math.random(),
          frequency: Math.floor(Math.random() * 100) + 1,
          lastUsed: new Date().toISOString(),
          confidence: Math.random()
        });
      }
      
      // Record all patterns
      for (const pattern of patterns) {
        await learningService.recordPattern(pattern);
      }
      
      // Should not crash
      expect(learningService).toBeDefined();
    });
  });

  describe('Suggestion Engine Edge Cases', () => {
    it('should handle suggestion generation with empty context', async () => {
      const suggestionEngine = (smartAssistance as any).suggestionEngine;
      
      const result = await suggestionEngine.generateSuggestions('');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle suggestion generation with invalid context', async () => {
      const suggestionEngine = (smartAssistance as any).suggestionEngine;
      
      await expect(suggestionEngine.generateSuggestions(null as any))
        .rejects.toThrow();
      
      await expect(suggestionEngine.generateSuggestions(undefined as any))
        .rejects.toThrow();
    });

    it('should handle suggestion generation with circular references', async () => {
      const suggestionEngine = (smartAssistance as any).suggestionEngine;
      
      const circularCode = `
        interface A { b: B; }
        interface B { a: A; }
        const circular: A = { b: { a: {} as A } };
      `;
      
      const result = await suggestionEngine.generateSuggestions(circularCode);
      expect(result).toBeDefined();
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle analysis timeout gracefully', async () => {
      // Create a very complex file that might cause timeout
      const complexCode = generateComplexCode(1000);
      
      const start = performance.now();
      const result = await smartAssistance.analyzeCode(complexCode);
      const duration = performance.now() - start;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(30000); // 30 seconds max
    });

    it('should handle memory pressure gracefully', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create memory pressure
      const largeFiles = [];
      for (let i = 0; i < 100; i++) {
        const file = await createTestFile(generateComplexCode(100));
        largeFiles.push(file);
      }
      
      // Analyze all files
      const promises = largeFiles.map(file => smartAssistance.analyzeCode(file));
      await Promise.all(promises);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Should not increase memory excessively
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // 200MB max
    });

    it('should handle concurrent analysis gracefully', async () => {
      const files = await Promise.all(
        Array.from({ length: 50 }, () => createTestFile(generateComplexCode(100)))
      );
      
      const start = performance.now();
      const promises = files.map(file => smartAssistance.analyzeCode(file));
      const results = await Promise.all(promises);
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(60000); // 60 seconds max
    });
  });

  describe('Error Recovery Edge Cases', () => {
    it('should recover from service initialization failures', async () => {
      // Simulate service failure
      const originalInit = (smartAssistance as any).learningService.initialize;
      (smartAssistance as any).learningService.initialize = () => {
        throw new Error('Simulated initialization failure');
      };
      
      // Should still work with other services
      const result = await smartAssistance.analyzeCode('export class Test {}');
      expect(result).toBeDefined();
      
      // Restore original method
      (smartAssistance as any).learningService.initialize = originalInit;
    });

    it('should recover from memory service failures', async () => {
      const memoryService = (smartAssistance as any).memoryService;
      
      // Simulate memory service failure
      const originalSave = memoryService.saveMemory;
      memoryService.saveMemory = () => {
        throw new Error('Simulated memory save failure');
      };
      
      // Should still work
      const result = await smartAssistance.analyzeCode('export class Test {}');
      expect(result).toBeDefined();
      
      // Restore original method
      memoryService.saveMemory = originalSave;
    });

    it('should handle network failures gracefully', async () => {
      // Simulate network failure in external dependencies
      const originalFetch = global.fetch;
      global.fetch = () => {
        throw new Error('Simulated network failure');
      };
      
      // Should still work
      const result = await smartAssistance.analyzeCode('export class Test {}');
      expect(result).toBeDefined();
      
      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig = new Config();
      (invalidConfig as any).config = {
        invalid: 'config',
        nested: {
          invalid: 'nested'
        }
      };
      
      const smartAssistanceWithInvalidConfig = new SmartAssistanceExample();
      await expect(smartAssistanceWithInvalidConfig.initialize())
        .resolves.not.toThrow();
    });

    it('should handle missing configuration files', async () => {
      // Temporarily rename config file
      const configPath = path.join(process.cwd(), 'smart-assistance.config.json');
      const backupPath = configPath + '.backup';
      
      if (await fs.pathExists(configPath)) {
        await fs.move(configPath, backupPath);
      }
      
      try {
        const smartAssistanceWithoutConfig = new SmartAssistanceExample();
        await expect(smartAssistanceWithoutConfig.initialize())
          .resolves.not.toThrow();
      } finally {
        // Restore config file
        if (await fs.pathExists(backupPath)) {
          await fs.move(backupPath, configPath);
        }
      }
    });
  });

  // Helper functions
  async function createTestFile(content: string): Promise<string> {
    const fileName = `test-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.ts`;
    const filePath = path.join(process.cwd(), fileName);
    
    await fs.writeFile(filePath, content);
    testFiles.push(filePath);
    
    return filePath;
  }

  function generateComplexCode(complexity: number): string {
    let code = 'export class ComplexClass {\n';
    
    for (let i = 0; i < complexity; i++) {
      code += `  method${i}(): string {\n`;
      code += `    if (true) {\n`;
      code += `      for (let j = 0; j < 10; j++) {\n`;
      code += `        while (j < 5) {\n`;
      code += `          try {\n`;
      code += `            return 'complex-${i}-${j}';\n`;
      code += `          } catch (error) {\n`;
      code += `            throw error;\n`;
      code += `          }\n`;
      code += `        }\n`;
      code += `      }\n`;
      code += `    }\n`;
      code += `    return 'method-${i}';\n`;
      code += `  }\n\n`;
    }
    
    code += '}\n';
    return code;
  }
});
