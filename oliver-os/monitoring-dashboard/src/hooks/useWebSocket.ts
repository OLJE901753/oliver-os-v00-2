import { useEffect, useState, useCallback } from 'react';
import { websocketService } from '@services/websocket';
import { DashboardData, QualityMetric, QualityAlert, SystemHealth, PerformanceData, TestResult, QualityGate } from '@types/index';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([]);

  useEffect(() => {
    const handleConnected = (connected: boolean) => {
      setIsConnected(connected);
    };

    const handleDashboardData = (data: DashboardData) => {
      setDashboardData(data);
    };

    const handleMetricsUpdate = (newMetrics: QualityMetric[]) => {
      setMetrics(newMetrics);
    };

    const handleAlertsNew = (alert: QualityAlert) => {
      setAlerts(prev => [alert, ...prev]);
    };

    const handleAlertsUpdate = (newAlerts: QualityAlert[]) => {
      setAlerts(newAlerts);
    };

    const handleHealthUpdate = (health: SystemHealth) => {
      setSystemHealth(health);
    };

    const handlePerformanceUpdate = (perf: PerformanceData) => {
      setPerformance(prev => [perf, ...prev].slice(0, 100)); // Keep last 100 data points
    };

    const handleTestsUpdate = (results: TestResult[]) => {
      setTestResults(results);
    };

    const handleQualityGatesUpdate = (gates: QualityGate[]) => {
      setQualityGates(gates);
    };

    // Register event listeners
    websocketService.on('connected', handleConnected);
    websocketService.on('dashboard:data', handleDashboardData);
    websocketService.on('metrics:update', handleMetricsUpdate);
    websocketService.on('alerts:new', handleAlertsNew);
    websocketService.on('alerts:update', handleAlertsUpdate);
    websocketService.on('health:update', handleHealthUpdate);
    websocketService.on('performance:update', handlePerformanceUpdate);
    websocketService.on('tests:update', handleTestsUpdate);
    websocketService.on('quality-gates:update', handleQualityGatesUpdate);

    // Request initial data
    websocketService.requestDashboardData();

    return () => {
      // Cleanup event listeners
      websocketService.off('connected', handleConnected);
      websocketService.off('dashboard:data', handleDashboardData);
      websocketService.off('metrics:update', handleMetricsUpdate);
      websocketService.off('alerts:new', handleAlertsNew);
      websocketService.off('alerts:update', handleAlertsUpdate);
      websocketService.off('health:update', handleHealthUpdate);
      websocketService.off('performance:update', handlePerformanceUpdate);
      websocketService.off('tests:update', handleTestsUpdate);
      websocketService.off('quality-gates:update', handleQualityGatesUpdate);
    };
  }, []);

  const requestData = useCallback(() => {
    websocketService.requestDashboardData();
    websocketService.requestMetrics();
    websocketService.requestAlerts();
    websocketService.requestHealth();
    websocketService.requestPerformance();
    websocketService.requestTestResults();
    websocketService.requestQualityGates();
  }, []);

  return {
    isConnected,
    dashboardData,
    metrics,
    alerts,
    systemHealth,
    performance,
    testResults,
    qualityGates,
    requestData,
  };
}
