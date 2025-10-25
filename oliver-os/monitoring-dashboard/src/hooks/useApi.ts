import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@services/api';
import { DashboardData, QualityMetric, QualityAlert, SystemHealth, PerformanceData, TestResult, QualityGate } from '@types/index';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async <T>(
    apiCall: () => Promise<T>,
    setData: (data: T) => void
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('API fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchData,
  };
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const { loading, error, fetchData } = useApi();

  const loadData = useCallback(() => {
    fetchData(() => apiService.getDashboardData(), setData);
  }, [fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
}

export function useMetrics() {
  const [data, setData] = useState<QualityMetric[]>([]);
  const { loading, error, fetchData } = useApi();

  const loadData = useCallback(() => {
    fetchData(() => apiService.getMetrics(), setData);
  }, [fetchData]);

  const loadHistory = useCallback((metricName: string, timeRange: string = '1h') => {
    fetchData(() => apiService.getMetricHistory(metricName, timeRange), setData);
  }, [fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData, loadHistory };
}

export function useAlerts() {
  const [data, setData] = useState<QualityAlert[]>([]);
  const { loading, error, fetchData } = useApi();

  const loadData = useCallback(() => {
    fetchData(() => apiService.getAlerts(), setData);
  }, [fetchData]);

  const loadActiveAlerts = useCallback(() => {
    fetchData(() => apiService.getActiveAlerts(), setData);
  }, [fetchData]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await apiService.resolveAlert(alertId);
      loadData(); // Refresh alerts
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  }, [loadData]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await apiService.acknowledgeAlert(alertId);
      loadData(); // Refresh alerts
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: loadData, 
    loadActiveAlerts,
    resolveAlert,
    acknowledgeAlert
  };
}

export function useSystemHealth() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const { loading, error, fetchData } = useApi();

  const loadData = useCallback(() => {
    fetchData(() => apiService.getSystemHealth(), setData);
  }, [fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
}

export function usePerformance() {
  const [data, setData] = useState<PerformanceData[]>([]);
  const { loading, error, fetchData } = useApi();

  const loadData = useCallback((timeRange: string = '1h') => {
    fetchData(() => apiService.getPerformanceData(timeRange), setData);
  }, [fetchData]);

  const loadMetrics = useCallback(() => {
    fetchData(() => apiService.getPerformanceMetrics(), (metrics) => {
      // Convert metrics object to array format
      const data = Object.entries(metrics).map(([key, value]) => ({
        timestamp: new Date().toISOString(),
        cpu: key === 'cpu' ? value : 0,
        memory: key === 'memory' ? value : 0,
        responseTime: key === 'responseTime' ? value : 0,
        throughput: key === 'throughput' ? value : 0,
      }));
      setData(data);
    });
  }, [fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData, loadMetrics };
}

export function useTestResults() {
  const [data, setData] = useState<TestResult[]>([]);
  const { loading, error, fetchData } = useApi();

  const loadData = useCallback(() => {
    fetchData(() => apiService.getTestResults(), setData);
  }, [fetchData]);

  const runTest = useCallback(async (testName: string) => {
    try {
      const result = await apiService.runTest(testName);
      setData(prev => [result, ...prev]);
    } catch (err) {
      console.error('Failed to run test:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData, runTest };
}

export function useQualityGates() {
  const [data, setData] = useState<QualityGate[]>([]);
  const { loading, error, fetchData } = useApi();

  const loadData = useCallback(() => {
    fetchData(() => apiService.getQualityGates(), setData);
  }, [fetchData]);

  const runQualityGates = useCallback(() => {
    fetchData(() => apiService.runQualityGates(), setData);
  }, [fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData, runQualityGates };
}
