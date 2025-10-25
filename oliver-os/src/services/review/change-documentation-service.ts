/**
 * Change Documentation Service
 * Automatic documentation of code changes
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';

const execAsync = promisify(exec);

export interface ChangeDocumentation {
  id: string;
  timestamp: string;
  branch: string;
  commit: string;
  changes: FileChange[];
  summary: string;
  impact: 'low' | 'medium' | 'high';
  category: 'feature' | 'bugfix' | 'refactor' | 'performance' | 'security' | 'documentation';
  reasoning: string;
  testing: string;
  rollback: string;
}

export interface FileChange {
  filePath: string;
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  linesAdded: number;
  linesDeleted: number;
  description: string;
  impact: 'low' | 'medium' | 'high';
  complexity: 'low' | 'medium' | 'high';
}

export interface ChangeAnalysis {
  whatChanged: string;
  whyChanged: string;
  impact: string;
  risks: string[];
  benefits: string[];
  dependencies: string[];
  testing: string[];
}

export interface DocumentationConfig {
  enabled: boolean;
  autoGenerate: boolean;
  includeDiagrams: boolean;
  includeImpact: boolean;
  includeTesting: boolean;
  includeRollback: boolean;
  templates: {
    feature: string;
    bugfix: string;
    refactor: string;
    performance: string;
    security: string;
    documentation: string;
  };
}

export class ChangeDocumentationService extends EventEmitter {
  private _logger: Logger;
  // private _config: Config; // Unused for now
  private documentationConfig!: DocumentationConfig;
  private documentationHistory: Map<string, ChangeDocumentation>;

  constructor(_config: Config) {
    super();
    this._logger = new Logger('ChangeDocumentationService');
    this.documentationHistory = new Map();
    this.loadDocumentationConfig();
  }

  /**
   * Initialize change documentation service
   */
  async initialize(): Promise<void> {
    this._logger.info('📝 Initializing Change Documentation Service...');
    
    try {
      await this.loadDocumentationConfig();
      await this.validateGitRepository();
      
      this._logger.info('✅ Change Documentation Service initialized successfully');
      this.emit('change-documentation:initialized');
    } catch (error) {
      this._logger.error('Failed to initialize change documentation service:', error);
      throw error;
    }
  }

  /**
   * Load documentation configuration
   */
  private async loadDocumentationConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'change-documentation-config.json');
      if (await fs.pathExists(configPath)) {
        this.documentationConfig = await fs.readJson(configPath);
        this._logger.info('📋 Change documentation configuration loaded');
      } else {
        this.documentationConfig = this.getDefaultDocumentationConfig();
        await this.saveDocumentationConfig();
        this._logger.info('📋 Using default change documentation configuration');
      }
    } catch (error) {
      this._logger.warn('Failed to load change documentation configuration, using defaults');
      this.documentationConfig = this.getDefaultDocumentationConfig();
    }
  }

  /**
   * Get default documentation configuration
   */
  private getDefaultDocumentationConfig(): DocumentationConfig {
    return {
      enabled: true,
      autoGenerate: true,
      includeDiagrams: true,
      includeImpact: true,
      includeTesting: true,
      includeRollback: true,
      templates: {
        feature: 'Added new feature: {summary}\n\nWhat changed: {whatChanged}\nWhy changed: {whyChanged}\nImpact: {impact}\nTesting: {testing}',
        bugfix: 'Fixed bug: {summary}\n\nWhat changed: {whatChanged}\nWhy changed: {whyChanged}\nImpact: {impact}\nTesting: {testing}',
        refactor: 'Refactored code: {summary}\n\nWhat changed: {whatChanged}\nWhy changed: {whyChanged}\nImpact: {impact}\nTesting: {testing}',
        performance: 'Performance improvement: {summary}\n\nWhat changed: {whatChanged}\nWhy changed: {whyChanged}\nImpact: {impact}\nTesting: {testing}',
        security: 'Security improvement: {summary}\n\nWhat changed: {whatChanged}\nWhy changed: {whyChanged}\nImpact: {impact}\nTesting: {testing}',
        documentation: 'Documentation update: {summary}\n\nWhat changed: {whatChanged}\nWhy changed: {whyChanged}\nImpact: {impact}\nTesting: {testing}'
      }
    };
  }

  /**
   * Save documentation configuration
   */
  private async saveDocumentationConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'change-documentation-config.json');
      await fs.writeJson(configPath, this.documentationConfig, { spaces: 2 });
      this._logger.info('💾 Change documentation configuration saved');
    } catch (error) {
      this._logger.error('Failed to save change documentation configuration:', error);
    }
  }

  /**
   * Validate git repository
   */
  private async validateGitRepository(): Promise<void> {
    try {
      await execAsync('git status');
      this._logger.info('✅ Git repository validated');
    } catch (error) {
      this._logger.warn('Not in a git repository - some features may not work');
    }
  }

  /**
   * Document current changes
   */
  async documentCurrentChanges(): Promise<ChangeDocumentation> {
    this._logger.info('📝 Documenting current changes...');
    
    try {
      // Get git status
      const gitStatus = await this.getGitStatus();
      
      // Get git diff
      const gitDiff = await this.getGitDiff();
      
      // Analyze changes
      const changes = await this.analyzeChanges(gitStatus, gitDiff);
      
      // Analyze change impact
      const analysis = await this.analyzeChangeImpact(changes);
      
      // Determine change category
      const category = this.determineChangeCategory(changes, analysis);
      
      // Generate documentation
      const documentation = await this.generateDocumentation(changes, analysis, category);
      
      // Store documentation
      this.documentationHistory.set(documentation.id, documentation);
      
      this._logger.info(`✅ Change documentation generated (${documentation.id})`);
      this.emit('change-documentation:generated', { documentation });
      
      return documentation;
    } catch (error) {
      this._logger.error('Failed to document current changes:', error);
      throw error;
    }
  }

  /**
   * Document specific commit
   */
  async documentCommit(commitHash: string): Promise<ChangeDocumentation> {
    this._logger.info(`📝 Documenting commit: ${commitHash}`);
    
    try {
      // Get commit information
      const commitInfo = await this.getCommitInfo(commitHash);
      
      // Get commit diff
      const commitDiff = await this.getCommitDiff(commitHash);
      
      // Analyze changes
      const changes = await this.analyzeChanges(commitInfo, commitDiff);
      
      // Analyze change impact
      const analysis = await this.analyzeChangeImpact(changes);
      
      // Determine change category
      const category = this.determineChangeCategory(changes, analysis);
      
      // Generate documentation
      const documentation = await this.generateDocumentation(changes, analysis, category, commitHash);
      
      // Store documentation
      this.documentationHistory.set(documentation.id, documentation);
      
      this._logger.info(`✅ Commit documentation generated (${documentation.id})`);
      this.emit('commit-documentation:generated', { documentation });
      
      return documentation;
    } catch (error) {
      this._logger.error(`Failed to document commit ${commitHash}:`, error);
      throw error;
    }
  }

  /**
   * Get git status
   */
  private async getGitStatus(): Promise<string> {
    try {
      const { stdout } = await execAsync('git status --porcelain');
      return stdout;
    } catch (error) {
      this._logger.warn('Failed to get git status:', { error: error instanceof Error ? error.message : String(error) });
      return '';
    }
  }

  /**
   * Get git diff
   */
  private async getGitDiff(): Promise<string> {
    try {
      const { stdout } = await execAsync('git diff --cached');
      return stdout;
    } catch (error) {
      this._logger.warn('Failed to get git diff:', error);
      return '';
    }
  }

  /**
   * Get commit information
   */
  private async getCommitInfo(commitHash: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git show --name-status ${commitHash}`);
      return stdout;
    } catch (error) {
      this._logger.warn(`Failed to get commit info for ${commitHash}:`, error);
      return '';
    }
  }

  /**
   * Get commit diff
   */
  private async getCommitDiff(commitHash: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git show ${commitHash}`);
      return stdout;
    } catch (error) {
      this._logger.warn(`Failed to get commit diff for ${commitHash}:`, error);
      return '';
    }
  }

  /**
   * Analyze changes
   */
  private async analyzeChanges(status: string, diff: string): Promise<FileChange[]> {
    const changes: FileChange[] = [];
    const statusLines = status.split('\n').filter(line => line.trim());
    
    for (const line of statusLines) {
      const change = this.parseStatusLine(line);
      if (change) {
        const analysis = await this.analyzeFileChange(change, diff);
        changes.push(analysis);
      }
    }
    
    return changes;
  }

  /**
   * Parse status line
   */
  private parseStatusLine(line: string): any {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) return null;
    
    const status = parts[0]!;
    const filePath = parts[1]!;
    
    let changeType: 'added' | 'modified' | 'deleted' | 'renamed';
    
    if (status && status.includes('A')) changeType = 'added';
    else if (status && status.includes('M')) changeType = 'modified';
    else if (status && status.includes('D')) changeType = 'deleted';
    else if (status && status.includes('R')) changeType = 'renamed';
    else return null;
    
    return { filePath, changeType };
  }

  /**
   * Analyze file change
   */
  private async analyzeFileChange(change: any, diff: string): Promise<FileChange> {
    const linesAdded = this.countLinesAdded(diff, change.filePath);
    const linesDeleted = this.countLinesDeleted(diff, change.filePath);
    const description = await this.generateChangeDescription(change, diff);
    const impact = this.assessChangeImpact(change, linesAdded, linesDeleted);
    const complexity = this.assessChangeComplexity(change, linesAdded, linesDeleted);
    
    return {
      filePath: change.filePath,
      changeType: change.changeType,
      linesAdded,
      linesDeleted,
      description,
      impact,
      complexity
    };
  }

  /**
   * Count lines added
   */
  private countLinesAdded(diff: string, filePath: string): number {
    const lines = diff.split('\n');
    let count = 0;
    let inFile = false;
    
    for (const line of lines) {
      if (line.startsWith(`+++ b/${filePath}`)) {
        inFile = true;
        continue;
      }
      
      if (inFile && line.startsWith('+++')) {
        inFile = false;
        continue;
      }
      
      if (inFile && line.startsWith('+') && !line.startsWith('+++')) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Count lines deleted
   */
  private countLinesDeleted(diff: string, filePath: string): number {
    const lines = diff.split('\n');
    let count = 0;
    let inFile = false;
    
    for (const line of lines) {
      if (line.startsWith(`--- a/${filePath}`)) {
        inFile = true;
        continue;
      }
      
      if (inFile && line.startsWith('---')) {
        inFile = false;
        continue;
      }
      
      if (inFile && line.startsWith('-') && !line.startsWith('---')) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Generate change description
   */
  private async generateChangeDescription(change: any, _diff: string): Promise<string> {
    // Simplified description generation
    // In a real implementation, you might use AI to generate more detailed descriptions
    
    switch (change.changeType) {
      case 'added':
        return `Added new file: ${change.filePath}`;
      case 'modified':
        return `Modified file: ${change.filePath}`;
      case 'deleted':
        return `Deleted file: ${change.filePath}`;
      case 'renamed':
        return `Renamed file: ${change.filePath}`;
      default:
        return `Changed file: ${change.filePath}`;
    }
  }

  /**
   * Assess change impact
   */
  private assessChangeImpact(_change: any, linesAdded: number, linesDeleted: number): 'low' | 'medium' | 'high' {
    const totalChanges = linesAdded + linesDeleted;
    
    if (totalChanges < 10) return 'low';
    if (totalChanges < 50) return 'medium';
    return 'high';
  }

  /**
   * Assess change complexity
   */
  private assessChangeComplexity(_change: any, linesAdded: number, linesDeleted: number): 'low' | 'medium' | 'high' {
    const totalChanges = linesAdded + linesDeleted;
    
    if (totalChanges < 20) return 'low';
    if (totalChanges < 100) return 'medium';
    return 'high';
  }

  /**
   * Analyze change impact
   */
  private async analyzeChangeImpact(changes: FileChange[]): Promise<ChangeAnalysis> {
    const whatChanged = this.generateWhatChanged(changes);
    const whyChanged = this.generateWhyChanged(changes);
    const impact = this.generateImpact(changes);
    const risks = this.identifyRisks(changes);
    const benefits = this.identifyBenefits(changes);
    const dependencies = this.identifyDependencies(changes);
    const testing = this.generateTestingRecommendations(changes);
    
    return {
      whatChanged,
      whyChanged,
      impact,
      risks,
      benefits,
      dependencies,
      testing
    };
  }

  /**
   * Generate what changed
   */
  private generateWhatChanged(changes: FileChange[]): string {
    const added = changes.filter(c => c.changeType === 'added').length;
    const modified = changes.filter(c => c.changeType === 'modified').length;
    const deleted = changes.filter(c => c.changeType === 'deleted').length;
    const renamed = changes.filter(c => c.changeType === 'renamed').length;
    
    const parts: string[] = [];
    
    if (added > 0) parts.push(`${added} file(s) added`);
    if (modified > 0) parts.push(`${modified} file(s) modified`);
    if (deleted > 0) parts.push(`${deleted} file(s) deleted`);
    if (renamed > 0) parts.push(`${renamed} file(s) renamed`);
    
    return parts.join(', ');
  }

  /**
   * Generate why changed
   */
  private generateWhyChanged(changes: FileChange[]): string {
    // Simplified reasoning - in real implementation, you might analyze commit messages, issue numbers, etc.
    const totalChanges = changes.reduce((sum, c) => sum + c.linesAdded + c.linesDeleted, 0);
    
    if (totalChanges < 20) {
      return 'Minor improvements and bug fixes';
    } else if (totalChanges < 100) {
      return 'Feature enhancement or significant bug fix';
    } else {
      return 'Major feature addition or architectural change';
    }
  }

  /**
   * Generate impact
   */
  private generateImpact(changes: FileChange[]): string {
    const highImpact = changes.filter(c => c.impact === 'high').length;
    const mediumImpact = changes.filter(c => c.impact === 'medium').length;
    // const lowImpact = changes.filter(c => c.impact === 'low').length;
    
    if (highImpact > 0) {
      return 'High impact changes that may affect system behavior';
    } else if (mediumImpact > 0) {
      return 'Medium impact changes with potential system effects';
    } else {
      return 'Low impact changes with minimal system effects';
    }
  }

  /**
   * Identify risks
   */
  private identifyRisks(changes: FileChange[]): string[] {
    const risks: string[] = [];
    
    const highComplexity = changes.filter(c => c.complexity === 'high').length;
    const highImpact = changes.filter(c => c.impact === 'high').length;
    
    if (highComplexity > 0) {
      risks.push('High complexity changes may introduce bugs');
    }
    
    if (highImpact > 0) {
      risks.push('High impact changes may affect system stability');
    }
    
    const coreFiles = changes.filter(c => c.filePath.includes('core/') || c.filePath.includes('src/')).length;
    if (coreFiles > 0) {
      risks.push('Core system changes may have wide-ranging effects');
    }
    
    return risks;
  }

  /**
   * Identify benefits
   */
  private identifyBenefits(changes: FileChange[]): string[] {
    const benefits: string[] = [];
    
    const newFeatures = changes.filter(c => c.changeType === 'added').length;
    if (newFeatures > 0) {
      benefits.push('New features added to the system');
    }
    
    const improvements = changes.filter(c => c.changeType === 'modified').length;
    if (improvements > 0) {
      benefits.push('Existing functionality improved');
    }
    
    const cleanup = changes.filter(c => c.changeType === 'deleted').length;
    if (cleanup > 0) {
      benefits.push('Unused code removed, improving maintainability');
    }
    
    return benefits;
  }

  /**
   * Identify dependencies
   */
  private identifyDependencies(changes: FileChange[]): string[] {
    const dependencies: string[] = [];
    
    // Simplified dependency analysis
    const serviceFiles = changes.filter(c => c.filePath.includes('service'));
    if (serviceFiles.length > 0) {
      dependencies.push('Service layer changes may affect other components');
    }
    
    const apiFiles = changes.filter(c => c.filePath.includes('api') || c.filePath.includes('route'));
    if (apiFiles.length > 0) {
      dependencies.push('API changes may affect client applications');
    }
    
    const configFiles = changes.filter(c => c.filePath.includes('config'));
    if (configFiles.length > 0) {
      dependencies.push('Configuration changes may affect system behavior');
    }
    
    return dependencies;
  }

  /**
   * Generate testing recommendations
   */
  private generateTestingRecommendations(changes: FileChange[]): string[] {
    const testing: string[] = [];
    
    const highImpact = changes.filter(c => c.impact === 'high').length;
    if (highImpact > 0) {
      testing.push('Run comprehensive integration tests');
      testing.push('Test with production-like data');
    }
    
    const apiChanges = changes.filter(c => c.filePath.includes('api') || c.filePath.includes('route')).length;
    if (apiChanges > 0) {
      testing.push('Test API endpoints thoroughly');
      testing.push('Verify API documentation is updated');
    }
    
    const uiChanges = changes.filter(c => c.filePath.includes('component') || c.filePath.includes('ui')).length;
    if (uiChanges > 0) {
      testing.push('Test user interface changes');
      testing.push('Verify responsive design');
    }
    
    return testing;
  }

  /**
   * Determine change category
   */
  private determineChangeCategory(changes: FileChange[], analysis: ChangeAnalysis): 'feature' | 'bugfix' | 'refactor' | 'performance' | 'security' | 'documentation' {
    // Simplified category determination
    const added = changes.filter(c => c.changeType === 'added').length;
    const modified = changes.filter(c => c.changeType === 'modified').length;
    
    if (added > modified) {
      return 'feature';
    } else if (analysis.risks.some(risk => risk.includes('bug'))) {
      return 'bugfix';
    } else if (analysis.benefits.some(benefit => benefit.includes('maintainability'))) {
      return 'refactor';
    } else if (analysis.benefits.some(benefit => benefit.includes('performance'))) {
      return 'performance';
    } else if (analysis.risks.some(risk => risk.includes('security'))) {
      return 'security';
    } else {
      return 'documentation';
    }
  }

  /**
   * Generate documentation
   */
  private async generateDocumentation(changes: FileChange[], analysis: ChangeAnalysis, category: string, commitHash?: string): Promise<ChangeDocumentation> {
    // const template = this.documentationConfig.templates[category as keyof typeof this.documentationConfig.templates];
    
    const summary = this.generateSummary(changes, analysis);
    const reasoning = analysis.whyChanged;
    const testing = analysis.testing.join('\n- ');
    const rollback = this.generateRollbackInstructions(changes);
    
    const documentation: ChangeDocumentation = {
      id: this.generateDocumentationId(),
      timestamp: new Date().toISOString(),
      branch: await this.getCurrentBranch(),
      commit: commitHash || await this.getCurrentCommit(),
      changes,
      summary,
      impact: this.determineOverallImpact(changes),
      category: category as any,
      reasoning,
      testing: `- ${testing}`,
      rollback
    };
    
    return documentation;
  }

  /**
   * Generate summary
   */
  private generateSummary(_changes: FileChange[], analysis: ChangeAnalysis): string {
    const whatChanged = analysis.whatChanged;
    const whyChanged = analysis.whyChanged;
    
    return `${whatChanged}. ${whyChanged}`;
  }

  /**
   * Generate rollback instructions
   */
  private generateRollbackInstructions(changes: FileChange[]): string {
    const instructions: string[] = [];
    
    instructions.push('To rollback these changes:');
    instructions.push('1. Identify the commit hash before these changes');
    instructions.push('2. Run: git revert <commit-hash>');
    instructions.push('3. Test the rollback thoroughly');
    
    const added = changes.filter(c => c.changeType === 'added');
    if (added.length > 0) {
      instructions.push('4. Remove newly added files if necessary');
    }
    
    return instructions.join('\n');
  }

  /**
   * Determine overall impact
   */
  private determineOverallImpact(changes: FileChange[]): 'low' | 'medium' | 'high' {
    const highImpact = changes.filter(c => c.impact === 'high').length;
    const mediumImpact = changes.filter(c => c.impact === 'medium').length;
    
    if (highImpact > 0) return 'high';
    if (mediumImpact > 0) return 'medium';
    return 'low';
  }

  /**
   * Get current branch
   */
  private async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current');
      return stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get current commit
   */
  private async getCurrentCommit(): Promise<string> {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD');
      return stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Generate documentation ID
   */
  private generateDocumentationId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get documentation statistics
   */
  getDocumentationStats(): any {
    const docs = Array.from(this.documentationHistory.values());
    
    return {
      totalDocumentations: docs.length,
      byCategory: docs.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      }, {} as any),
      byImpact: docs.reduce((acc, doc) => {
        acc[doc.impact] = (acc[doc.impact] || 0) + 1;
        return acc;
      }, {} as any),
      lastDocumentation: docs[docs.length - 1]
    };
  }

  /**
   * Clear documentation history
   */
  clearDocumentationHistory(): void {
    this.documentationHistory.clear();
    this._logger.info('🗑️ Change documentation history cleared');
    this.emit('change-documentation-history:cleared');
  }

  /**
   * Export documentation data
   */
  async exportDocumentationData(exportPath: string): Promise<void> {
    try {
      const docData = {
        documentations: Array.from(this.documentationHistory.entries()),
        stats: this.getDocumentationStats(),
        config: this.documentationConfig,
        exportedAt: new Date().toISOString()
      };
      
      await fs.writeJson(exportPath, docData, { spaces: 2 });
      this._logger.info(`📤 Change documentation data exported to: ${exportPath}`);
      this.emit('change-documentation-data:exported', { exportPath });
    } catch (error) {
      this._logger.error('Failed to export change documentation data:', error);
      throw error;
    }
  }
}
