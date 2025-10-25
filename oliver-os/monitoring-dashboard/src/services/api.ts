import { DashboardData, QualityMetric, QualityAlert, SystemHealth, PerformanceData, TestResult, QualityGate } from '@types/index';

const API_BASE_URL = '/api/monitoring';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // For now, return mock data since we don't have a backend server
    // This will be replaced with real API calls when the backend is implemented
    console.log(`Mock API call to ${endpoint}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock data based on endpoint
    return this.getMockData(endpoint) as T;
  }

  private getMockData(endpoint: string): any {
    const mockData = {
      '/dashboard': {
        metrics: [
          { id: '1', name: 'Code Quality', value: 85, target: 80, status: 'good', trend: 'up' },
          { id: '2', name: 'Test Coverage', value: 92, target: 90, status: 'excellent', trend: 'up' },
          { id: '3', name: 'Performance', value: 78, target: 85, status: 'warning', trend: 'down' },
          { id: '4', name: 'Security', value: 95, target: 90, status: 'excellent', trend: 'stable' }
        ],
        systemHealth: {
          status: 'healthy',
          uptime: 99.9,
          services: [
            { name: 'API Server', status: 'running', uptime: 99.9 },
            { name: 'Database', status: 'running', uptime: 99.8 },
            { name: 'Cache', status: 'running', uptime: 99.7 }
          ]
        },
        alerts: [
          { id: '1', type: 'warning', message: 'Performance below threshold', timestamp: new Date().toISOString() },
          { id: '2', type: 'info', message: 'New deployment successful', timestamp: new Date().toISOString() }
        ]
      },
      '/metrics': [
        { id: '1', name: 'Code Quality', value: 85, target: 80, status: 'good', trend: 'up' },
        { id: '2', name: 'Test Coverage', value: 92, target: 90, status: 'excellent', trend: 'up' },
        { id: '3', name: 'Performance', value: 78, target: 85, status: 'warning', trend: 'down' },
        { id: '4', name: 'Security', value: 95, target: 90, status: 'excellent', trend: 'stable' }
      ],
      '/alerts': [
        { id: '1', type: 'warning', message: 'Performance below threshold', timestamp: new Date().toISOString() },
        { id: '2', type: 'info', message: 'New deployment successful', timestamp: new Date().toISOString() }
      ],
      '/health': {
        status: 'healthy',
        uptime: 99.9,
        services: [
          { name: 'API Server', status: 'running', uptime: 99.9 },
          { name: 'Database', status: 'running', uptime: 99.8 },
          { name: 'Cache', status: 'running', uptime: 99.7 }
        ]
      },
      '/performance': {
        cpu: 45,
        memory: 67,
        responseTime: 120,
        throughput: 1500
      },
      '/tests': [
        { id: '1', name: 'Unit Tests', status: 'passed', duration: 1200, coverage: 92 },
        { id: '2', name: 'Integration Tests', status: 'passed', duration: 3400, coverage: 88 },
        { id: '3', name: 'E2E Tests', status: 'failed', duration: 5600, coverage: 75 }
      ],
      '/quality-gates': [
        { id: '1', name: 'Code Quality Gate', status: 'passed', threshold: 80, current: 85 },
        { id: '2', name: 'Test Coverage Gate', status: 'passed', threshold: 90, current: 92 },
        { id: '3', name: 'Performance Gate', status: 'failed', threshold: 85, current: 78 }
      ]
    };

    return mockData[endpoint] || {};
  }

  // Dashboard data
  async getDashboardData(): Promise<DashboardData> {
    return this.request<DashboardData>('/dashboard');
  }

  // Metrics
  async getMetrics(): Promise<QualityMetric[]> {
    return this.request<QualityMetric[]>('/metrics');
  }

  async getMetricHistory(metricName: string, timeRange: string = '1h'): Promise<QualityMetric[]> {
    return this.request<QualityMetric[]>(`/metrics/${metricName}/history?range=${timeRange}`);
  }

  // Alerts
  async getAlerts(): Promise<QualityAlert[]> {
    return this.request<QualityAlert[]>('/alerts');
  }

  async getActiveAlerts(): Promise<QualityAlert[]> {
    return this.request<QualityAlert[]>('/alerts/active');
  }

  async resolveAlert(alertId: string): Promise<void> {
    return this.request<void>(`/alerts/${alertId}/resolve`, {
      method: 'POST',
    });
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    return this.request<void>(`/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });
  }

  // System Health
  async getSystemHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/health');
  }

  async getServiceStatus(serviceName: string): Promise<SystemHealth> {
    return this.request<SystemHealth>(`/health/services/${serviceName}`);
  }

  // Performance
  async getPerformanceData(timeRange: string = '1h'): Promise<PerformanceData[]> {
    return this.request<PerformanceData[]>(`/performance?range=${timeRange}`);
  }

  async getPerformanceMetrics(): Promise<{ [key: string]: number }> {
    return this.request<{ [key: string]: number }>('/performance/metrics');
  }

  // Test Results
  async getTestResults(): Promise<TestResult[]> {
    return this.request<TestResult[]>('/tests');
  }

  async getTestResult(testId: string): Promise<TestResult> {
    return this.request<TestResult>(`/tests/${testId}`);
  }

  async runTest(testName: string): Promise<TestResult> {
    return this.request<TestResult>(`/tests/${testName}/run`, {
      method: 'POST',
    });
  }

  // Quality Gates
  async getQualityGates(): Promise<QualityGate[]> {
    return this.request<QualityGate[]>('/quality-gates');
  }

  async runQualityGates(): Promise<QualityGate[]> {
    return this.request<QualityGate[]>('/quality-gates/run', {
      method: 'POST',
    });
  }

  // Configuration
  async getConfig(): Promise<any> {
    return this.request<any>('/config');
  }

  async updateConfig(config: any): Promise<void> {
    return this.request<void>('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health/check');
  }
}

export const apiService = new ApiService();
export default apiService;
