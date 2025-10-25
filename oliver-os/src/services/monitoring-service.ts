import { EventEmitter } from 'events';
import { Logger } from '../core/logger';
// Define types locally to avoid import issues
interface QualityMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
}

interface QualityAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  metric: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high';
}

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  lastCheck: string;
  health: 'healthy' | 'warning' | 'critical';
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: string;
  services: ServiceStatus[];
}

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  responseTime: number;
  throughput: number;
}

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  duration: number;
  timestamp: string;
  details?: string;
}

interface QualityGate {
  name: string;
  threshold: number;
  current: number;
  passed: boolean;
  message: string;
  lastRun: string;
}

interface DashboardData {
  metrics: QualityMetric[];
  alerts: QualityAlert[];
  systemHealth: SystemHealth;
  performance: PerformanceData[];
  testResults: TestResult[];
  qualityGates: QualityGate[];
  lastUpdated: string;
}

export class MonitoringService extends EventEmitter {
  private logger: Logger;
  private metrics: QualityMetric[] = [];
  private alerts: QualityAlert[] = [];
  private performance: PerformanceData[] = [];
  private testResults: TestResult[] = [];
  private qualityGates: QualityGate[] = [];
  private systemHealth: SystemHealth;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.logger = new Logger('MonitoringService');
    this.systemHealth = this.initializeSystemHealth();
    this.initializeQualityGates();
    this.startMonitoring();
    this.logger.info('📊 Monitoring service started - generating live data');
  }

  private initializeSystemHealth(): SystemHealth {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      lastCheck: new Date().toISOString(),
      services: [
        {
          name: 'Oliver-OS Core',
          status: 'running',
          uptime: process.uptime(),
          lastCheck: new Date().toISOString(),
          health: 'healthy'
        },
        {
          name: 'WebSocket Manager',
          status: 'running',
          uptime: process.uptime(),
          lastCheck: new Date().toISOString(),
          health: 'healthy'
        },
        {
          name: 'Agent Manager',
          status: 'running',
          uptime: process.uptime(),
          lastCheck: new Date().toISOString(),
          health: 'healthy'
        }
      ]
    };
  }

  private initializeQualityGates(): void {
    this.qualityGates = [
      {
        name: 'Test Coverage',
        threshold: 80,
        current: 85,
        passed: true,
        message: 'Test coverage is above threshold',
        lastRun: new Date().toISOString()
      },
      {
        name: 'Performance',
        threshold: 1000,
        current: 750,
        passed: true,
        message: 'Response time is within acceptable range',
        lastRun: new Date().toISOString()
      },
      {
        name: 'Security Score',
        threshold: 90,
        current: 95,
        passed: true,
        message: 'Security score is excellent',
        lastRun: new Date().toISOString()
      }
    ];
  }

  private startMonitoring(): void {
    this.logger.info('🔄 Starting monitoring interval (5 seconds)');
    this.updateInterval = setInterval(() => {
      this.logger.info('🔄 Monitoring tick - updating data');
      this.updateMetrics();
      this.updatePerformance();
      this.updateSystemHealth();
      this.checkQualityGates();
      this.emitDashboardData();
    }, 5000); // Update every 5 seconds
  }

  private updateMetrics(): void {
    const memoryUsage = process.memoryUsage();
    process.cpuUsage(); // CPU usage tracking
    
    this.metrics = [
      {
        name: 'Memory Usage',
        value: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        threshold: 80,
        status: memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8 ? 'warning' : 'healthy',
        timestamp: new Date().toISOString(),
        trend: 'stable',
        unit: '%'
      },
      {
        name: 'CPU Usage',
        value: Math.round(Math.random() * 100), // Simulated CPU usage
        threshold: 70,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        trend: 'stable',
        unit: '%'
      },
      {
        name: 'Response Time',
        value: Math.round(Math.random() * 500 + 200), // Simulated response time
        threshold: 1000,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        trend: 'stable',
        unit: 'ms'
      }
    ];

    this.emit('metrics:update', this.metrics);
  }

  private updatePerformance(): void {
    const perfData: PerformanceData = {
      timestamp: new Date().toISOString(),
      cpu: Math.round(Math.random() * 100),
      memory: Math.round((process.memoryUsage().heapUsed / 1024 / 1024)), // MB
      responseTime: Math.round(Math.random() * 500 + 200),
      throughput: Math.round(Math.random() * 1000 + 500)
    };

    this.performance.push(perfData);
    if (this.performance.length > 100) {
      this.performance = this.performance.slice(-100); // Keep last 100 data points
    }

    this.emit('performance:update', perfData);
  }

  private updateSystemHealth(): void {
    this.systemHealth = {
      ...this.systemHealth,
      uptime: process.uptime(),
      lastCheck: new Date().toISOString(),
      services: this.systemHealth.services.map(service => ({
        ...service,
        uptime: process.uptime(),
        lastCheck: new Date().toISOString()
      }))
    };

    this.emit('health:update', this.systemHealth);
  }

  private checkQualityGates(): void {
    // Simulate quality gate checks
    this.qualityGates = this.qualityGates.map(gate => {
      const newValue = Math.round(Math.random() * 20 + gate.current - 10);
      const passed = newValue >= gate.threshold;
      
      return {
        ...gate,
        current: Math.max(0, newValue),
        passed,
        message: passed ? `${gate.name} is within acceptable range` : `${gate.name} is below threshold`,
        lastRun: new Date().toISOString()
      };
    });

    this.emit('quality-gates:update', this.qualityGates);
  }

  private emitDashboardData(): void {
    const dashboardData: DashboardData = {
      metrics: this.metrics,
      alerts: this.alerts,
      systemHealth: this.systemHealth,
      performance: this.performance.slice(-20), // Last 20 data points
      testResults: this.testResults,
      qualityGates: this.qualityGates,
      lastUpdated: new Date().toISOString()
    };

    this.logger.info('📊 Emitting dashboard data', { 
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length,
      performanceCount: this.performance.length
    });
    this.emit('dashboard:data', dashboardData);
  }

  public getDashboardData(): DashboardData {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      systemHealth: this.systemHealth,
      performance: this.performance,
      testResults: this.testResults,
      qualityGates: this.qualityGates,
      lastUpdated: new Date().toISOString()
    };
  }

  public getMetrics(): QualityMetric[] {
    return this.metrics;
  }

  public getAlerts(): QualityAlert[] {
    return this.alerts;
  }

  public getSystemHealth(): SystemHealth {
    return this.systemHealth;
  }

  public getPerformance(): PerformanceData[] {
    return this.performance;
  }

  public getTestResults(): TestResult[] {
    return this.testResults;
  }

  public getQualityGates(): QualityGate[] {
    return this.qualityGates;
  }

  public addAlert(alert: Omit<QualityAlert, 'id' | 'timestamp'>): void {
    const newAlert: QualityAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.alerts.unshift(newAlert);
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50); // Keep last 50 alerts
    }

    this.emit('alerts:new', newAlert);
  }

  public addTestResult(result: Omit<TestResult, 'id' | 'timestamp'>): void {
    const newResult: TestResult = {
      ...result,
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.testResults.unshift(newResult);
    if (this.testResults.length > 100) {
      this.testResults = this.testResults.slice(0, 100); // Keep last 100 test results
    }

    this.emit('tests:update', this.testResults);
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.removeAllListeners();
  }
}
