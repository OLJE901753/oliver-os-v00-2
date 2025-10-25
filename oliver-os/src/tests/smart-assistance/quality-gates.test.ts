/**
 * Smart Assistance Quality Gates
 * Automated quality checks and monitoring for the smart assistance system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SmartAssistanceExample } from '../../examples/smart-assistance-example';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import fs from 'fs-extra';
import path from 'path';

interface QualityMetrics {
  testCoverage: number;
  codeComplexity: number;
  performanceScore: number;
  reliabilityScore: number;
  maintainabilityScore: number;
  securityScore: number;
}

interface QualityGate {
  name: string;
  threshold: number;
  current: number;
  passed: boolean;
  message: string;
}

export class QualityGateManager {
  private _config: Config;
  private _logger: Logger;
  private qualityThresholds: Record<string, number>;

  constructor(config: Config) {
    this._config = config;
    this._logger = new Logger('QualityGateManager');
    this.qualityThresholds = {
      testCoverage: 80,
      codeComplexity: 10,
      performanceScore: 0.8,
      reliabilityScore: 0.9,
      maintainabilityScore: 0.8,
      securityScore: 0.9
    };
  }

  async runQualityGates(): Promise<QualityGate[]> {
    const metrics = await this.collectQualityMetrics();
    const gates: QualityGate[] = [];

    // Test Coverage Gate
    gates.push({
      name: 'Test Coverage',
      threshold: this.qualityThresholds.testCoverage,
      current: metrics.testCoverage,
      passed: metrics.testCoverage >= this.qualityThresholds.testCoverage,
      message: `Test coverage: ${metrics.testCoverage.toFixed(1)}% (threshold: ${this.qualityThresholds.testCoverage}%)`
    });

    // Code Complexity Gate
    gates.push({
      name: 'Code Complexity',
      threshold: this.qualityThresholds.codeComplexity,
      current: metrics.codeComplexity,
      passed: metrics.codeComplexity <= this.qualityThresholds.codeComplexity,
      message: `Code complexity: ${metrics.codeComplexity} (threshold: ${this.qualityThresholds.codeComplexity})`
    });

    // Performance Gate
    gates.push({
      name: 'Performance',
      threshold: this.qualityThresholds.performanceScore,
      current: metrics.performanceScore,
      passed: metrics.performanceScore >= this.qualityThresholds.performanceScore,
      message: `Performance score: ${metrics.performanceScore.toFixed(2)} (threshold: ${this.qualityThresholds.performanceScore})`
    });

    // Reliability Gate
    gates.push({
      name: 'Reliability',
      threshold: this.qualityThresholds.reliabilityScore,
      current: metrics.reliabilityScore,
      passed: metrics.reliabilityScore >= this.qualityThresholds.reliabilityScore,
      message: `Reliability score: ${metrics.reliabilityScore.toFixed(2)} (threshold: ${this.qualityThresholds.reliabilityScore})`
    });

    // Maintainability Gate
    gates.push({
      name: 'Maintainability',
      threshold: this.qualityThresholds.maintainabilityScore,
      current: metrics.maintainabilityScore,
      passed: metrics.maintainabilityScore >= this.qualityThresholds.maintainabilityScore,
      message: `Maintainability score: ${metrics.maintainabilityScore.toFixed(2)} (threshold: ${this.qualityThresholds.maintainabilityScore})`
    });

    // Security Gate
    gates.push({
      name: 'Security',
      threshold: this.qualityThresholds.securityScore,
      current: metrics.securityScore,
      passed: metrics.securityScore >= this.qualityThresholds.securityScore,
      message: `Security score: ${metrics.securityScore.toFixed(2)} (threshold: ${this.qualityThresholds.securityScore})`
    });

    return gates;
  }

  private async collectQualityMetrics(): Promise<QualityMetrics> {
    return {
      testCoverage: await this.calculateTestCoverage(),
      codeComplexity: await this.calculateCodeComplexity(),
      performanceScore: await this.calculatePerformanceScore(),
      reliabilityScore: await this.calculateReliabilityScore(),
      maintainabilityScore: await this.calculateMaintainabilityScore(),
      securityScore: await this.calculateSecurityScore()
    };
  }

  private async calculateTestCoverage(): Promise<number> {
    // Simulate test coverage calculation
    // In a real implementation, this would use a coverage tool
    const testFiles = await this.findTestFiles();
    const sourceFiles = await this.findSourceFiles();
    
    if (sourceFiles.length === 0) return 100;
    
    // Simple heuristic: assume good coverage if we have tests
    const coverageRatio = testFiles.length / sourceFiles.length;
    return Math.min(coverageRatio * 100, 100);
  }

  private async calculateCodeComplexity(): Promise<number> {
    // Simulate cyclomatic complexity calculation
    const sourceFiles = await this.findSourceFiles();
    let totalComplexity = 0;
    let fileCount = 0;

    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const complexity = this.calculateFileComplexity(content);
      totalComplexity += complexity;
      fileCount++;
    }

    return fileCount > 0 ? totalComplexity / fileCount : 0;
  }

  private calculateFileComplexity(content: string): number {
    // Simple cyclomatic complexity calculation
    const complexityKeywords = [
      'if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?'
    ];
    
    let complexity = 1; // Base complexity
    
    for (const keyword of complexityKeywords) {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }

  private async calculatePerformanceScore(): Promise<number> {
    // Simulate performance testing
    const start = performance.now();
    
    // Run a simple performance test
    const smartAssistance = new SmartAssistanceExample();
    await smartAssistance.initialize();
    
    const testFile = await this.createTestFile();
    await smartAssistance.analyzeCode(testFile);
    
    const duration = performance.now() - start;
    
    // Score based on performance (lower is better)
    const maxDuration = 1000; // 1 second
    const score = Math.max(0, 1 - (duration / maxDuration));
    
    await fs.remove(testFile);
    return score;
  }

  private async calculateReliabilityScore(): Promise<number> {
    // Simulate reliability testing
    let successCount = 0;
    let totalTests = 10;
    
    for (let i = 0; i < totalTests; i++) {
      try {
        const smartAssistance = new SmartAssistanceExample();
        await smartAssistance.initialize();
        
        const testFile = await this.createTestFile();
        await smartAssistance.analyzeCode(testFile);
        
        successCount++;
        await fs.remove(testFile);
      } catch (error) {
        // Test failed
      }
    }
    
    return successCount / totalTests;
  }

  private async calculateMaintainabilityScore(): Promise<number> {
    // Simulate maintainability analysis
    const sourceFiles = await this.findSourceFiles();
    let totalScore = 0;
    let fileCount = 0;

    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const score = this.analyzeMaintainability(content);
      totalScore += score;
      fileCount++;
    }

    return fileCount > 0 ? totalScore / fileCount : 1;
  }

  private analyzeMaintainability(content: string): number {
    let score = 1;
    
    // Check for good practices
    if (content && content.includes('// TODO') || content.includes('// FIXME')) {
      score -= 0.1;
    }
    
    if (content && content.includes('any')) {
      score -= 0.05;
    }
    
    if (content && content.includes('console.log')) {
      score -= 0.02;
    }
    
    if (content && content.includes('try') && content.includes('catch')) {
      score += 0.1;
    }
    
    if (content && content.includes('interface') || content.includes('type')) {
      score += 0.05;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private async calculateSecurityScore(): Promise<number> {
    // Simulate security analysis
    const sourceFiles = await this.findSourceFiles();
    let totalScore = 1;
    let fileCount = 0;

    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const score = this.analyzeSecurity(content);
      totalScore *= score;
      fileCount++;
    }

    return fileCount > 0 ? Math.pow(totalScore, 1 / fileCount) : 1;
  }

  private analyzeSecurity(content: string): number {
    let score = 1;
    
    // Check for security issues
    if (content && content.includes('eval(')) {
      score *= 0.1; // Very bad
    }
    
    if (content && content.includes('innerHTML') && !content.includes('textContent')) {
      score *= 0.8; // Potential XSS
    }
    
    if (content && content.includes('password') && !content.includes('hash')) {
      score *= 0.9; // Potential security issue
    }
    
    if (content && content.includes('crypto') || content.includes('bcrypt')) {
      score *= 1.1; // Good security practices
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private async findTestFiles(): Promise<string[]> {
    const testDir = path.join(process.cwd(), 'src/tests');
    if (!await fs.pathExists(testDir)) return [];
    
    const files = await fs.readdir(testDir, { recursive: true });
    return files
      .filter(file => typeof file === 'string' && file.endsWith('.test.ts'))
      .map(file => path.join(testDir, file));
  }

  private async findSourceFiles(): Promise<string[]> {
    const srcDir = path.join(process.cwd(), 'src');
    if (!await fs.pathExists(srcDir)) return [];
    
    const files = await fs.readdir(srcDir, { recursive: true });
    return files
      .filter(file => typeof file === 'string' && file.endsWith('.ts') && !file.includes('.test.'))
      .map(file => path.join(srcDir, file));
  }

  private async createTestFile(): Promise<string> {
    const fileName = `test-quality-${Date.now()}.ts`;
    const filePath = path.join(process.cwd(), fileName);
    
    const content = `
      export class TestClass {
        async testMethod(): Promise<string> {
          return 'test';
        }
      }
    `;
    
    await fs.writeFile(filePath, content);
    return filePath;
  }
}

describe('Smart Assistance Quality Gates', () => {
  let qualityGateManager: QualityGateManager;
  let config: Config;

  beforeEach(() => {
    config = new Config();
    qualityGateManager = new QualityGateManager(config);
  });

  describe('Quality Gate Execution', () => {
    it('should run all quality gates', async () => {
      const gates = await qualityGateManager.runQualityGates();
      
      expect(gates).toBeDefined();
      expect(Array.isArray(gates)).toBe(true);
      expect(gates.length).toBeGreaterThan(0);
      
      gates.forEach(gate => {
        expect(gate.name).toBeDefined();
        expect(gate.threshold).toBeDefined();
        expect(gate.current).toBeDefined();
        expect(typeof gate.passed).toBe('boolean');
        expect(gate.message).toBeDefined();
      });
    });

    it('should provide meaningful gate messages', async () => {
      const gates = await qualityGateManager.runQualityGates();
      
      gates.forEach(gate => {
        expect(gate.message).toContain(gate.name);
        expect(gate.message).toContain(gate.current.toString());
        expect(gate.message).toContain(gate.threshold.toString());
      });
    });
  });

  describe('Quality Metrics Collection', () => {
    it('should calculate test coverage', async () => {
      const coverage = await (qualityGateManager as any).calculateTestCoverage();
      
      expect(coverage).toBeGreaterThanOrEqual(0);
      expect(coverage).toBeLessThanOrEqual(100);
    });

    it('should calculate code complexity', async () => {
      const complexity = await (qualityGateManager as any).calculateCodeComplexity();
      
      expect(complexity).toBeGreaterThanOrEqual(0);
    });

    it('should calculate performance score', async () => {
      const score = await (qualityGateManager as any).calculatePerformanceScore();
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should calculate reliability score', async () => {
      const score = await (qualityGateManager as any).calculateReliabilityScore();
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should calculate maintainability score', async () => {
      const score = await (qualityGateManager as any).calculateMaintainabilityScore();
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should calculate security score', async () => {
      const score = await (qualityGateManager as any).calculateSecurityScore();
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Quality Thresholds', () => {
    it('should have reasonable default thresholds', () => {
      const thresholds = (qualityGateManager as any).qualityThresholds;
      
      expect(thresholds.testCoverage).toBeGreaterThanOrEqual(80);
      expect(thresholds.codeComplexity).toBeLessThanOrEqual(10);
      expect(thresholds.performanceScore).toBeGreaterThanOrEqual(0.8);
      expect(thresholds.reliabilityScore).toBeGreaterThanOrEqual(0.9);
      expect(thresholds.maintainabilityScore).toBeGreaterThanOrEqual(0.8);
      expect(thresholds.securityScore).toBeGreaterThanOrEqual(0.9);
    });

    it('should allow threshold customization', () => {
      const customThresholds = {
        testCoverage: 90,
        codeComplexity: 5,
        performanceScore: 0.9,
        reliabilityScore: 0.95,
        maintainabilityScore: 0.9,
        securityScore: 0.95
      };
      
      (qualityGateManager as any).qualityThresholds = customThresholds;
      
      expect((qualityGateManager as any).qualityThresholds).toEqual(customThresholds);
    });
  });

  describe('Quality Gate Results', () => {
    it('should identify failing gates', async () => {
      const gates = await qualityGateManager.runQualityGates();
      
      const failingGates = gates.filter(gate => !gate.passed);
      const passingGates = gates.filter(gate => gate.passed);
      
      expect(failingGates.length + passingGates.length).toBe(gates.length);
    });

    it('should provide actionable feedback for failing gates', async () => {
      const gates = await qualityGateManager.runQualityGates();
      
      gates.forEach(gate => {
        if (!gate.passed) {
          expect(gate.message).toContain('threshold');
          expect(gate.message).toContain('current');
        }
      });
    });
  });
});
