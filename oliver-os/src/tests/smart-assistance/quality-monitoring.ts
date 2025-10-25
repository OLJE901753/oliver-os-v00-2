/**
 * Smart Assistance Quality Monitoring
 * Real-time quality monitoring and alerting system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SmartAssistanceExample } from '../../examples/smart-assistance-example';
import { Config } from '../../core/config';
import { Logger } from '../../core/logger';
import fs from 'fs-extra';
import path from 'path';

interface QualityMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  trend: 'up' | 'down' | 'stable';
}

interface QualityAlert {
  id: string;
  type: 'warning' | 'critical';
  metric: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export class QualityMonitor {
  // private _config: Config; // Unused for now
  private _logger: Logger;
  private metrics: QualityMetric[] = [];
  private alerts: QualityAlert[] = [];
  private smartAssistance: SmartAssistanceExample;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: Config) {
    this._config = config;
    this._logger = new Logger('QualityMonitor');
    this.smartAssistance = new SmartAssistanceExample();
  }

  async startMonitoring(intervalMs: number = 60000): Promise<void> {
    await this.smartAssistance.initialize();
    
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.checkThresholds();
      await this.generateAlerts();
    }, intervalMs);
    
    this._logger.info('Quality monitoring started');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this._logger.info('Quality monitoring stopped');
  }

  private async collectMetrics(): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Performance metrics
    const performanceMetric = await this.measurePerformance();
    this.metrics.push({
      name: 'performance',
      value: performanceMetric,
      threshold: 0.8,
      status: performanceMetric >= 0.8 ? 'healthy' : performanceMetric >= 0.6 ? 'warning' : 'critical',
      timestamp,
      trend: this.calculateTrend('performance')
    });

    // Memory usage metrics
    const memoryMetric = await this.measureMemoryUsage();
    this.metrics.push({
      name: 'memory_usage',
      value: memoryMetric,
      threshold: 0.8,
      status: memoryMetric <= 0.8 ? 'healthy' : memoryMetric <= 0.9 ? 'warning' : 'critical',
      timestamp,
      trend: this.calculateTrend('memory_usage')
    });

    // Error rate metrics
    const errorRateMetric = await this.measureErrorRate();
    this.metrics.push({
      name: 'error_rate',
      value: errorRateMetric,
      threshold: 0.1,
      status: errorRateMetric <= 0.1 ? 'healthy' : errorRateMetric <= 0.2 ? 'warning' : 'critical',
      timestamp,
      trend: this.calculateTrend('error_rate')
    });

    // Suggestion quality metrics
    const suggestionQualityMetric = await this.measureSuggestionQuality();
    this.metrics.push({
      name: 'suggestion_quality',
      value: suggestionQualityMetric,
      threshold: 0.8,
      status: suggestionQualityMetric >= 0.8 ? 'healthy' : suggestionQualityMetric >= 0.6 ? 'warning' : 'critical',
      timestamp,
      trend: this.calculateTrend('suggestion_quality')
    });

    // Learning effectiveness metrics
    const learningMetric = await this.measureLearningEffectiveness();
    this.metrics.push({
      name: 'learning_effectiveness',
      value: learningMetric,
      threshold: 0.7,
      status: learningMetric >= 0.7 ? 'healthy' : learningMetric >= 0.5 ? 'warning' : 'critical',
      timestamp,
      trend: this.calculateTrend('learning_effectiveness')
    });
  }

  private async measurePerformance(): Promise<number> {
    const start = performance.now();
    
    try {
      const testCode = 'export class Test { method(): string { return "test"; } }';
      await this.smartAssistance.analyzeCode(testCode);
      
      const duration = performance.now() - start;
      const maxDuration = 1000; // 1 second
      
      return Math.max(0, 1 - (duration / maxDuration));
    } catch (error) {
      return 0;
    }
  }

  private async measureMemoryUsage(): Promise<number> {
    const memoryUsage = process.memoryUsage();
    const maxMemory = 500 * 1024 * 1024; // 500MB
    
    return memoryUsage.heapUsed / maxMemory;
  }

  private async measureErrorRate(): Promise<number> {
    // Simulate error rate measurement
    const totalOperations = 100;
    let errorCount = 0;
    
    for (let i = 0; i < totalOperations; i++) {
      try {
        const testCode = `export class Test${i} { method(): string { return "test${i}"; } }`;
        await this.smartAssistance.analyzeCode(testCode);
      } catch (error) {
        errorCount++;
      }
    }
    
    return errorCount / totalOperations;
  }

  private async measureSuggestionQuality(): Promise<number> {
    // Simulate suggestion quality measurement
    const testCode = `
      function inefficientLoop(arr: number[]): number[] {
        let result = [];
        for (let i = 0; i < arr.length; i++) {
          for (let j = 0; j < arr.length; j++) {
            result.push(arr[i] + arr[j]);
          }
        }
        return result;
      }
    `;
    
    try {
      const result = await this.smartAssistance.analyzeCode(testCode);
      return result.score / 10; // Normalize to 0-1
    } catch (error) {
      return 0;
    }
  }

  private async measureLearningEffectiveness(): Promise<number> {
    // Simulate learning effectiveness measurement
    const learningService = (this.smartAssistance as any).learningService;
    
    try {
      // Record a pattern
      await learningService.recordPattern({
        id: 'test-pattern',
        type: 'code',
        pattern: 'test pattern',
        context: 'test',
        successRate: 0.8,
        frequency: 1,
        lastUsed: new Date().toISOString(),
        confidence: 0.8
      });
      
      // Simulate learning effectiveness based on pattern confidence
      const memory = (this.smartAssistance as any).memoryService.getMemory();
      const patterns = memory.learning?.patterns || [];
      
      if (patterns.length === 0) return 0;
      
      const avgConfidence = patterns.reduce((sum: number, p: any) => sum + (p.confidence || 0), 0) / patterns.length;
      return avgConfidence;
    } catch (error) {
      return 0;
    }
  }

  private calculateTrend(metricName: string): 'up' | 'down' | 'stable' {
    const recentMetrics = this.metrics
      .filter(m => m.name === metricName)
      .slice(-5);
    
    if (recentMetrics.length < 2) return 'stable';
    
    const latest = recentMetrics[recentMetrics.length - 1]?.value;
    const previous = recentMetrics[recentMetrics.length - 2]?.value;
    
    if (!latest || !previous) return 'stable';
    
    const change = (latest - previous) / previous;
    
    if (change > 0.05) return 'up';
    if (change < -0.05) return 'down';
    return 'stable';
  }

  private async checkThresholds(): Promise<void> {
    const latestMetrics = this.metrics
      .filter(m => m.timestamp === this.metrics[this.metrics.length - 1]?.timestamp);
    
    for (const metric of latestMetrics) {
      if (metric.status === 'critical') {
        await this.createAlert('critical', metric.name, `Critical threshold exceeded for ${metric.name}`);
      } else if (metric.status === 'warning') {
        await this.createAlert('warning', metric.name, `Warning threshold exceeded for ${metric.name}`);
      }
    }
  }

  private async createAlert(type: 'warning' | 'critical', metric: string, message: string): Promise<void> {
    const alert: QualityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      metric,
      message,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    this.alerts.push(alert);
    this._logger.warn(`Quality Alert: ${message}`);
  }

  private async generateAlerts(): Promise<void> {
    // Generate alerts based on trends
    const criticalMetrics = this.metrics.filter(m => m.status === 'critical');
    const warningMetrics = this.metrics.filter(m => m.status === 'warning');
    
    if (criticalMetrics.length > 0) {
      await this.createAlert('critical', 'system', `${criticalMetrics.length} critical metrics detected`);
    }
    
    if (warningMetrics.length > 3) {
      await this.createAlert('warning', 'system', `${warningMetrics.length} warning metrics detected`);
    }
  }

  getMetrics(): QualityMetric[] {
    return [...this.metrics];
  }

  getAlerts(): QualityAlert[] {
    return [...this.alerts];
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const latestMetrics = this.metrics
      .filter(m => m.timestamp === this.metrics[this.metrics.length - 1]?.timestamp);
    
    if (latestMetrics.some(m => m.status === 'critical')) return 'critical';
    if (latestMetrics.some(m => m.status === 'warning')) return 'warning';
    return 'healthy';
  }

  async generateReport(): Promise<string> {
    const healthStatus = this.getHealthStatus();
    const totalAlerts = this.alerts.length;
    const unresolvedAlerts = this.alerts.filter(a => !a.resolved).length;
    
    const report = `
# Smart Assistance Quality Report

## Health Status: ${healthStatus.toUpperCase()}

## Metrics Summary
${this.metrics.map(m => `- ${m.name}: ${m.value.toFixed(2)} (${m.status})`).join('\n')}

## Alerts Summary
- Total Alerts: ${totalAlerts}
- Unresolved: ${unresolvedAlerts}
- Critical: ${this.alerts.filter(a => a.type === 'critical' && !a.resolved).length}
- Warnings: ${this.alerts.filter(a => a.type === 'warning' && !a.resolved).length}

## Recent Alerts
${this.alerts.slice(-5).map(a => `- [${a.type.toUpperCase()}] ${a.message} (${a.timestamp})`).join('\n')}

Generated: ${new Date().toISOString()}
    `;
    
    return report;
  }

  async saveReport(filePath: string): Promise<void> {
    const report = await this.generateReport();
    await fs.writeFile(filePath, report);
  }
}

describe('Smart Assistance Quality Monitoring', () => {
  let qualityMonitor: QualityMonitor;
  let config: Config;

  beforeEach(() => {
    config = new Config();
    qualityMonitor = new QualityMonitor(config);
  });

  afterEach(() => {
    qualityMonitor.stopMonitoring();
  });

  describe('Quality Metrics Collection', () => {
    it('should collect performance metrics', async () => {
      const performance = await (qualityMonitor as any).measurePerformance();
      
      expect(performance).toBeGreaterThanOrEqual(0);
      expect(performance).toBeLessThanOrEqual(1);
    });

    it('should collect memory usage metrics', async () => {
      const memoryUsage = await (qualityMonitor as any).measureMemoryUsage();
      
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
      expect(memoryUsage).toBeLessThanOrEqual(1);
    });

    it('should collect error rate metrics', async () => {
      const errorRate = await (qualityMonitor as any).measureErrorRate();
      
      expect(errorRate).toBeGreaterThanOrEqual(0);
      expect(errorRate).toBeLessThanOrEqual(1);
    });

    it('should collect suggestion quality metrics', async () => {
      const suggestionQuality = await (qualityMonitor as any).measureSuggestionQuality();
      
      expect(suggestionQuality).toBeGreaterThanOrEqual(0);
      expect(suggestionQuality).toBeLessThanOrEqual(1);
    });

    it('should collect learning effectiveness metrics', async () => {
      const learningEffectiveness = await (qualityMonitor as any).measureLearningEffectiveness();
      
      expect(learningEffectiveness).toBeGreaterThanOrEqual(0);
      expect(learningEffectiveness).toBeLessThanOrEqual(1);
    });
  });

  describe('Quality Monitoring', () => {
    it('should start and stop monitoring', async () => {
      await qualityMonitor.startMonitoring(100); // 100ms interval for testing
      
      // Wait for at least one collection cycle
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const metrics = qualityMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      
      qualityMonitor.stopMonitoring();
    });

    it('should generate alerts for threshold violations', async () => {
      // Mock a critical metric
      (qualityMonitor as any).metrics = [{
        name: 'performance',
        value: 0.5,
        threshold: 0.8,
        status: 'critical',
        timestamp: new Date().toISOString(),
        trend: 'down'
      }];
      
      await (qualityMonitor as any).checkThresholds();
      
      const alerts = qualityMonitor.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.type === 'critical')).toBe(true);
    });

    it('should calculate trends correctly', () => {
      const trend = (qualityMonitor as any).calculateTrend('performance');
      expect(['up', 'down', 'stable']).toContain(trend);
    });
  });

  describe('Health Status', () => {
    it('should return correct health status', () => {
      const healthStatus = qualityMonitor.getHealthStatus();
      expect(['healthy', 'warning', 'critical']).toContain(healthStatus);
    });

    it('should identify critical status', () => {
      (qualityMonitor as any).metrics = [{
        name: 'performance',
        value: 0.5,
        threshold: 0.8,
        status: 'critical',
        timestamp: new Date().toISOString(),
        trend: 'down'
      }];
      
      const healthStatus = qualityMonitor.getHealthStatus();
      expect(healthStatus).toBe('critical');
    });
  });

  describe('Report Generation', () => {
    it('should generate quality report', async () => {
      const report = await qualityMonitor.generateReport();
      
      expect(report).toContain('Smart Assistance Quality Report');
      expect(report).toContain('Health Status');
      expect(report).toContain('Metrics Summary');
      expect(report).toContain('Alerts Summary');
    });

    it('should save report to file', async () => {
      const reportPath = path.join(process.cwd(), 'test-quality-report.md');
      
      await qualityMonitor.saveReport(reportPath);
      
      expect(await fs.pathExists(reportPath)).toBe(true);
      
      // Clean up
      await fs.remove(reportPath);
    });
  });
});
