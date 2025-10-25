export interface QualityMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
}

export interface QualityAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  metric: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: string;
  services: ServiceStatus[];
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  lastCheck: string;
  health: 'healthy' | 'warning' | 'critical';
}

export interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  responseTime: number;
  throughput: number;
}

export interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  duration: number;
  timestamp: string;
  details?: string;
}

export interface QualityGate {
  name: string;
  threshold: number;
  current: number;
  passed: boolean;
  message: string;
  lastRun: string;
}

export interface DashboardData {
  metrics: QualityMetric[];
  alerts: QualityAlert[];
  systemHealth: SystemHealth;
  performance: PerformanceData[];
  testResults: TestResult[];
  qualityGates: QualityGate[];
  lastUpdated: string;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface MetricChart {
  name: string;
  data: ChartDataPoint[];
  color: string;
  unit: string;
}

export interface NotificationSettings {
  enabled: boolean;
  channels: ('browser' | 'email' | 'slack')[];
  thresholds: {
    warning: number;
    critical: number;
  };
}

export interface DashboardConfig {
  refreshInterval: number;
  chartTimeRange: '1h' | '6h' | '24h' | '7d';
  notifications: NotificationSettings;
  theme: 'light' | 'dark';
}
