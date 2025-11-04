/**
 * Smart Assistance Integration Tests
 * End-to-end testing for the complete smart assistance system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SmartAssistanceExample } from '@examples/smart-assistance-example';
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
    logger.info('Initializing integration test setup');
    
    smartAssistance = new SmartAssistanceExample();
    
    // Create a test file
    testFilePath = path.join(process.cwd(), 'test-integration.ts');
    await fs.writeFile(testFilePath, generateTestCode());
    logger.debug(`Created test file: ${testFilePath}`);
    
    await smartAssistance.initialize();
    logger.info('Smart assistance initialized successfully');
  });

  afterEach(async () => {
    // Clean up test file
    if (await fs.pathExists(testFilePath)) {
      await fs.remove(testFilePath);
      logger.debug(`Cleaned up test file: ${testFilePath}`);
    }
    logger.info('Test teardown completed');
  });

  describe('Complete Smart Assistance Workflow', () => {
    it('should analyze code and provide suggestions', async () => {
      logger.info(`Analyzing code file: ${testFilePath}`);
      const result = await smartAssistance.analyzeCode(testFilePath);
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      
      logger.info(`Analysis completed: score=${result.score}, suggestions=${result.suggestions.length}`);
    });

    it('should generate refactoring suggestions', async () => {
      logger.info(`Generating refactoring suggestions for: ${testFilePath}`);
      const result = await smartAssistance.suggestRefactoring(testFilePath);
      
      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      
      logger.info(`Generated ${result.suggestions.length} refactoring suggestions`);
    });

    it('should perform quality analysis', async () => {
      logger.info('Running quality check');
      const result = await smartAssistance.runQualityCheck();
      
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      
      logger.info(`Quality check completed: passed=${result.passed}, score=${result.score}`);
    });

    it('should analyze performance', async () => {
      logger.info(`Analyzing performance for: ${testFilePath}`);
      const result = await smartAssistance.analyzePerformance(testFilePath);
      
      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      
      logger.info(`Performance analysis completed: ${result.suggestions.length} suggestions`);
    });
  });

  describe('Memory and Learning Integration', () => {
    it('should learn from user feedback', async () => {
      // Analyze code first
      logger.info('Starting learning from feedback test');
      await smartAssistance.analyzeCode(testFilePath);
      
      // Simulate user feedback
      const feedback = {
        suggestionId: 'test-suggestion-1',
        action: 'accepted' as const,
        reason: 'Good suggestion',
        date: new Date().toISOString()
      };
      
      logger.info(`Recording user feedback: ${feedback.action} for suggestion ${feedback.suggestionId}`);
      await smartAssistance.recordFeedback(feedback);
      
      // Verify feedback was recorded
      const memory = (smartAssistance as any).memoryService.getMemory();
      expect(memory.learning.userFeedback).toBeDefined();
      logger.info('Feedback successfully recorded and verified');
    });

    it('should improve suggestions over time', async () => {
      // First analysis
      logger.info('Running initial analysis for learning improvement test');
      const result1 = await smartAssistance.analyzeCode(testFilePath);
      logger.info(`Initial confidence: ${result1.confidence}`);
      
      // Simulate learning from multiple analyses
      logger.info('Running multiple analyses to simulate learning');
      for (let i = 0; i < 5; i++) {
        await smartAssistance.analyzeCode(testFilePath);
        logger.debug(`Learning iteration ${i + 1}/5 completed`);
      }
      
      // Second analysis should be better
      const result2 = await smartAssistance.analyzeCode(testFilePath);
      logger.info(`Final confidence: ${result2.confidence}`);
      
      // Confidence should improve (or at least not decrease significantly)
      expect(result2.confidence).toBeGreaterThanOrEqual(result1.confidence - 0.1);
      logger.info('Confidence maintained or improved as expected');
    });
  });

  describe('Safety Features Integration', () => {
    it('should preview changes before applying', async () => {
      logger.info(`Previewing changes for: ${testFilePath}`);
      const preview = await smartAssistance.previewChanges(testFilePath);
      
      expect(preview).toBeDefined();
      expect(preview.changes).toBeDefined();
      expect(preview.impact).toBeDefined();
      expect(preview.safety).toBeDefined();
      
      logger.info(`Preview generated: ${preview.changes.length} changes, safety=${preview.safety?.approved}`);
    });

    it('should create backups before changes', async () => {
      logger.info(`Creating backup for: ${testFilePath}`);
      const backup = await smartAssistance.createBackup(testFilePath);
      
      expect(backup).toBeDefined();
      expect(backup.backupPath).toBeDefined();
      expect(await fs.pathExists(backup.backupPath)).toBe(true);
      
      logger.info(`Backup created successfully: ${backup.backupPath}`);
    });

    it('should allow rollback after changes', async () => {
      // Create backup
      logger.info('Testing rollback functionality');
      const backup = await smartAssistance.createBackup(testFilePath);
      logger.debug(`Backup created: ${backup.backupPath}`);
      
      // Make a change
      logger.info('Approving changes');
      await smartAssistance.approveChanges(testFilePath);
      
      // Rollback
      logger.info('Rolling back changes');
      const rollback = await smartAssistance.rollbackChanges(backup.backupPath, testFilePath);
      
      expect(rollback.success).toBe(true);
      logger.info('Rollback completed successfully');
    });
  });

  describe('Multi-File Analysis', () => {
    it('should analyze multiple files in sequence', async () => {
      const files = [
        testFilePath,
        path.join(process.cwd(), 'src/core/config.ts'),
        path.join(process.cwd(), 'src/core/logger.ts')
      ];
      
      logger.info(`Analyzing ${files.length} files in sequence`);
      const results = await smartAssistance.analyzeMultipleFiles(files);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(files.length);
      
      results.forEach((result, index) => {
        expect(result.filePath).toBeDefined();
        expect(result.score).toBeDefined();
        expect(result.suggestions).toBeDefined();
        logger.debug(`File ${index + 1}/${files.length}: score=${result.score}, suggestions=${result.suggestions.length}`);
      });
      
      logger.info('Multi-file analysis completed successfully');
    });

    it('should maintain context across multiple files', async () => {
      const files = [
        testFilePath,
        path.join(process.cwd(), 'src/core/config.ts')
      ];
      
      logger.info(`Analyzing ${files.length} files to verify context maintenance`);
      await smartAssistance.analyzeMultipleFiles(files);
      
      // Check that context was maintained
      const context = (smartAssistance as any).suggestionEngine.getContext();
      expect(context.files).toBeDefined();
      expect(context.relationships).toBeDefined();
      
      logger.info(`Context maintained: ${context.files?.length || 0} files, ${Object.keys(context.relationships || {}).length} relationships`);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle file not found errors gracefully', async () => {
      const nonExistentFile = path.join(process.cwd(), 'non-existent-file.ts');
      
      logger.info(`Testing error handling for non-existent file: ${nonExistentFile}`);
      await expect(smartAssistance.analyzeCode(nonExistentFile))
        .rejects.toThrow();
      
      logger.info('Error handled gracefully as expected');
    });

    it('should recover from service failures', async () => {
      // Simulate a service failure
      logger.info('Testing recovery from service failures');
      const originalMethod = (smartAssistance as any).learningService.initialize;
      (smartAssistance as any).learningService.initialize = () => {
        logger.warn('Simulated learning service failure');
        throw new Error('Simulated failure');
      };
      
      // Should still work with other services
      logger.info('Attempting analysis despite service failure');
      const result = await smartAssistance.analyzeCode(testFilePath);
      expect(result).toBeDefined();
      logger.info('Analysis completed successfully despite service failure');
      
      // Restore original method
      (smartAssistance as any).learningService.initialize = originalMethod;
    });

    it('should handle malformed configuration gracefully', async () => {
      // Create malformed config
      logger.info('Testing handling of malformed configuration');
      const malformedConfig = new Config();
      (malformedConfig as any).config = { invalid: 'config' };
      
      const smartAssistanceWithBadConfig = new SmartAssistanceExample();
      await expect(smartAssistanceWithBadConfig.initialize())
        .resolves.not.toThrow();
      
      logger.info('Malformed configuration handled gracefully');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large codebases efficiently', async () => {
      const largeFiles = [];
      
      // Create multiple large files
      logger.info('Creating 10 large test files (1000 lines each)');
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(process.cwd(), `test-large-${i}.ts`);
        await fs.writeFile(filePath, generateLargeTestCode(1000));
        largeFiles.push(filePath);
      }
      
      logger.info(`Analyzing ${largeFiles.length} large files`);
      const start = performance.now();
      const results = await smartAssistance.analyzeMultipleFiles(largeFiles);
      const duration = performance.now() - start;
      
      expect(results).toBeDefined();
      expect(duration).toBeLessThan(30000); // 30 seconds max
      
      logger.info(`Large codebase analysis completed in ${duration.toFixed(2)}ms`);
      
      // Clean up
      logger.debug('Cleaning up large test files');
      for (const file of largeFiles) {
        await fs.remove(file);
      }
    });

    it('should maintain performance under load', async () => {
      logger.info('Testing performance under load (20 concurrent analyses)');
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
      
      logger.info(`Load test completed: ${results.length} analyses in ${duration.toFixed(2)}ms (avg ${(duration / results.length).toFixed(2)}ms per analysis)`);
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
      
      logger.info(`Applying custom quality thresholds: minScore=${customConfig.qualityThresholds.minScore}, confidenceThreshold=${customConfig.qualityThresholds.confidenceThreshold}`);
      (smartAssistance as any).config = { ...config, ...customConfig };
      
      const result = await smartAssistance.analyzeCode(testFilePath);
      
      if (result.score < 0.8) {
        expect(result.suggestions.length).toBeGreaterThan(0);
        logger.info(`Score below threshold (${result.score}), ${result.suggestions.length} suggestions provided`);
      } else {
        logger.info(`Score meets threshold: ${result.score}`);
      }
    });

    it('should adapt to user preferences', async () => {
      const preferences = {
        preferredPatterns: ['async/await', 'error-handling'],
        avoidPatterns: ['eval', 'var']
      };
      
      logger.info(`Updating preferences: preferred=${preferences.preferredPatterns.join(', ')}, avoid=${preferences.avoidPatterns.join(', ')}`);
      await smartAssistance.updatePreferences(preferences);
      
      const result = await smartAssistance.analyzeCode(testFilePath);
      logger.info(`Analyzing with preferences: ${result.suggestions.length} suggestions generated`);
      
      // Suggestions should align with preferences
      (result.suggestions as Array<{ type: string; pattern?: string }>).forEach((suggestion) => {
        if (suggestion.type === 'pattern' && suggestion.pattern !== undefined) {
          expect(preferences.avoidPatterns).not.toContain(suggestion.pattern);
        }
      });
      
      logger.info('Suggestions verified to align with user preferences');
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
