/**
 * Self-Review and Quality Gate Example
 * Demonstrates the comprehensive self-review and quality gate system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Config } from '../src/core/config';
import { Logger } from '../src/core/logger';
import { MemoryService } from '../src/services/memory/memory-service';
import { LearningService } from '../src/services/memory/learning-service';
import { 
  SelfReviewService, 
  QualityGateService, 
  ChangeDocumentationService, 
  VisualDocumentationService, 
  ImprovementSuggestionsService, 
  BranchManagementService,
  type CodeReviewResult,
  type QualityGateResult,
  type ChangeDocumentation,
  type VisualDocumentation,
  type ImprovementSuggestion,
  type SoloWorkflow
} from '../src/services/review';

export class SelfReviewExample {
  private selfReviewService: SelfReviewService;
  private qualityGateService: QualityGateService;
  private changeDocumentationService: ChangeDocumentationService;
  private visualDocumentationService: VisualDocumentationService;
  private improvementSuggestionsService: ImprovementSuggestionsService;
  private branchManagementService: BranchManagementService;
  private memoryService: MemoryService;
  private learningService: LearningService;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('SelfReviewExample');
    const config = new Config();
    
    this.memoryService = new MemoryService(config);
    this.learningService = new LearningService(config, this.memoryService);
    
    this.selfReviewService = new SelfReviewService(config, this.memoryService, this.learningService);
    this.qualityGateService = new QualityGateService(config);
    this.changeDocumentationService = new ChangeDocumentationService(config);
    this.visualDocumentationService = new VisualDocumentationService(config);
    this.improvementSuggestionsService = new ImprovementSuggestionsService(config, this.memoryService, this.learningService);
    this.branchManagementService = new BranchManagementService(config);
  }

  /**
   * Initialize the self-review and quality gate system
   */
  async initialize(): Promise<void> {
    this.logger.info('🔍 Initializing Self-Review and Quality Gate System...');
    
    try {
      await this.memoryService.initialize();
      await this.learningService.initialize();
      
      await this.selfReviewService.initialize();
      await this.qualityGateService.initialize();
      await this.changeDocumentationService.initialize();
      await this.visualDocumentationService.initialize();
      await this.improvementSuggestionsService.initialize();
      await this.branchManagementService.initialize();
      
      this.logger.info('✅ Self-Review and Quality Gate System initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize self-review and quality gate system', error);
      throw error;
    }
  }

  /**
   * Example 1: Self-Review a File
   */
  async runSelfReview(): Promise<void> {
    this.logger.info('🔍 Running Self-Review Example...');
    
    try {
      // Review a sample file
      const filePath = 'src/services/review/self-review-service.ts';
      const reviewResult = await this.selfReviewService.reviewFile(filePath);
      
      this.logger.info('📊 Self-Review Results:');
      this.logger.info(`  File: ${reviewResult.filePath}`);
      this.logger.info(`  Score: ${(reviewResult.score * 100).toFixed(1)}%`);
      this.logger.info(`  Confidence: ${(reviewResult.confidence * 100).toFixed(1)}%`);
      this.logger.info(`  Suggestions: ${reviewResult.suggestions.length}`);
      this.logger.info(`  Summary: ${reviewResult.summary}`);
      
      // Display suggestions
      reviewResult.suggestions.forEach((suggestion, index) => {
        this.logger.info(`  ${index + 1}. ${suggestion.title} (${suggestion.severity})`);
        this.logger.info(`     ${suggestion.description}`);
      });
      
      this.logger.info('✅ Self-review completed successfully');
    } catch (error) {
      this.logger.error('❌ Self-review failed:', error);
    }
  }

  /**
   * Example 2: Run Quality Gate
   */
  async runQualityGate(): Promise<void> {
    this.logger.info('🚪 Running Quality Gate Example...');
    
    try {
      const qualityGateResult = await this.qualityGateService.runQualityGate();
      
      this.logger.info('📊 Quality Gate Results:');
      this.logger.info(`  Passed: ${qualityGateResult.passed}`);
      this.logger.info(`  Score: ${(qualityGateResult.score * 100).toFixed(1)}%`);
      this.logger.info(`  Summary: ${qualityGateResult.summary}`);
      
      // Display checks
      qualityGateResult.checks.forEach((check, index) => {
        this.logger.info(`  ${index + 1}. ${check.name}: ${check.passed ? 'PASSED' : 'FAILED'} (${(check.score * 100).toFixed(1)}%)`);
        this.logger.info(`     ${check.details}`);
      });
      
      // Display recommendations
      if (qualityGateResult.recommendations.length > 0) {
        this.logger.info('📋 Recommendations:');
        qualityGateResult.recommendations.forEach((recommendation, index) => {
          this.logger.info(`  ${index + 1}. ${recommendation}`);
        });
      }
      
      this.logger.info('✅ Quality gate completed successfully');
    } catch (error) {
      this.logger.error('❌ Quality gate failed:', error);
    }
  }

  /**
   * Example 3: Document Changes
   */
  async documentChanges(): Promise<void> {
    this.logger.info('📝 Documenting Changes Example...');
    
    try {
      const changeDocumentation = await this.changeDocumentationService.documentCurrentChanges();
      
      this.logger.info('📊 Change Documentation:');
      this.logger.info(`  ID: ${changeDocumentation.id}`);
      this.logger.info(`  Branch: ${changeDocumentation.branch}`);
      this.logger.info(`  Commit: ${changeDocumentation.commit}`);
      this.logger.info(`  Category: ${changeDocumentation.category}`);
      this.logger.info(`  Impact: ${changeDocumentation.impact}`);
      this.logger.info(`  Summary: ${changeDocumentation.summary}`);
      this.logger.info(`  Reasoning: ${changeDocumentation.reasoning}`);
      
      // Display changes
      this.logger.info('📋 Changes:');
      changeDocumentation.changes.forEach((change, index) => {
        this.logger.info(`  ${index + 1}. ${change.filePath} (${change.changeType})`);
        this.logger.info(`     Lines: +${change.linesAdded} -${change.linesDeleted}`);
        this.logger.info(`     Impact: ${change.impact}, Complexity: ${change.complexity}`);
      });
      
      // Display testing recommendations
      this.logger.info('🧪 Testing Recommendations:');
      this.logger.info(`  ${changeDocumentation.testing}`);
      
      // Display rollback instructions
      this.logger.info('🔄 Rollback Instructions:');
      this.logger.info(`  ${changeDocumentation.rollback}`);
      
      this.logger.info('✅ Change documentation completed successfully');
    } catch (error) {
      this.logger.error('❌ Change documentation failed:', error);
    }
  }

  /**
   * Example 4: Generate Visual Documentation
   */
  async generateVisualDocumentation(): Promise<void> {
    this.logger.info('📊 Generating Visual Documentation Example...');
    
    try {
      const filePath = 'src/services/review/self-review-service.ts';
      const visualDocumentation = await this.visualDocumentationService.generateVisualDocumentation(filePath);
      
      this.logger.info('📊 Visual Documentation Results:');
      this.logger.info(`  ID: ${visualDocumentation.id}`);
      this.logger.info(`  File: ${visualDocumentation.filePath}`);
      this.logger.info(`  Complexity: ${visualDocumentation.complexity}`);
      this.logger.info(`  Summary: ${visualDocumentation.summary}`);
      
      // Display diagrams
      this.logger.info('📋 Generated Diagrams:');
      visualDocumentation.diagrams.forEach((diagram, index) => {
        this.logger.info(`  ${index + 1}. ${diagram.title} (${diagram.type})`);
        this.logger.info(`     Format: ${diagram.format}, Complexity: ${diagram.complexity}`);
        this.logger.info(`     Description: ${diagram.description}`);
      });
      
      this.logger.info('✅ Visual documentation generated successfully');
    } catch (error) {
      this.logger.error('❌ Visual documentation generation failed:', error);
    }
  }

  /**
   * Example 5: Generate Improvement Suggestions
   */
  async generateImprovementSuggestions(): Promise<void> {
    this.logger.info('💡 Generating Improvement Suggestions Example...');
    
    try {
      const filePath = 'src/services/review/self-review-service.ts';
      const suggestions = await this.improvementSuggestionsService.generateSuggestions(filePath);
      
      this.logger.info('📊 Improvement Suggestions Results:');
      this.logger.info(`  Total Suggestions: ${suggestions.length}`);
      
      // Display suggestions by type
      const suggestionsByType = suggestions.reduce((acc, suggestion) => {
        acc[suggestion.type] = (acc[suggestion.type] || 0) + 1;
        return acc;
      }, {} as any);
      
      this.logger.info('📋 Suggestions by Type:');
      Object.entries(suggestionsByType).forEach(([type, count]) => {
        this.logger.info(`  ${type}: ${count} suggestions`);
      });
      
      // Display top suggestions
      this.logger.info('📋 Top Suggestions:');
      suggestions.slice(0, 5).forEach((suggestion, index) => {
        this.logger.info(`  ${index + 1}. ${suggestion.title} (${suggestion.severity})`);
        this.logger.info(`     Type: ${suggestion.type}, Impact: ${suggestion.impact}, Effort: ${suggestion.effort}`);
        this.logger.info(`     Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
        this.logger.info(`     ${suggestion.description}`);
      });
      
      this.logger.info('✅ Improvement suggestions generated successfully');
    } catch (error) {
      this.logger.error('❌ Improvement suggestions generation failed:', error);
    }
  }

  /**
   * Example 6: Branch Management Workflow
   */
  async runBranchManagementWorkflow(): Promise<void> {
    this.logger.info('🌿 Running Branch Management Workflow Example...');
    
    try {
      // Start a feature workflow
      const workflow = await this.branchManagementService.startWorkflow('feature', 'new-feature');
      
      this.logger.info('📊 Workflow Started:');
      this.logger.info(`  ID: ${workflow.id}`);
      this.logger.info(`  Name: ${workflow.name}`);
      this.logger.info(`  Description: ${workflow.description}`);
      this.logger.info(`  Status: ${workflow.status}`);
      this.logger.info(`  Branch: ${workflow.branchName}`);
      
      // Display workflow steps
      this.logger.info('📋 Workflow Steps:');
      workflow.steps.forEach((step, index) => {
        this.logger.info(`  ${index + 1}. ${step.name} (${step.status})`);
        this.logger.info(`     ${step.description}`);
        this.logger.info(`     Required: ${step.required ? 'Yes' : 'No'}`);
      });
      
      // Get current branch info
      const branchInfo = await this.branchManagementService.getCurrentBranchInfo();
      this.logger.info('📊 Current Branch Info:');
      this.logger.info(`  Name: ${branchInfo.name}`);
      this.logger.info(`  Status: ${branchInfo.status}`);
      this.logger.info(`  Last Commit: ${branchInfo.lastCommit}`);
      this.logger.info(`  Last Commit Date: ${branchInfo.lastCommitDate}`);
      this.logger.info(`  Changes: ${branchInfo.changes.length}`);
      
      this.logger.info('✅ Branch management workflow completed successfully');
    } catch (error) {
      this.logger.error('❌ Branch management workflow failed:', error);
    }
  }

  /**
   * Example 7: Get Statistics
   */
  async getStatistics(): Promise<void> {
    this.logger.info('📊 Getting Statistics Example...');
    
    try {
      // Get self-review statistics
      const reviewStats = this.selfReviewService.getReviewStats();
      this.logger.info('📊 Self-Review Statistics:');
      this.logger.info(`  Total Reviews: ${reviewStats.totalReviews}`);
      this.logger.info(`  Average Score: ${(reviewStats.averageScore * 100).toFixed(1)}%`);
      this.logger.info(`  Total Suggestions: ${reviewStats.totalSuggestions}`);
      this.logger.info(`  Average Confidence: ${(reviewStats.averageConfidence * 100).toFixed(1)}%`);
      
      // Get quality gate statistics
      const qualityGateStats = this.qualityGateService.getQualityGateStats();
      this.logger.info('📊 Quality Gate Statistics:');
      this.logger.info(`  Total Gates: ${qualityGateStats.totalGates}`);
      this.logger.info(`  Passed Gates: ${qualityGateStats.passedGates}`);
      this.logger.info(`  Average Score: ${(qualityGateStats.averageScore * 100).toFixed(1)}%`);
      
      // Get change documentation statistics
      const changeDocStats = this.changeDocumentationService.getDocumentationStats();
      this.logger.info('📊 Change Documentation Statistics:');
      this.logger.info(`  Total Documentations: ${changeDocStats.totalDocumentations}`);
      this.logger.info(`  By Category: ${JSON.stringify(changeDocStats.byCategory)}`);
      this.logger.info(`  By Impact: ${JSON.stringify(changeDocStats.byImpact)}`);
      
      // Get visual documentation statistics
      const visualDocStats = this.visualDocumentationService.getVisualDocumentationStats();
      this.logger.info('📊 Visual Documentation Statistics:');
      this.logger.info(`  Total Documentations: ${visualDocStats.totalDocumentations}`);
      this.logger.info(`  Total Diagrams: ${visualDocStats.totalDiagrams}`);
      this.logger.info(`  By Type: ${JSON.stringify(visualDocStats.byType)}`);
      this.logger.info(`  By Complexity: ${JSON.stringify(visualDocStats.byComplexity)}`);
      
      // Get improvement suggestions statistics
      const improvementStats = this.improvementSuggestionsService.getImprovementSuggestionsStats();
      this.logger.info('📊 Improvement Suggestions Statistics:');
      this.logger.info(`  Total Suggestions: ${improvementStats.totalSuggestions}`);
      this.logger.info(`  By Type: ${JSON.stringify(improvementStats.byType)}`);
      this.logger.info(`  By Severity: ${JSON.stringify(improvementStats.bySeverity)}`);
      this.logger.info(`  Average Confidence: ${(improvementStats.averageConfidence * 100).toFixed(1)}%`);
      
      // Get workflow statistics
      const workflowStats = this.branchManagementService.getWorkflowStats();
      this.logger.info('📊 Workflow Statistics:');
      this.logger.info(`  Total Workflows: ${workflowStats.totalWorkflows}`);
      this.logger.info(`  Completed Workflows: ${workflowStats.completedWorkflows}`);
      this.logger.info(`  Failed Workflows: ${workflowStats.failedWorkflows}`);
      this.logger.info(`  Running Workflows: ${workflowStats.runningWorkflows}`);
      this.logger.info(`  Average Duration: ${workflowStats.averageDuration}ms`);
      this.logger.info(`  By Type: ${JSON.stringify(workflowStats.byType)}`);
      
      this.logger.info('✅ Statistics retrieved successfully');
    } catch (error) {
      this.logger.error('❌ Statistics retrieval failed:', error);
    }
  }

  /**
   * Example 8: Export Data
   */
  async exportData(): Promise<void> {
    this.logger.info('📤 Exporting Data Example...');
    
    try {
      // Export self-review data
      await this.selfReviewService.exportReviewData('./self-review-export.json');
      this.logger.info('✅ Self-review data exported');
      
      // Export quality gate data
      await this.qualityGateService.exportQualityGateData('./quality-gate-export.json');
      this.logger.info('✅ Quality gate data exported');
      
      // Export change documentation data
      await this.changeDocumentationService.exportDocumentationData('./change-documentation-export.json');
      this.logger.info('✅ Change documentation data exported');
      
      // Export visual documentation data
      await this.visualDocumentationService.exportVisualDocumentationData('./visual-documentation-export.json');
      this.logger.info('✅ Visual documentation data exported');
      
      // Export improvement suggestions data
      await this.improvementSuggestionsService.exportImprovementSuggestionsData('./improvement-suggestions-export.json');
      this.logger.info('✅ Improvement suggestions data exported');
      
      // Export workflow data
      await this.branchManagementService.exportWorkflowData('./workflow-export.json');
      this.logger.info('✅ Workflow data exported');
      
      this.logger.info('✅ All data exported successfully');
    } catch (error) {
      this.logger.error('❌ Data export failed:', error);
    }
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    this.logger.info('🎯 Running All Self-Review and Quality Gate Examples...');
    
    try {
      await this.runSelfReview();
      await this.runQualityGate();
      await this.documentChanges();
      await this.generateVisualDocumentation();
      await this.generateImprovementSuggestions();
      await this.runBranchManagementWorkflow();
      await this.getStatistics();
      await this.exportData();
      
      this.logger.info('🎉 All examples completed successfully!');
    } catch (error) {
      this.logger.error('❌ Examples execution failed', error);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down self-review and quality gate system...');
    
    try {
      // Clear caches and histories
      this.selfReviewService.clearReviewCache();
      this.qualityGateService.clearGateHistory();
      this.changeDocumentationService.clearDocumentationHistory();
      this.visualDocumentationService.clearDiagramHistory();
      this.improvementSuggestionsService.clearSuggestionHistory();
      this.branchManagementService.clearWorkflowHistory();
      
      this.logger.info('✅ Self-review and quality gate system shutdown complete');
    } catch (error) {
      this.logger.error('❌ Shutdown failed:', error);
    }
  }
}

// CLI interface for running examples
export async function main() {
  const example = new SelfReviewExample();
  
  try {
    await example.initialize();
    
    const command = process.argv[2] || 'all';
    
    switch (command) {
      case 'self-review':
        await example.runSelfReview();
        break;
      case 'quality-gate':
        await example.runQualityGate();
        break;
      case 'document-changes':
        await example.documentChanges();
        break;
      case 'visual-docs':
        await example.generateVisualDocumentation();
        break;
      case 'suggestions':
        await example.generateImprovementSuggestions();
        break;
      case 'workflow':
        await example.runBranchManagementWorkflow();
        break;
      case 'stats':
        await example.getStatistics();
        break;
      case 'export':
        await example.exportData();
        break;
      case 'all':
        await example.runAllExamples();
        break;
      default:
        console.log('Available commands: self-review, quality-gate, document-changes, visual-docs, suggestions, workflow, stats, export, all');
    }
    
  } catch (error) {
    console.error('❌ Self-review and quality gate example failed:', error);
    process.exit(1);
  } finally {
    await example.shutdown();
  }
}

// Run if this is the main module
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
