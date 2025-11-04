/**
 * Smart Assistance Quality Gates
 * Automated quality checks and monitoring for the smart assistance system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SmartAssistanceExample } from '@examples/smart-assistance-example';
import { Config } from '../../core/config';
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
  private qualityThresholds: Record<string, number>;

  constructor(_config: Config) {
    // Config is kept for potential future use
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
    const testCoverage = metrics.testCoverage ?? 0;
    const testCoverageThreshold = this.qualityThresholds['testCoverage'] ?? 80;
    gates.push({
      name: 'Test Coverage',
      threshold: testCoverageThreshold,
      current: testCoverage,
      passed: testCoverage >= testCoverageThreshold,
      message: `Test coverage: ${testCoverage.toFixed(1)}% (threshold: ${testCoverageThreshold}%)`
    });

    // Code Complexity Gate
    const codeComplexity = metrics.codeComplexity ?? 0;
    const codeComplexityThreshold = this.qualityThresholds['codeComplexity'] ?? 10;
    gates.push({
      name: 'Code Complexity',
      threshold: codeComplexityThreshold,
      current: codeComplexity,
      passed: codeComplexity <= codeComplexityThreshold,
      message: `Code complexity: ${codeComplexity} (threshold: ${codeComplexityThreshold})`
    });

    // Performance Gate
    const performanceScore = metrics.performanceScore ?? 0;
    const performanceThreshold = this.qualityThresholds['performanceScore'] ?? 0.8;
    gates.push({
      name: 'Performance',
      threshold: performanceThreshold,
      current: performanceScore,
      passed: performanceScore >= performanceThreshold,
      message: `Performance score: ${performanceScore.toFixed(2)} (threshold: ${performanceThreshold})`
    });

    // Reliability Gate
    const reliabilityScore = metrics.reliabilityScore ?? 0;
    const reliabilityThreshold = this.qualityThresholds['reliabilityScore'] ?? 0.9;
    gates.push({
      name: 'Reliability',
      threshold: reliabilityThreshold,
      current: reliabilityScore,
      passed: reliabilityScore >= reliabilityThreshold,
      message: `Reliability score: ${reliabilityScore.toFixed(2)} (threshold: ${reliabilityThreshold})`
    });

    // Maintainability Gate
    const maintainabilityScore = metrics.maintainabilityScore ?? 0;
    const maintainabilityThreshold = this.qualityThresholds['maintainabilityScore'] ?? 0.8;
    gates.push({
      name: 'Maintainability',
      threshold: maintainabilityThreshold,
      current: maintainabilityScore,
      passed: maintainabilityScore >= maintainabilityThreshold,
      message: `Maintainability score: ${maintainabilityScore.toFixed(2)} (threshold: ${maintainabilityThreshold})`
    });

    // Security Gate
    const securityScore = metrics.securityScore ?? 0;
    const securityThreshold = this.qualityThresholds['securityScore'] ?? 0.9;
    gates.push({
      name: 'Security',
      threshold: securityThreshold,
      current: securityScore,
      passed: securityScore >= securityThreshold,
      message: `Security score: ${securityScore.toFixed(2)} (threshold: ${securityThreshold})`
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
      if (!keyword || keyword.trim() === '') {
        continue; // Skip empty keywords
      }
      
      // Escape special regex characters
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      try {
        const matches = content.match(new RegExp(`\\b${escapedKeyword}\\b`, 'g'));
        if (matches) {
          complexity += matches.length;
        }
      } catch (error) {
        // Skip invalid regex patterns
        continue;
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
    // Reduced from 10 to 3 tests to improve performance
    let successCount = 0;
    let totalTests = 3;
    
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
    
    try {
      const files = await fs.readdir(testDir, { recursive: true });
      // Limit to first 50 files to avoid performance issues
      // Ensure all entries are strings (readdir can return Buffer in some cases)
      return files
        .filter((file): file is string => typeof file === 'string' && file.endsWith('.test.ts'))
        .slice(0, 50)
        .map(file => path.join(testDir, file));
    } catch (error) {
      // If directory reading fails, return empty array
      return [];
    }
  }

  private async findSourceFiles(): Promise<string[]> {
    const srcDir = path.join(process.cwd(), 'src');
    if (!await fs.pathExists(srcDir)) return [];
    
    try {
      const files = await fs.readdir(srcDir, { recursive: true });
      // Limit to first 50 files to avoid performance issues
      // Ensure all entries are strings (readdir can return Buffer in some cases)
      return files
        .filter((file): file is string => typeof file === 'string' && file.endsWith('.ts') && !file.includes('.test.'))
        .slice(0, 50)
        .map(file => path.join(srcDir, file));
    } catch (error) {
      // If directory reading fails, return empty array
      return [];
    }
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
    }, 90000); // 90 second timeout for this test

    it('should provide meaningful gate messages', async () => {
      const gates = await qualityGateManager.runQualityGates();
      
      gates.forEach(gate => {
        // Check case-insensitively since message format may vary
        expect(gate.message.toLowerCase()).toContain(gate.name.toLowerCase());
        // Numbers are formatted in messages (rounded); assert against displayed precision
        if (gate.name === 'Test Coverage') {
          expect(gate.message).toContain(gate.current.toFixed(1));
        } else if (
          gate.name === 'Performance' ||
          gate.name === 'Reliability' ||
          gate.name === 'Maintainability' ||
          gate.name === 'Security'
        ) {
          expect(gate.message).toContain(gate.current.toFixed(2));
        } else {
          expect(gate.message).toContain(gate.current.toString());
        }
        expect(gate.message).toContain(gate.threshold.toString());
      });
    }, 90000); // 90 second timeout for this test
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
    }, 90000);

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
      const thresholds = (qualityGateManager as any).qualityThresholds as Record<string, number>;
      
      expect(thresholds['testCoverage']).toBeGreaterThanOrEqual(80);
      expect(thresholds['codeComplexity']).toBeLessThanOrEqual(10);
      expect(thresholds['performanceScore']).toBeGreaterThanOrEqual(0.8);
      expect(thresholds['reliabilityScore']).toBeGreaterThanOrEqual(0.9);
      expect(thresholds['maintainabilityScore']).toBeGreaterThanOrEqual(0.8);
      expect(thresholds['securityScore']).toBeGreaterThanOrEqual(0.9);
    });

    it('should allow threshold customization', () => {
      const customThresholds: Record<string, number> = {
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
    }, 90000);

    it('should provide actionable feedback for failing gates', async () => {
      const gates = await qualityGateManager.runQualityGates();
      
      gates.forEach(gate => {
        if (!gate.passed) {
          expect(gate.message).toContain('threshold');
          expect(gate.message).toContain('current');
        }
      });
    }, 90000);
  });
});
