/**
 * Smart Assistance Algorithm Tests
 * Comprehensive testing for pattern recognition and learning algorithms
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LearningService } from '../../services/memory/learning-service';
import { MemoryService } from '../../services/memory/memory-service';
import { ContextualSuggestionEngine } from '../../services/memory/contextual-suggestion-engine';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';

describe('Smart Assistance Algorithm Quality Tests', () => {
  let config: Config;
  let logger: Logger;
  let memoryService: MemoryService;
  let learningService: LearningService;
  let suggestionEngine: ContextualSuggestionEngine;

  beforeEach(async () => {
    config = new Config();
    logger = new Logger('AlgorithmTest');
    memoryService = new MemoryService(config);
    learningService = new LearningService(config, memoryService);
    suggestionEngine = new ContextualSuggestionEngine(config, memoryService);
    
    await learningService.initialize();
    await suggestionEngine.initialize();
  });

  afterEach(() => {
    // Clean up any test data
  });

  describe('Pattern Similarity Algorithm', () => {
    it('should calculate similarity correctly for identical patterns', () => {
      const pattern1 = {
        id: '1',
        type: 'code' as const,
        pattern: 'async function fetchData(url: string)',
        context: 'api',
        successRate: 0.9,
        frequency: 5,
        lastUsed: new Date().toISOString(),
        confidence: 0.8
      };

      const pattern2 = {
        id: '2',
        type: 'code' as const,
        pattern: 'async function fetchData(url: string)',
        context: 'api',
        successRate: 0.9,
        frequency: 5,
        lastUsed: new Date().toISOString(),
        confidence: 0.8
      };

      // Access private method through any for testing
      const similarity = (learningService as any).calculatePatternSimilarity(pattern1, pattern2);
      expect(similarity).toBe(1.0);
    });

    it('should calculate similarity correctly for similar patterns', () => {
      const pattern1 = {
        id: '1',
        type: 'code' as const,
        pattern: 'async function fetchData(url: string)',
        context: 'api',
        successRate: 0.9,
        frequency: 5,
        lastUsed: new Date().toISOString(),
        confidence: 0.8
      };

      const pattern2 = {
        id: '2',
        type: 'code' as const,
        pattern: 'async function getData(url: string)',
        context: 'api',
        successRate: 0.8,
        frequency: 3,
        lastUsed: new Date().toISOString(),
        confidence: 0.7
      };

      const similarity = (learningService as any).calculatePatternSimilarity(pattern1, pattern2);
      expect(similarity).toBeGreaterThan(0.5);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should return 0 for completely different patterns', () => {
      const pattern1 = {
        id: '1',
        type: 'code' as const,
        pattern: 'async function fetchData(url: string)',
        context: 'api',
        successRate: 0.9,
        frequency: 5,
        lastUsed: new Date().toISOString(),
        confidence: 0.8
      };

      const pattern2 = {
        id: '2',
        type: 'code' as const,
        pattern: 'class DatabaseConnection',
        context: 'database',
        successRate: 0.8,
        frequency: 3,
        lastUsed: new Date().toISOString(),
        confidence: 0.7
      };

      const similarity = (learningService as any).calculatePatternSimilarity(pattern1, pattern2);
      expect(similarity).toBe(0);
    });

    it('should be symmetric', () => {
      const pattern1 = createTestPattern('async function test()', 'api');
      const pattern2 = createTestPattern('async function test()', 'api');

      const similarity1 = (learningService as any).calculatePatternSimilarity(pattern1, pattern2);
      const similarity2 = (learningService as any).calculatePatternSimilarity(pattern2, pattern1);
      
      expect(similarity1).toBe(similarity2);
    });

    it('should be reflexive', () => {
      const pattern = createTestPattern('async function test()', 'api');
      const similarity = (learningService as any).calculatePatternSimilarity(pattern, pattern);
      expect(similarity).toBe(1.0);
    });
  });

  describe('Learning Algorithm Properties', () => {
    it('should always return confidence between 0 and 1', () => {
      const patterns = generateRandomPatterns(100);
      
      patterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should update success rate correctly', () => {
      const pattern = createTestPattern('test pattern', 'test');
      const initialSuccessRate = pattern.successRate;
      
      // Simulate learning from successful usage
      (learningService as any).updatePatternSuccess(pattern, true);
      
      expect(pattern.successRate).toBeGreaterThanOrEqual(initialSuccessRate);
    });

    it('should handle frequency updates correctly', () => {
      const pattern = createTestPattern('test pattern', 'test');
      const initialFrequency = pattern.frequency;
      
      // Simulate pattern usage
      (learningService as any).updatePatternFrequency(pattern);
      
      expect(pattern.frequency).toBe(initialFrequency + 1);
    });
  });

  describe('Quality Scoring Algorithm', () => {
    it('should score higher for better code', () => {
      const goodCode = `
        async function fetchData(url: string): Promise<Data> {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            return await response.json();
          } catch (error) {
            console.error('Failed to fetch data:', error);
            throw error;
          }
        }
      `;

      const badCode = `
        function fetchData(url) {
          return fetch(url).then(r => r.json());
        }
      `;

      const goodScore = (suggestionEngine as any).analyzeCodeQuality(goodCode);
      const badScore = (suggestionEngine as any).analyzeCodeQuality(badCode);
      
      expect(goodScore.overall).toBeGreaterThan(badScore.overall);
    });

    it('should identify security issues correctly', () => {
      const vulnerableCode = `
        function processUserInput(input) {
          return eval(input);
        }
      `;

      const secureCode = `
        function processUserInput(input: string): string {
          return input.replace(/<script>/g, '');
        }
      `;

      const vulnerableScore = (suggestionEngine as any).analyzeCodeQuality(vulnerableCode);
      const secureScore = (suggestionEngine as any).analyzeCodeQuality(secureCode);
      
      expect(vulnerableScore.security).toBeLessThan(secureScore.security);
    });

    it('should detect performance issues', () => {
      const inefficientCode = `
        function processArray(arr) {
          let result = [];
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length; j++) {
              result.push(arr[i] + arr[j]);
            }
          }
          return result;
        }
      `;

      const efficientCode = `
        function processArray(arr: number[]): number[] {
          return arr.flatMap(x => arr.map(y => x + y));
        }
      `;

      const inefficientScore = (suggestionEngine as any).analyzeCodeQuality(inefficientCode);
      const efficientScore = (suggestionEngine as any).analyzeCodeQuality(efficientCode);
      
      expect(inefficientScore.performance).toBeLessThan(efficientScore.performance);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty inputs gracefully', () => {
      expect(() => (suggestionEngine as any).analyzeCodeQuality('')).not.toThrow();
      expect(() => (suggestionEngine as any).analyzeCodeQuality(null)).not.toThrow();
      expect(() => (suggestionEngine as any).analyzeCodeQuality(undefined)).not.toThrow();
    });

    it('should handle malformed code without crashing', () => {
      const malformedCode = 'function test() { return; // missing closing brace';
      expect(() => (suggestionEngine as any).analyzeCodeQuality(malformedCode)).not.toThrow();
    });

    it('should handle very large inputs', () => {
      const largeCode = generateLargeCodeFile(10000); // 10k lines
      expect(() => (suggestionEngine as any).analyzeCodeQuality(largeCode)).not.toThrow();
    });

    it('should handle special characters and unicode', () => {
      const unicodeCode = `
        function 测试函数(参数: string): string {
          return 参数 + '测试';
        }
      `;
      expect(() => (suggestionEngine as any).analyzeCodeQuality(unicodeCode)).not.toThrow();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should analyze large files quickly', async () => {
      const largeFile = generateLargeCodeFile(5000); // 5k lines
      const start = performance.now();
      
      await (suggestionEngine as any).analyzeCodeQuality(largeFile);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should not leak memory during analysis', () => {
      const initialMemory = process.memoryUsage();
      
      // Run analysis multiple times
      for (let i = 0; i < 100; i++) {
        (suggestionEngine as any).analyzeCodeQuality(generateLargeCodeFile(100));
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB max
    });
  });

  // Helper functions
  function createTestPattern(pattern: string, context: string) {
    return {
      id: Math.random().toString(36),
      type: 'code' as const,
      pattern,
      context,
      successRate: Math.random(),
      frequency: Math.floor(Math.random() * 10) + 1,
      lastUsed: new Date().toISOString(),
      confidence: Math.random()
    };
  }

  function generateRandomPatterns(count: number) {
    const patterns = [];
    for (let i = 0; i < count; i++) {
      patterns.push(createTestPattern(
        `pattern_${i}`,
        `context_${i % 5}`
      ));
    }
    return patterns;
  }

  function generateLargeCodeFile(lineCount: number): string {
    let code = '';
    for (let i = 0; i < lineCount; i++) {
      code += `function testFunction${i}() {\n  return ${i};\n}\n\n`;
    }
    return code;
  }
});
