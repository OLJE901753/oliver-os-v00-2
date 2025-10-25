import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, BarChart3, Cpu, Database, Shield, TestTube, Zap } from 'lucide-react';
import { useWebSocket } from '@hooks/useWebSocket';
import { useDashboardData } from '@hooks/useApi';
import { formatRelativeTime } from '@utils/index';

// Components
import MetricsOverview from '@components/MetricsOverview';
import QualityGates from '@components/QualityGates';
import PerformanceCharts from '@components/PerformanceCharts';
import AlertsCenter from '@components/AlertsCenter';
import SystemHealth from '@components/SystemHealth';
import TestResults from '@components/TestResults';
import Header from '@components/Header';
import Sidebar from '@components/Sidebar';

type TabType = 'overview' | 'metrics' | 'performance' | 'quality' | 'alerts' | 'tests' | 'health';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const {
    isConnected,
    dashboardData,
    metrics,
    alerts,
    systemHealth,
    performance,
    testResults,
    qualityGates,
    requestData
  } = useWebSocket();

  const { data: apiData, loading, error } = useDashboardData();

  // Update last updated time
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Request data on mount
  useEffect(() => {
    requestData();
  }, [requestData]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'metrics', label: 'Metrics', icon: Activity },
    { id: 'performance', label: 'Performance', icon: Cpu },
    { id: 'quality', label: 'Quality Gates', icon: Shield },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'tests', label: 'Tests', icon: TestTube },
    { id: 'health', label: 'Health', icon: Database },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <MetricsOverview 
              metrics={metrics} 
              systemHealth={systemHealth}
              alerts={alerts}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceCharts data={performance} />
              <QualityGates gates={qualityGates} />
            </div>
          </div>
        );
      case 'metrics':
        return <MetricsOverview metrics={metrics} systemHealth={systemHealth} alerts={alerts} />;
      case 'performance':
        return <PerformanceCharts data={performance} />;
      case 'quality':
        return <QualityGates gates={qualityGates} />;
      case 'alerts':
        return <AlertsCenter alerts={alerts} />;
      case 'tests':
        return <TestResults results={testResults} />;
      case 'health':
        return <SystemHealth health={systemHealth} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        isConnected={isConnected}
        lastUpdated={lastUpdated}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Smart Assistance Monitoring Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time monitoring and quality assurance for the Smart Assistance System
              </p>
            </div>

            {/* Connection Status */}
            {!isConnected && (
              <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-warning-600 mr-2" />
                  <span className="text-warning-800">
                    Disconnected from monitoring service. Attempting to reconnect...
                  </span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-danger-600 mr-2" />
                  <span className="text-danger-800">
                    Error loading dashboard data: {error}
                  </span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && !dashboardData && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}

            {/* Dashboard Content */}
            {!loading && (
              <div className="space-y-6">
                {renderContent()}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
