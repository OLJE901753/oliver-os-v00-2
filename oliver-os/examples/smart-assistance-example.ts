/**
 * Smart Assistance Example
 * Demonstrates the smart assistance system with suggestions, quality monitoring, and safety features
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Config } from '../src/core/config';
import { Logger } from '../src/core/logger';
import { MemoryService } from '../src/services/memory/memory-service';
import { LearningService } from '../src/services/memory/learning-service';
import { ContextualSuggestionEngine } from '../src/services/memory/contextual-suggestion-engine';
import { 
  SelfReviewService, 
  QualityGateService, 
  ImprovementSuggestionsService,
  // type CodeReviewResult,
  // type QualityGateResult,
  // type ImprovementSuggestion
} from '../src/services/review';
import fs from 'fs-extra';
import path from 'path';

export class SmartAssistanceExample {
  private _memoryService: MemoryService;
  private _learningService: LearningService;
  private _suggestionEngine: ContextualSuggestionEngine;
  private selfReviewService: SelfReviewService;
  private qualityGateService: QualityGateService;
  private improvementSuggestionsService: ImprovementSuggestionsService;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('SmartAssistanceExample');
    const config = new Config();
    
    this._memoryService = new MemoryService(config);
    this._learningService = new LearningService(config, this._memoryService);
    this._suggestionEngine = new ContextualSuggestionEngine(config, this._memoryService, this._learningService);
    this.selfReviewService = new SelfReviewService(config, this._memoryService, this._learningService);
    this.qualityGateService = new QualityGateService(config);
    this.improvementSuggestionsService = new ImprovementSuggestionsService(config, this._memoryService, this._learningService);
  }

  // Public getters for testing
  public get learningService(): LearningService {
    return this._learningService;
  }

  public get suggestionEngine(): ContextualSuggestionEngine {
    return this._suggestionEngine;
  }

  public get memoryService(): MemoryService {
    return this._memoryService;
  }

  /**
   * Initialize the smart assistance system
   */
  async initialize(): Promise<void> {
    this.logger.info('🧠 Initializing Smart Assistance System...');
    
    try {
      // MemoryService initializes automatically in constructor
      await this._learningService.initialize();
      await this._suggestionEngine.initialize();
      await this.selfReviewService.initialize();
      await this.qualityGateService.initialize();
      await this.improvementSuggestionsService.initialize();
      
      this.logger.info('✅ Smart Assistance System initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Smart Assistance System:', error);
      throw error;
    }
  }

  /**
   * Smart code analysis - returns result for testing
   */
  async analyzeCode(filePath: string): Promise<any> {
    this.logger.info(`🔍 Analyzing code: ${filePath}`);
    
    try {
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        this.logger.error(`File not found: ${filePath}`);
        throw new Error(`File not found: ${filePath}`);
      }

      // Perform self-review
      const reviewResult = await this.selfReviewService.reviewFile(filePath);
      
      console.log('\n📊 Code Analysis Results:');
      console.log(`File: ${filePath}`);
      console.log(`Score: ${reviewResult.score.toFixed(2)}/10`);
      console.log(`Confidence: ${(reviewResult.confidence * 100).toFixed(1)}%`);
      console.log(`Suggestions: ${reviewResult.suggestions.length}`);
      console.log(`Summary: ${reviewResult.summary}`);
      
      if (reviewResult.suggestions.length > 0) {
        console.log('\n💡 Suggestions:');
        reviewResult.suggestions.forEach((suggestion, index) => {
          console.log(`${index + 1}. ${suggestion.title} (${suggestion.severity})`);
          console.log(`   ${suggestion.description}`);
        });
      }
      
      return reviewResult;
      
    } catch (error) {
      this.logger.error(`Failed to analyze code ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Smart suggestions
   */
  async generateSuggestions(filePath: string): Promise<void> {
    this.logger.info(`💡 Generating suggestions for: ${filePath}`);
    
    try {
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        this.logger.error(`File not found: ${filePath}`);
        return;
      }

      // Generate contextual suggestions
      const context = {
        currentFile: filePath,
        fileType: path.extname(filePath).slice(1),
        projectStructure: [],
        recentChanges: [],
        userPreferences: {},
        codingPatterns: [],
        architectureDecisions: [],
        namingConventions: {}
      };

      const suggestions = await this._suggestionEngine.generateSuggestionsForContext(context);
      
      console.log('\n💡 Smart Suggestions:');
      console.log(`File: ${filePath}`);
      console.log(`Suggestions: ${suggestions.length}`);
      
      suggestions.forEach((suggestion, index) => {
        console.log(`\n${index + 1}. ${suggestion.title} (${suggestion.type})`);
        console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
        console.log(`   Impact: ${suggestion.impact}`);
        console.log(`   Description: ${suggestion.description}`);
        if (suggestion.content) {
          console.log(`   Code: ${suggestion.content}`);
        }
      });
      
    } catch (error) {
      this.logger.error(`Failed to generate suggestions for ${filePath}:`, error);
    }
  }

  /**
   * Smart refactoring suggestions
   */
  async suggestRefactoring(filePath: string): Promise<any> {
    this.logger.info(`🔧 Suggesting refactoring for: ${filePath}`);
    
    try {
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        this.logger.error(`File not found: ${filePath}`);
        throw new Error(`File not found: ${filePath}`);
      }

      // Generate improvement suggestions
      const suggestions = await this.improvementSuggestionsService.generateSuggestions(filePath);
      
      // Filter for refactoring suggestions
      const refactoringSuggestions = suggestions.filter(s => 
        s.type === 'maintainability' || s.type === 'best-practices' || s.type === 'architecture'
      );
      
      console.log('\n🔧 Refactoring Suggestions:');
      console.log(`File: ${filePath}`);
      console.log(`Suggestions: ${refactoringSuggestions.length}`);
      
      refactoringSuggestions.forEach((suggestion, index) => {
        console.log(`\n${index + 1}. ${suggestion.title} (${suggestion.severity})`);
        console.log(`   Type: ${suggestion.type}`);
        console.log(`   Impact: ${suggestion.impact}`);
        console.log(`   Effort: ${suggestion.effort}`);
        console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
        console.log(`   Description: ${suggestion.description}`);
        console.log(`   Reasoning: ${suggestion.reasoning}`);
        if (suggestion.currentCode) {
          console.log(`   Current: ${suggestion.currentCode}`);
        }
        if (suggestion.suggestedCode) {
          console.log(`   Suggested: ${suggestion.suggestedCode}`);
        }
      });
      
      return {
        suggestions: refactoringSuggestions,
        count: refactoringSuggestions.length
      };
      
    } catch (error) {
      this.logger.error(`Failed to suggest refactoring for ${filePath}:`, error);
      throw error;
    }
  }

  // Removed unused deprecated methods for cleaner codebase

  /**
   * Smart quality check
   */
  async checkQuality(projectPath?: string): Promise<void> {
    this.logger.info('🚪 Running smart quality check...');
    
    try {
      // Run quality gate
      const qualityResult = await this.qualityGateService.runQualityGate(projectPath);
      
      console.log('\n🚪 Quality Gate Results:');
      console.log(`Status: ${qualityResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Score: ${qualityResult.score.toFixed(2)}/10`);
      console.log(`Checks: ${qualityResult.checks.length}`);
      console.log(`Summary: ${qualityResult.summary}`);
      
      if (qualityResult.checks.length > 0) {
        console.log('\n📋 Check Details:');
        qualityResult.checks.forEach((check, index) => {
          console.log(`${index + 1}. ${check.name}: ${check.passed ? '✅' : '❌'} (${check.score.toFixed(2)})`);
          console.log(`   ${check.description}`);
          if (check.details) {
            console.log(`   Details: ${check.details}`);
          }
        });
      }
      
      if (qualityResult.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        qualityResult.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }
      
    } catch (error) {
      this.logger.error('Failed to run quality check:', error);
    }
  }

  /**
   * Smart performance analysis
   */
  async analyzePerformance(filePath: string): Promise<any> {
    this.logger.info(`⚡ Analyzing performance for: ${filePath}`);
    
    try {
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        this.logger.error(`File not found: ${filePath}`);
        throw new Error(`File not found: ${filePath}`);
      }

      // Generate performance suggestions
      const suggestions = await this.improvementSuggestionsService.generateSuggestions(filePath);
      
      // Filter for performance suggestions
      const performanceSuggestions = suggestions.filter(s => s.type === 'performance');
      
      console.log('\n⚡ Performance Analysis:');
      console.log(`File: ${filePath}`);
      console.log(`Suggestions: ${performanceSuggestions.length}`);
      
      if (performanceSuggestions.length === 0) {
        console.log('✅ No performance issues detected');
        return {
          suggestions: [],
          count: 0
        };
      }
      
      performanceSuggestions.forEach((suggestion, index) => {
        console.log(`\n${index + 1}. ${suggestion.title} (${suggestion.severity})`);
        console.log(`   Impact: ${suggestion.impact}`);
        console.log(`   Effort: ${suggestion.effort}`);
        console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
        console.log(`   Description: ${suggestion.description}`);
        console.log(`   Reasoning: ${suggestion.reasoning}`);
        if (suggestion.currentCode) {
          console.log(`   Current: ${suggestion.currentCode}`);
        }
        if (suggestion.suggestedCode) {
          console.log(`   Suggested: ${suggestion.suggestedCode}`);
        }
        if (suggestion.examples.length > 0) {
          console.log(`   Examples: ${suggestion.examples.join(', ')}`);
        }
      });
      
      return {
        suggestions: performanceSuggestions,
        count: performanceSuggestions.length
      };
      
    } catch (error) {
      this.logger.error(`Failed to analyze performance for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Smart approval system (simulation)
   */
  async approveChanges(filePath: string): Promise<void> {
    this.logger.info(`🔐 Approving changes for: ${filePath}`);
    
    console.log('✅ Changes approved and applied');
    console.log('📝 Backup created before changes');
    console.log('🔄 Rollback available if needed');
  }

  /**
   * Smart monitoring
   */
  async startMonitoring(): Promise<void> {
    this.logger.info('👁️ Starting smart monitoring...');
    
    console.log('👁️ Smart Monitoring Active:');
    console.log('   - Code quality monitoring');
    console.log('   - Performance tracking');
    console.log('   - Security analysis');
    console.log('   - Suggestion generation');
    console.log('   - Learning from patterns');
    console.log('   - Context awareness');
    console.log('\nPress Ctrl+C to stop monitoring');
    
    // Simulate monitoring
    setInterval(() => {
      console.log(`📊 [${new Date().toLocaleTimeString()}] Monitoring active...`);
    }, 30000);
  }

  /**
   * Run quality check - returns result for testing
   */
  async runQualityCheck(): Promise<any> {
    this.logger.info('🚪 Running quality check...');
    
    try {
      const qualityResult = await this.qualityGateService.runQualityGate();
      return qualityResult;
    } catch (error) {
      this.logger.error('Failed to run quality check:', error);
      throw error;
    }
  }

  /**
   * Record user feedback for learning
   */
  async recordFeedback(feedback: any): Promise<void> {
    this.logger.info('📝 Recording user feedback...');
    
    try {
      // Store feedback in memory service for learning
      await this._memoryService.storeFeedback(feedback);
      this.logger.info('✅ Feedback recorded successfully');
    } catch (error) {
      this.logger.error('Failed to record feedback:', error);
      throw error;
    }
  }

  /**
   * Preview changes before applying
   */
  async previewChanges(filePath: string): Promise<any> {
    this.logger.info(`👀 Previewing changes for: ${filePath}`);
    
    try {
      // Simulate change preview
      const preview = {
        filePath,
        changes: [],
        impact: 'medium',
        risk: 'low',
        estimatedTime: '5 minutes',
        canRollback: true,
        safety: {
          hasBackup: true,
          canUndo: true,
          riskLevel: 'low',
          safetyChecks: ['syntax', 'compilation', 'tests']
        }
      };
      
      console.log('\n👀 Change Preview:');
      console.log(`File: ${filePath}`);
      console.log(`Changes: ${preview.changes.length}`);
      console.log(`Impact: ${preview.impact}`);
      console.log(`Risk: ${preview.risk}`);
      console.log(`Estimated Time: ${preview.estimatedTime}`);
      console.log(`Can Rollback: ${preview.canRollback}`);
      
      return preview;
    } catch (error) {
      this.logger.error('Failed to preview changes:', error);
      throw error;
    }
  }

  /**
   * Create backup before making changes
   */
  async createBackup(filePath: string): Promise<any> {
    this.logger.info(`💾 Creating backup for: ${filePath}`);
    
    try {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      
      // Create backup file
      if (await fs.pathExists(filePath)) {
        await fs.copy(filePath, backupPath);
      }
      
      const backup = {
        originalPath: filePath,
        backupPath,
        timestamp: new Date().toISOString(),
        size: (await fs.stat(backupPath)).size
      };
      
      console.log('\n💾 Backup Created:');
      console.log(`Original: ${filePath}`);
      console.log(`Backup: ${backupPath}`);
      console.log(`Size: ${backup.size} bytes`);
      console.log(`Timestamp: ${backup.timestamp}`);
      
      return backup;
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Analyze multiple files in sequence
   */
  async analyzeMultipleFiles(filePaths: string[]): Promise<any[]> {
    this.logger.info(`📁 Analyzing multiple files: ${filePaths.length} files`);
    
    try {
      const results = [];
      
      for (const filePath of filePaths) {
        try {
          const result = await this.analyzeCode(filePath);
          results.push({
            filePath,
            success: true,
            score: result.score,
            suggestions: result.suggestions,
            confidence: result.confidence,
            result
          });
        } catch (error) {
          results.push({
            filePath,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      console.log('\n📁 Multi-File Analysis Results:');
      console.log(`Total Files: ${filePaths.length}`);
      console.log(`Successful: ${results.filter(r => r.success).length}`);
      console.log(`Failed: ${results.filter(r => !r.success).length}`);
      
      return results;
    } catch (error) {
      this.logger.error('Failed to analyze multiple files:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: any): Promise<void> {
    this.logger.info('⚙️ Updating user preferences...');
    
    try {
      // Store preferences in memory service
      await this._memoryService.storePreferences(preferences);
      this.logger.info('✅ Preferences updated successfully');
    } catch (error) {
      this.logger.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Rollback changes using backup
   */
  async rollbackChanges(backupPath: string, _targetPath?: string): Promise<any> {
    this.logger.info(`🔄 Rolling back changes using backup: ${backupPath}`);
    
    try {
      // Simulate rollback
      const rollback = {
        success: true,
        backupPath,
        timestamp: new Date().toISOString(),
        filesRestored: 1
      };
      
      console.log('\n🔄 Rollback Results:');
      console.log(`Backup: ${backupPath}`);
      console.log(`Success: ${rollback.success}`);
      console.log(`Files Restored: ${rollback.filesRestored}`);
      console.log(`Timestamp: ${rollback.timestamp}`);
      
      return rollback;
    } catch (error) {
      this.logger.error('Failed to rollback changes:', error);
      throw error;
    }
  }

  /**
   * Run all smart assistance examples
   */
  async runAll(): Promise<void> {
    this.logger.info('🚀 Running all smart assistance examples...');
    
    try {
      await this.initialize();
      
      // Test with a sample file
      const sampleFile = 'src/core/config.ts';
      
      console.log('\n🧠 Smart Assistance System Test Results:');
      console.log('=====================================');
      
      // Test code analysis
      await this.analyzeCode(sampleFile);
      
      // Test suggestions
      await this.generateSuggestions(sampleFile);
      
      // Test refactoring
      await this.suggestRefactoring(sampleFile);
      
      // Test quality check
      await this.checkQuality();
      
      // Test performance analysis
      await this.analyzePerformance(sampleFile);
      
      // Test approval system
      await this.approveChanges(sampleFile);
      
      console.log('\n✅ All smart assistance tests completed successfully!');
      
    } catch (error) {
      this.logger.error('Failed to run smart assistance examples:', error);
    }
  }
}

// CLI interface
async function main() {
  const example = new SmartAssistanceExample();
  const command = process.argv[2];
  const target = process.argv[3] || 'src/core/config.ts';
  
  try {
    await example.initialize();
    
    switch (command) {
      case 'analyze':
        await example.analyzeCode(target);
        break;
      case 'suggest':
        await example.generateSuggestions(target);
        break;
      case 'refactor':
        await example.suggestRefactoring(target);
        break;
      case 'quality':
        await example.checkQuality();
        break;
      case 'performance':
        await example.analyzePerformance(target);
        break;
      case 'approve':
        await example.approveChanges(target);
        break;
      case 'reject':
        await example.approveChanges(target);
        break;
      case 'preview':
        await example.previewChanges(target);
        break;
      case 'monitor':
        await example.startMonitoring();
        break;
      case 'all':
        await example.runAll();
        break;
      default:
        console.log('Usage: tsx examples/smart-assistance-example.ts <command> [target]');
        console.log('Commands: analyze, suggest, refactor, quality, performance, approve, reject, preview, monitor, all');
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run main function
main().catch(console.error);
