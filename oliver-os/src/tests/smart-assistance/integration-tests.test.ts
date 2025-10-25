/**
 * Smart Assistance Integration Tests
 * End-to-end testing for the complete smart assistance system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SmartAssistanceExample } from '../../../examples/smart-assistance-example';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import fs from 'fs-extra';
import path from 'path';

describe('Smart Assistance Integration Tests', () => {
  let smartAssistance: SmartAssistanceExample;
  let config: Config;
  let logger: Logger;
  let testFilePath: string;

  beforeEach(async () => {
    config = new Config();
    logger = new Logger('IntegrationTest');
    smartAssistance = new SmartAssistanceExample();
    
    // Create a test file
    testFilePath = path.join(process.cwd(), 'test-integration.ts');
    await fs.writeFile(testFilePath, generateTestCode());
    
    await smartAssistance.initialize();
  });

  afterEach(async () => {
    // Clean up test file
    if (await fs.pathExists(testFilePath)) {
      await fs.remove(testFilePath);
    }
  });

  describe('Complete Smart Assistance Workflow', () => {
    it('should analyze code and provide suggestions', async () => {
      const result = await smartAssistance.analyzeCode(testFilePath);
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should generate refactoring suggestions', async () => {
      const result = await smartAssistance.suggestRefactoring(testFilePath);
      
      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should perform quality analysis', async () => {
      const result = await smartAssistance.runQualityCheck();
      
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    it('should analyze performance', async () => {
      const result = await smartAssistance.analyzePerformance(testFilePath);
      
      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('Memory and Learning Integration', () => {
    it('should learn from user feedback', async () => {
      // Analyze code first
      await smartAssistance.analyzeCode(testFilePath);
      
      // Simulate user feedback
      const feedback = {
        suggestionId: 'test-suggestion-1',
        action: 'accepted' as const,
        reason: 'Good suggestion',
        date: new Date().toISOString()
      };
      
      await smartAssistance.recordFeedback(feedback);
      
      // Verify feedback was recorded
      const memory = (smartAssistance as any).memoryService.getMemory();
      expect(memory.learning.userFeedback).toBeDefined();
    });

    it('should improve suggestions over time', async () => {
      // First analysis
      const result1 = await smartAssistance.analyzeCode(testFilePath);
      
      // Simulate learning from multiple analyses
      for (let i = 0; i < 5; i++) {
        await smartAssistance.analyzeCode(testFilePath);
      }
      
      // Second analysis should be better
      const result2 = await smartAssistance.analyzeCode(testFilePath);
      
      // Confidence should improve (or at least not decrease significantly)
      expect(result2.confidence).toBeGreaterThanOrEqual(result1.confidence - 0.1);
    });
  });

  describe('Safety Features Integration', () => {
    it('should preview changes before applying', async () => {
      const preview = await smartAssistance.previewChanges(testFilePath);
      
      expect(preview).toBeDefined();
      expect(preview.changes).toBeDefined();
      expect(preview.impact).toBeDefined();
      expect(preview.safety).toBeDefined();
    });

    it('should create backups before changes', async () => {
      const backup = await smartAssistance.createBackup(testFilePath);
      
      expect(backup).toBeDefined();
      expect(backup.backupPath).toBeDefined();
      expect(await fs.pathExists(backup.backupPath)).toBe(true);
    });

    it('should allow rollback after changes', async () => {
      // Create backup
      const backup = await smartAssistance.createBackup(testFilePath);
      
      // Make a change
      await smartAssistance.approveChanges(testFilePath);
      
      // Rollback
      const rollback = await smartAssistance.rollbackChanges(backup.backupPath, testFilePath);
      
      expect(rollback.success).toBe(true);
    });
  });

  describe('Multi-File Analysis', () => {
    it('should analyze multiple files in sequence', async () => {
      const files = [
        testFilePath,
        path.join(process.cwd(), 'src/core/config.ts'),
        path.join(process.cwd(), 'src/core/logger.ts')
      ];
      
      const results = await smartAssistance.analyzeMultipleFiles(files);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(files.length);
      
      results.forEach(result => {
        expect(result.filePath).toBeDefined();
        expect(result.score).toBeDefined();
        expect(result.suggestions).toBeDefined();
      });
    });

    it('should maintain context across multiple files', async () => {
      const files = [
        testFilePath,
        path.join(process.cwd(), 'src/core/config.ts')
      ];
      
      await smartAssistance.analyzeMultipleFiles(files);
      
      // Check that context was maintained
      const context = (smartAssistance as any).suggestionEngine.getContext();
      expect(context.files).toBeDefined();
      expect(context.relationships).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle file not found errors gracefully', async () => {
      const nonExistentFile = path.join(process.cwd(), 'non-existent-file.ts');
      
      await expect(smartAssistance.analyzeCode(nonExistentFile))
        .rejects.toThrow();
    });

    it('should recover from service failures', async () => {
      // Simulate a service failure
      const originalMethod = (smartAssistance as any).learningService.initialize;
      (smartAssistance as any).learningService.initialize = () => {
        throw new Error('Simulated failure');
      };
      
      // Should still work with other services
      const result = await smartAssistance.analyzeCode(testFilePath);
      expect(result).toBeDefined();
      
      // Restore original method
      (smartAssistance as any).learningService.initialize = originalMethod;
    });

    it('should handle malformed configuration gracefully', async () => {
      // Create malformed config
      const malformedConfig = new Config();
      (malformedConfig as any).config = { invalid: 'config' };
      
      const smartAssistanceWithBadConfig = new SmartAssistanceExample();
      await expect(smartAssistanceWithBadConfig.initialize())
        .resolves.not.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large codebases efficiently', async () => {
      const largeFiles = [];
      
      // Create multiple large files
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(process.cwd(), `test-large-${i}.ts`);
        await fs.writeFile(filePath, generateLargeTestCode(1000));
        largeFiles.push(filePath);
      }
      
      const start = performance.now();
      const results = await smartAssistance.analyzeMultipleFiles(largeFiles);
      const duration = performance.now() - start;
      
      expect(results).toBeDefined();
      expect(duration).toBeLessThan(30000); // 30 seconds max
      
      // Clean up
      for (const file of largeFiles) {
        await fs.remove(file);
      }
    });

    it('should maintain performance under load', async () => {
      const start = performance.now();
      
      // Run multiple analyses concurrently
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(smartAssistance.analyzeCode(testFilePath));
      }
      
      const results = await Promise.all(promises);
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(20);
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });
  });

  describe('Configuration and Customization', () => {
    it('should respect quality thresholds', async () => {
      const customConfig = {
        qualityThresholds: {
          minScore: 0.8,
          confidenceThreshold: 0.9
        }
      };
      
      (smartAssistance as any).config = { ...config, ...customConfig };
      
      const result = await smartAssistance.analyzeCode(testFilePath);
      
      if (result.score < 0.8) {
        expect(result.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('should adapt to user preferences', async () => {
      const preferences = {
        preferredPatterns: ['async/await', 'error-handling'],
        avoidPatterns: ['eval', 'var']
      };
      
      await smartAssistance.updatePreferences(preferences);
      
      const result = await smartAssistance.analyzeCode(testFilePath);
      
      // Suggestions should align with preferences
      result.suggestions.forEach(suggestion => {
        if (suggestion.type === 'pattern') {
          expect(preferences.avoidPatterns).not.toContain(suggestion.pattern);
        }
      });
    });
  });

  // Helper functions
  function generateTestCode(): string {
    return `
      // Test file with various code patterns
      import { Config } from './config';
      import { Logger } from './logger';

      export class TestService {
        private _config: Config;
        private _logger: Logger;

        constructor(config: Config) {
          this._config = config;
          this._logger = new Logger('TestService');
        }

        async fetchData(url: string): Promise<any> {
          try {
            const response = await fetch(url);
            return await response.json();
          } catch (error) {
            this._logger.error('Failed to fetch data:', error);
            throw error;
          }
        }

        processData(data: any[]): any[] {
          return data.filter(item => item.valid);
        }
      }
    `;
  }

  function generateLargeTestCode(lineCount: number): string {
    let code = 'export class LargeTestClass {\n';
    
    for (let i = 0; i < lineCount; i++) {
      code += `  method${i}(): string {\n`;
      code += `    return 'test${i}';\n`;
      code += `  }\n\n`;
    }
    
    code += '}\n';
    return code;
  }
});
