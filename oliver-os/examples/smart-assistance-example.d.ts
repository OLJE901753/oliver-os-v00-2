/**
 * Smart Assistance Example
 * Demonstrates the smart assistance system with suggestions, quality monitoring, and safety features
 * Following BMAD principles: Break, Map, Automate, Document
 */
import { MemoryService } from '../src/services/memory/memory-service';
import { LearningService } from '../src/services/memory/learning-service';
import { ContextualSuggestionEngine } from '../src/services/memory/contextual-suggestion-engine';
export declare class SmartAssistanceExample {
    private _memoryService;
    private _learningService;
    private _suggestionEngine;
    private selfReviewService;
    private qualityGateService;
    private improvementSuggestionsService;
    private logger;
    constructor();
    get learningService(): LearningService;
    get suggestionEngine(): ContextualSuggestionEngine;
    get memoryService(): MemoryService;
    /**
     * Initialize the smart assistance system
     */
    initialize(): Promise<void>;
    /**
     * Smart code analysis - returns result for testing
     */
    analyzeCode(filePath: string): Promise<any>;
    /**
     * Smart suggestions
     */
    generateSuggestions(filePath: string): Promise<void>;
    /**
     * Smart refactoring suggestions
     */
    suggestRefactoring(filePath: string): Promise<any>;
    /**
     * Smart quality check
     */
    checkQuality(projectPath?: string): Promise<void>;
    /**
     * Smart performance analysis
     */
    analyzePerformance(filePath: string): Promise<any>;
    /**
     * Smart approval system (simulation)
     */
    approveChanges(filePath: string): Promise<void>;
    /**
     * Smart monitoring
     */
    startMonitoring(): Promise<void>;
    /**
     * Run quality check - returns result for testing
     */
    runQualityCheck(): Promise<any>;
    /**
     * Record user feedback for learning
     */
    recordFeedback(feedback: any): Promise<void>;
    /**
     * Preview changes before applying
     */
    previewChanges(filePath: string): Promise<any>;
    /**
     * Create backup before making changes
     */
    createBackup(filePath: string): Promise<any>;
    /**
     * Analyze multiple files in sequence
     */
    analyzeMultipleFiles(filePaths: string[]): Promise<any[]>;
    /**
     * Update user preferences
     */
    updatePreferences(preferences: any): Promise<void>;
    /**
     * Rollback changes using backup
     */
    rollbackChanges(backupPath: string, _targetPath?: string): Promise<any>;
    /**
     * Run all smart assistance examples
     */
    runAll(): Promise<void>;
}
//# sourceMappingURL=smart-assistance-example.d.ts.map