import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';
import { QualityMetric, QualityAlert, SystemHealth } from '@types/index';
import { formatNumber, formatPercentage, getStatusColor, getTrendIcon, getTrendColor, formatRelativeTime } from '@utils/index';

interface MetricsOverviewProps {
  metrics: QualityMetric[];
  systemHealth: SystemHealth | null;
  alerts: QualityAlert[];
}

const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics, systemHealth, alerts }) => {
  // Ensure metrics is always an array
  const safeMetrics = Array.isArray(metrics) ? metrics : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  
  const activeAlerts = safeAlerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical');
  const warningAlerts = activeAlerts.filter(alert => alert.type === 'warning');

  const getOverallStatus = () => {
    if (criticalAlerts.length > 0) return 'critical';
    if (warningAlerts.length > 0) return 'warning';
    return 'healthy';
  };

  const overallStatus = getOverallStatus();

  const metricCards = [
    {
      title: 'Test Coverage',
      value: safeMetrics.find(m => m.name === 'test_coverage')?.value || 0,
      unit: '%',
      threshold: 80,
      status: safeMetrics.find(m => m.name === 'test_coverage')?.status || 'healthy',
      trend: safeMetrics.find(m => m.name === 'test_coverage')?.trend || 'stable',
      icon: CheckCircle,
    },
    {
      title: 'Performance Score',
      value: safeMetrics.find(m => m.name === 'performance')?.value || 0,
      unit: '',
      threshold: 0.8,
      status: safeMetrics.find(m => m.name === 'performance')?.status || 'healthy',
      trend: safeMetrics.find(m => m.name === 'performance')?.trend || 'stable',
      icon: Activity,
    },
    {
      title: 'Code Quality',
      value: safeMetrics.find(m => m.name === 'code_quality')?.value || 0,
      unit: '',
      threshold: 0.8,
      status: safeMetrics.find(m => m.name === 'code_quality')?.status || 'healthy',
      trend: safeMetrics.find(m => m.name === 'code_quality')?.trend || 'stable',
      icon: CheckCircle,
    },
    {
      title: 'Security Score',
      value: safeMetrics.find(m => m.name === 'security')?.value || 0,
      unit: '',
      threshold: 0.9,
      status: safeMetrics.find(m => m.name === 'security')?.status || 'healthy',
      trend: safeMetrics.find(m => m.name === 'security')?.trend || 'stable',
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            <p className="text-sm text-gray-600">Overall health and performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(overallStatus)}`}>
              {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
            </div>
            {systemHealth && (
              <div className="text-sm text-gray-500">
                Uptime: {formatNumber(systemHealth.uptime / 3600, 1)}h
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          const isAboveThreshold = metric.value >= metric.threshold;
          const displayValue = metric.unit === '%' 
            ? formatPercentage(metric.value, 1)
            : formatNumber(metric.value, 2);

          return (
            <div key={index} className="metric-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    metric.status === 'healthy' ? 'bg-success-100 text-success-600' :
                    metric.status === 'warning' ? 'bg-warning-100 text-warning-600' :
                    'bg-danger-100 text-danger-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {displayValue}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    isAboveThreshold ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {isAboveThreshold ? 'Good' : 'Needs Attention'}
                  </div>
                  <div className={`flex items-center text-xs ${
                    getTrendColor(metric.trend)
                  }`}>
                    <span className="mr-1">{getTrendIcon(metric.trend)}</span>
                    {metric.trend}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {activeAlerts.length} active
            </span>
          </div>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success-400 mx-auto mb-4" />
            <p className="text-gray-500">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                alert.type === 'critical' ? 'bg-danger-50 border-danger-500' :
                alert.type === 'warning' ? 'bg-warning-50 border-warning-500' :
                'bg-primary-50 border-primary-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.metric}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      alert.type === 'critical' ? 'bg-danger-100 text-danger-800' :
                      alert.type === 'warning' ? 'bg-warning-100 text-warning-800' :
                      'bg-primary-100 text-primary-800'
                    }`}>
                      {alert.type}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(alert.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {activeAlerts.length > 5 && (
              <div className="text-center">
                <button className="text-sm text-primary-600 hover:text-primary-800">
                  View all {activeAlerts.length} alerts
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsOverview;
