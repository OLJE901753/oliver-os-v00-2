/**
 * Memory and Learning Example
 * Demonstrates the Cursor memory and learning system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Config } from '../src/core/config';
import { Logger } from '../src/core/logger';
import { 
  MemoryService, 
  LearningService, 
  ContextualSuggestionEngine,
  type CodePattern,
  type ArchitectureDecision,
  type LearningContext
} from '../src/services/memory';

export class MemoryLearningExample {
  private memoryService: MemoryService;
  private learningService: LearningService;
  private suggestionEngine: ContextualSuggestionEngine;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('MemoryLearningExample');
    const config = new Config();
    
    this.memoryService = new MemoryService(config);
    this.learningService = new LearningService(config, this.memoryService);
    this.suggestionEngine = new ContextualSuggestionEngine(config, this.memoryService, this.learningService);
  }

  /**
   * Initialize the memory and learning system
   */
  async initialize(): Promise<void> {
    this.logger.info('🧠 Initializing Memory and Learning System...');
    
    try {
      await this.memoryService.initialize();
      await this.learningService.initialize();
      await this.suggestionEngine.initialize();
      
      this.logger.info('✅ Memory and Learning System initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize memory and learning system', error);
      throw error;
    }
  }

  /**
   * Example 1: Record Code Patterns
   */
  async recordCodePatterns(): Promise<void> {
    this.logger.info('📝 Recording Code Patterns...');
    
    const patterns: CodePattern[] = [
      {
        id: 'react-component-pattern',
        pattern: 'React.FC<Props> with useState and useEffect',
        frequency: 1,
        successRate: 0.95,
        lastUsed: new Date().toISOString(),
        example: 'export const Component: React.FC<Props> = ({ prop1, prop2 }) => { const [state, setState] = useState(); useEffect(() => {}, []); return <div>...</div>; };'
      },
      {
        id: 'service-class-pattern',
        pattern: 'Service class with constructor and async methods',
        frequency: 1,
        successRate: 0.92,
        lastUsed: new Date().toISOString(),
        example: 'export class Service { constructor(config: Config) { this.config = config; } async method(): Promise<Result> { try { ... } catch (error) { ... } } }'
      },
      {
        id: 'error-handling-pattern',
        pattern: 'Try-catch with logging and error propagation',
        frequency: 1,
        successRate: 0.98,
        lastUsed: new Date().toISOString(),
        example: 'try { const result = await operation(); return result; } catch (error) { this.logger.error(\'Operation failed:\', error); throw error; }'
      }
    ];

    for (const pattern of patterns) {
      this.memoryService.recordCodePattern(pattern);
    }

    this.logger.info('✅ Code patterns recorded successfully');
  }

  /**
   * Example 2: Record Architecture Decisions
   */
  async recordArchitectureDecisions(): Promise<void> {
    this.logger.info('🏗️ Recording Architecture Decisions...');
    
    const decisions: ArchitectureDecision[] = [
      {
        id: 'microservices-architecture',
        decision: 'Use microservices architecture for Oliver-OS',
        rationale: 'Better scalability and maintainability',
        date: new Date().toISOString(),
        impact: 'high'
      },
      {
        id: 'typescript-first',
        decision: 'TypeScript-first development approach',
        rationale: 'Better type safety and developer experience',
        date: new Date().toISOString(),
        impact: 'high'
      },
      {
        id: 'bmad-methodology',
        decision: 'Follow BMAD methodology (Break, Map, Automate, Document)',
        rationale: 'Structured development approach',
        date: new Date().toISOString(),
        impact: 'medium'
      }
    ];

    for (const decision of decisions) {
      this.memoryService.recordArchitectureDecision(decision);
    }

    this.logger.info('✅ Architecture decisions recorded successfully');
  }

  /**
   * Example 3: Record Naming Conventions
   */
  async recordNamingConventions(): Promise<void> {
    this.logger.info('📝 Recording Naming Conventions...');
    
    // Record variable naming conventions
    this.memoryService.recordNamingConvention('variables', 'userData', 'camelCase');
    this.memoryService.recordNamingConvention('variables', 'isLoading', 'camelCase with boolean prefix');
    this.memoryService.recordNamingConvention('variables', 'userService', 'camelCase with service suffix');
    
    // Record function naming conventions
    this.memoryService.recordNamingConvention('functions', 'getUserData', 'camelCase with verb prefix');
    this.memoryService.recordNamingConvention('functions', 'handleSubmit', 'camelCase with handle prefix');
    this.memoryService.recordNamingConvention('functions', 'validateInput', 'camelCase with action prefix');
    
    // Record component naming conventions
    this.memoryService.recordNamingConvention('components', 'UserProfile', 'PascalCase');
    this.memoryService.recordNamingConvention('components', 'SmartComponent', 'PascalCase with descriptive name');
    this.memoryService.recordNamingConvention('components', 'MultiAgentService', 'PascalCase with service suffix');
    
    // Record file naming conventions
    this.memoryService.recordNamingConvention('files', 'user-service.ts', 'kebab-case with type suffix');
    this.memoryService.recordNamingConvention('files', 'smart-component.tsx', 'kebab-case with type suffix');
    this.memoryService.recordNamingConvention('files', 'multi-agent-example.ts', 'kebab-case with descriptive name');
    
    // Record constant naming conventions
    this.memoryService.recordNamingConvention('constants', 'API_ENDPOINTS', 'UPPER_SNAKE_CASE');
    this.memoryService.recordNamingConvention('constants', 'DEFAULT_CONFIG', 'UPPER_SNAKE_CASE');
    this.memoryService.recordNamingConvention('constants', 'MAX_RETRY_ATTEMPTS', 'UPPER_SNAKE_CASE');

    this.logger.info('✅ Naming conventions recorded successfully');
  }

  /**
   * Example 4: Record Project Session
   */
  async recordProjectSession(): Promise<void> {
    this.logger.info('📊 Recording Project Session...');
    
    const session = {
      id: 'session-001',
      date: new Date().toISOString(),
      duration: 7200000, // 2 hours
      filesModified: 15,
      patternsUsed: ['react-component-pattern', 'service-class-pattern', 'error-handling-pattern'],
      decisionsMade: ['microservices-architecture', 'typescript-first'],
      successRate: 0.92
    };

    this.memoryService.recordProjectSession(session);
    this.logger.info('✅ Project session recorded successfully');
  }

  /**
   * Example 5: Generate Contextual Suggestions
   */
  async generateContextualSuggestions(): Promise<void> {
    this.logger.info('💡 Generating Contextual Suggestions...');
    
    const context: LearningContext = {
      currentFile: 'user-profile.tsx',
      projectStructure: ['src', 'components', 'services'],
      recentChanges: ['react-component-pattern', 'service-class-pattern'],
      userPreferences: {
        preferredImports: ['import { useState, useEffect } from \'react\'', 'import { Logger } from \'@/core/logger\''],
        preferredNaming: { variables: 'camelCase', functions: 'camelCase', components: 'PascalCase' },
        preferredPatterns: ['TypeScript interfaces for props', 'Error handling with try-catch']
      },
      codingPatterns: ['react-component-pattern', 'service-class-pattern'],
      architectureDecisions: ['microservices-architecture', 'typescript-first'],
      namingConventions: {
        variables: { userData: 'camelCase', isLoading: 'camelCase with boolean prefix' },
        functions: { getUserData: 'camelCase with verb prefix', handleSubmit: 'camelCase with handle prefix' },
        components: { UserProfile: 'PascalCase', SmartComponent: 'PascalCase with descriptive name' }
      }
    };

    const suggestions = await this.suggestionEngine.generateSuggestionsForContext(context);
    
    this.logger.info(`💡 Generated ${suggestions.length} contextual suggestions:`);
    suggestions.forEach((suggestion, index) => {
      this.logger.info(`  ${index + 1}. ${suggestion.title} (confidence: ${(suggestion.confidence * 100).toFixed(1)}%)`);
    });
  }

  /**
   * Example 6: Record Learning Feedback
   */
  async recordLearningFeedback(): Promise<void> {
    this.logger.info('📚 Recording Learning Feedback...');
    
    // Record positive feedback
    this.memoryService.recordLearningFeedback({
      suggestionId: 'suggestion-001',
      type: 'code-generation',
      accepted: true,
      userFeedback: 'positive',
      date: new Date().toISOString()
    });

    // Record negative feedback
    this.memoryService.recordLearningFeedback({
      suggestionId: 'suggestion-002',
      type: 'refactoring',
      accepted: false,
      userFeedback: 'negative',
      reason: 'Prefer functional components',
      date: new Date().toISOString()
    });

    this.logger.info('✅ Learning feedback recorded successfully');
  }

  /**
   * Example 7: Get Memory Statistics
   */
  async getMemoryStatistics(): Promise<void> {
    this.logger.info('📊 Getting Memory Statistics...');
    
    const memoryStats = this.memoryService.getMemoryStats();
    const learningStats = this.learningService.getLearningStats();
    const suggestionStats = this.suggestionEngine.getSuggestionStats();
    
    this.logger.info('📊 Memory Statistics:');
    this.logger.info(`  Total Patterns: ${memoryStats.totalPatterns}`);
    this.logger.info(`  Total Decisions: ${memoryStats.totalDecisions}`);
    this.logger.info(`  Total Sessions: ${memoryStats.totalSessions}`);
    this.logger.info(`  Total Suggestions: ${memoryStats.totalSuggestions}`);
    this.logger.info(`  Success Rate: ${(memoryStats.successRate * 100).toFixed(1)}%`);
    
    this.logger.info('📊 Learning Statistics:');
    this.logger.info(`  Total Patterns: ${learningStats.totalPatterns}`);
    this.logger.info(`  Average Confidence: ${(learningStats.averageConfidence * 100).toFixed(1)}%`);
    this.logger.info(`  Average Success Rate: ${(learningStats.averageSuccessRate * 100).toFixed(1)}%`);
    this.logger.info(`  Learning Progress: ${(learningStats.learningProgress * 100).toFixed(1)}%`);
    
    this.logger.info('📊 Suggestion Statistics:');
    this.logger.info(`  Total Suggestions: ${suggestionStats.totalSuggestions}`);
    this.logger.info(`  Cached Contexts: ${suggestionStats.cachedContexts}`);
    this.logger.info(`  Context History Size: ${suggestionStats.contextHistorySize}`);
  }

  /**
   * Example 8: Save Memory
   */
  async saveMemory(): Promise<void> {
    this.logger.info('💾 Saving Memory...');
    
    try {
      await this.memoryService.saveMemory();
      this.logger.info('✅ Memory saved successfully');
    } catch (error) {
      this.logger.error('❌ Failed to save memory:', error);
    }
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    this.logger.info('🎯 Running All Memory and Learning Examples...');
    
    try {
      await this.recordCodePatterns();
      await this.recordArchitectureDecisions();
      await this.recordNamingConventions();
      await this.recordProjectSession();
      await this.generateContextualSuggestions();
      await this.manageMemory();
      await this.recordLearningFeedback();
      await this.getMemoryStatistics();
      await this.saveMemory();
      
      this.logger.info('🎉 All examples completed successfully!');
    } catch (error) {
      this.logger.error('❌ Examples execution failed', error);
    }
  }

  /**
   * Example 9: Manage Memory
   */
  async manageMemory(): Promise<void> {
    this.logger.info('🗂️ Managing Memory...');
    
    // Export memory
    try {
      await this.memoryService.exportMemory('./memory-export.json');
      this.logger.info('✅ Memory exported successfully');
    } catch (error) {
      this.logger.error('❌ Failed to export memory:', error);
    }

    // Export learning data
    try {
      await this.learningService.exportLearningData('./learning-export.json');
      this.logger.info('✅ Learning data exported successfully');
    } catch (error) {
      this.logger.error('❌ Failed to export learning data:', error);
    }

    // Export suggestion data
    try {
      await this.suggestionEngine.exportSuggestionData('./suggestion-export.json');
      this.logger.info('✅ Suggestion data exported successfully');
    } catch (error) {
      this.logger.error('❌ Failed to export suggestion data:', error);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down memory and learning system...');
    await this.saveMemory();
    this.logger.info('✅ Memory and learning system shutdown complete');
  }
}

// CLI interface for running examples
export async function main() {
  const example = new MemoryLearningExample();
  
  try {
    await example.initialize();
    
    const command = process.argv[2] || 'all';
    
    switch (command) {
      case 'patterns':
        await example.recordCodePatterns();
        break;
      case 'decisions':
        await example.recordArchitectureDecisions();
        break;
      case 'conventions':
        await example.recordNamingConventions();
        break;
      case 'session':
        await example.recordProjectSession();
        break;
      case 'suggestions':
        await example.generateContextualSuggestions();
        break;
      case 'feedback':
        await example.recordLearningFeedback();
        break;
      case 'stats':
        await example.getMemoryStatistics();
        break;
      case 'save':
        await example.saveMemory();
        break;
      case 'manage':
        await example.manageMemory();
        break;
      case 'all':
        await example.runAllExamples();
        break;
      default:
        console.log('Available commands: patterns, decisions, conventions, session, suggestions, feedback, stats, save, manage, all');
    }
    
  } catch (error) {
    console.error('❌ Memory and learning example failed:', error);
    process.exit(1);
  } finally {
    await example.shutdown();
  }
}

// Run if this is the main module
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
