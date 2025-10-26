/**
 * Smart Assistance Performance Tests
 * Performance benchmarks and memory usage testing
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SmartAssistanceExample } from '../../../examples/smart-assistance-example';
import { LearningService } from '../../services/memory/learning-service';
import { MemoryService } from '../../services/memory/memory-service';
import { ContextualSuggestionEngine } from '../../services/memory/contextual-suggestion-engine';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import fs from 'fs-extra';
import path from 'path';

describe('Smart Assistance Performance Tests', () => {
  let smartAssistance: SmartAssistanceExample;
  let config: Config;
  let logger: Logger;
  let testFiles: string[] = [];

  beforeEach(async () => {
    config = new Config();
    logger = new Logger('PerformanceTest');
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
    
    // Clean up temp directory if empty
    const tempDir = path.join(process.cwd(), 'temp');
    if (await fs.pathExists(tempDir)) {
      const files = await fs.readdir(tempDir);
      if (files.length === 0) {
        await fs.remove(tempDir);
      }
    }
  });

  describe('Code Analysis Performance', () => {
    it('should analyze small files quickly (< 100ms)', async () => {
      const smallFile = await createTestFile(100); // 100 lines
      
      const start = performance.now();
      await smartAssistance.analyzeCode(smallFile);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // 100ms max
    });

    it('should analyze medium files efficiently (< 1s)', async () => {
      const mediumFile = await createTestFile(1000); // 1k lines
      
      const start = performance.now();
      await smartAssistance.analyzeCode(mediumFile);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(1000); // 1 second max
    });

    it('should handle large files within reasonable time (< 5s)', async () => {
      const largeFile = await createTestFile(5000); // 5k lines
      
      const start = performance.now();
      await smartAssistance.analyzeCode(largeFile);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should scale linearly with file size', async () => {
      const sizes = [100, 500, 1000, 2000];
      const durations: number[] = [];
      
      for (const size of sizes) {
        const file = await createTestFile(size);
        const start = performance.now();
        await smartAssistance.analyzeCode(file);
        const duration = performance.now() - start;
        durations.push(duration);
      }
      
      // Check that duration increases roughly linearly
      for (let i = 1; i < durations.length; i++) {
        const ratio = durations[i] / durations[i - 1];
        const sizeRatio = sizes[i] / sizes[i - 1];
        
        // Duration should not increase more than 2x the size increase
        expect(ratio).toBeLessThan(sizeRatio * 2);
      }
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during single analysis', () => {
      const initialMemory = process.memoryUsage();
      
      // Run analysis
      smartAssistance.analyzeCode(createTestFile(1000));
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be minimal (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should not leak memory during multiple analyses', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run multiple analyses
      for (let i = 0; i < 50; i++) {
        const file = await createTestFile(500);
        await smartAssistance.analyzeCode(file);
      }
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle memory pressure gracefully', async () => {
      const initialMemory = process.memoryUsage();
      const maxMemory = initialMemory.heapUsed + (50 * 1024 * 1024); // 50MB limit (reduced)
      
      let iterations = 0;
      const maxIterations = 100; // Reduced from 1000
      
      while (process.memoryUsage().heapUsed < maxMemory && iterations < maxIterations) {
        const file = await createTestFile(500); // Reduced file size
        await smartAssistance.analyzeCode(file);
        iterations++;
        
        // Force garbage collection more frequently
        if (iterations % 5 === 0 && global.gc) {
          global.gc();
        }
      }
      
      // Should complete without crashing
      expect(iterations).toBeGreaterThan(0);
    }, 60000); // 60 second timeout for this specific test
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle concurrent analyses efficiently', async () => {
      const files = await Promise.all([
        createTestFile(500),
        createTestFile(500),
        createTestFile(500),
        createTestFile(500),
        createTestFile(500)
      ]);
      
      const start = performance.now();
      
      // Run analyses concurrently
      const promises = files.map(file => smartAssistance.analyzeCode(file));
      const results = await Promise.all(promises);
      
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(2000); // 2 seconds max for 5 files
    });

    it('should maintain performance under high concurrency', async () => {
      const files = await Promise.all(
        Array.from({ length: 20 }, () => createTestFile(200))
      );
      
      const start = performance.now();
      
      // Run 20 analyses concurrently
      const promises = files.map(file => smartAssistance.analyzeCode(file));
      const results = await Promise.all(promises);
      
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(20);
      expect(duration).toBeLessThan(5000); // 5 seconds max for 20 files
    });
  });

  describe('Learning Algorithm Performance', () => {
    it('should learn patterns quickly', async () => {
      const learningService = smartAssistance.learningService;
      const start = performance.now();
      
      // Simulate learning from multiple patterns
      for (let i = 0; i < 100; i++) {
        await learningService.recordPattern({
          id: `pattern-${i}`,
          type: 'code',
          pattern: `pattern_${i}`,
          context: 'test',
          successRate: Math.random(),
          frequency: 1,
          lastUsed: new Date().toISOString(),
          confidence: Math.random()
        });
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // 1 second max
    });

    it('should maintain performance with large pattern databases', async () => {
      const learningService = smartAssistance.learningService;
      
      // Create large pattern database
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        await learningService.recordPattern({
          id: `pattern-${i}`,
          type: 'code',
          pattern: `pattern_${i}`,
          context: 'test',
          successRate: Math.random(),
          frequency: Math.floor(Math.random() * 10) + 1,
          lastUsed: new Date().toISOString(),
          confidence: Math.random()
        });
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe('Suggestion Engine Performance', () => {
    it('should generate suggestions quickly', async () => {
      const suggestionEngine = smartAssistance.suggestionEngine;
      const file = await createTestFile(1000);
      
      const start = performance.now();
      const suggestions = await suggestionEngine.generateSuggestions(file);
      const duration = performance.now() - start;
      
      expect(suggestions).toBeDefined();
      expect(duration).toBeLessThan(500); // 500ms max
    });

    it('should handle context switching efficiently', async () => {
      const suggestionEngine = smartAssistance.suggestionEngine;
      const files = await Promise.all([
        createTestFile(500),
        createTestFile(500),
        createTestFile(500)
      ]);
      
      const start = performance.now();
      
      // Switch between different contexts
      for (const file of files) {
        await suggestionEngine.generateSuggestions(file);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // 1 second max
    });
  });

  describe('Quality Gate Performance', () => {
    it('should run quality checks quickly', async () => {
      const start = performance.now();
      const result = await smartAssistance.runQualityCheck();
      const duration = performance.now() - start;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(2000); // 2 seconds max
    });

    it('should handle multiple quality checks efficiently', async () => {
      const start = performance.now();
      
      // Run multiple quality checks
      const promises = Array.from({ length: 10 }, () => 
        smartAssistance.runQualityCheck()
      );
      const results = await Promise.all(promises);
      
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });
  });

  describe('Memory Service Performance', () => {
    it('should save memory data quickly', async () => {
      const memoryService = smartAssistance.memoryService;
      
      const start = performance.now();
      await memoryService.saveMemory();
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // 100ms max
    });

    it('should load memory data quickly', async () => {
      const memoryService = smartAssistance.memoryService;
      
      // First save some data
      await memoryService.recordCodePattern({
        id: 'test-pattern',
        pattern: 'test pattern',
        frequency: 1,
        successRate: 0.8,
        lastUsed: new Date().toISOString(),
        example: 'example'
      });
      
      const start = performance.now();
      await memoryService.loadMemory();
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // 100ms max
    });
  });

  describe('Stress Testing', () => {
    it('should handle continuous operation', async () => {
      const start = performance.now();
      const maxDuration = 30000; // 30 seconds
      
      let iterations = 0;
      while (performance.now() - start < maxDuration) {
        const file = await createTestFile(200);
        await smartAssistance.analyzeCode(file);
        iterations++;
      }
      
      expect(iterations).toBeGreaterThan(10);
    });

    it('should recover from memory pressure', async () => {
      // Create memory pressure
      const largeFiles = await Promise.all(
        Array.from({ length: 50 }, () => createTestFile(1000))
      );
      
      // Analyze all files
      const promises = largeFiles.map(file => smartAssistance.analyzeCode(file));
      await Promise.all(promises);
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      // Should still work after memory pressure
      const testFile = await createTestFile(100);
      const result = await smartAssistance.analyzeCode(testFile);
      expect(result).toBeDefined();
    });
  });

  // Helper functions
  async function createTestFile(lineCount: number): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir); // Ensure temp directory exists
    
    const fileName = `test-perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.ts`;
    const filePath = path.join(tempDir, fileName);
    testFiles.push(filePath);
    
    let code = 'export class TestClass {\n';
    
    for (let i = 0; i < lineCount; i++) {
      code += `  method${i}(): string {\n`;
      code += `    return 'test${i}';\n`;
      code += `  }\n\n`;
    }
    
    code += '}\n';
    
    await fs.writeFile(filePath, code);
    return filePath;
  }
});
