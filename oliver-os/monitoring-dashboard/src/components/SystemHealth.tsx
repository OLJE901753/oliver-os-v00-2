import React from 'react';
import { Database, Server, Cpu, HardDrive, Wifi, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { SystemHealth as SystemHealthType } from '@types/index';
import { formatDuration, formatBytes, formatRelativeTime } from '@utils/index';

interface SystemHealthProps {
  health: SystemHealthType | null;
}

const SystemHealth: React.FC<SystemHealthProps> = ({ health }) => {
  if (!health) {
    return (
      <div className="text-center py-12">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No health data available</p>
      </div>
    );
  }

  const getStatusIcon = (status: 'running' | 'stopped' | 'error') => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'stopped':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-danger-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getHealthColor = (health: 'healthy' | 'warning' | 'critical') => {
    switch (health) {
      case 'healthy':
        return 'text-success-600 bg-success-100';
      case 'warning':
        return 'text-warning-600 bg-warning-100';
      case 'critical':
        return 'text-danger-600 bg-danger-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            <p className="text-sm text-gray-600">Overall system status and uptime</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(health.status)}`}>
              {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
            </div>
            <div className="text-sm text-gray-500">
              Uptime: {formatDuration(health.uptime * 1000)}
            </div>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Status</h3>
        <div className="space-y-3">
          {health.services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600">
                    Last check: {formatRelativeTime(service.lastCheck)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(service.health)}`}>
                  {service.health}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDuration(service.uptime * 1000)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <Server className="h-8 w-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Services</p>
              <p className="text-2xl font-bold text-gray-900">
                {health.services.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-success-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-2xl font-bold text-success-600">
                {health.services.filter(s => s.status === 'running').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8 text-danger-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Stopped</p>
              <p className="text-2xl font-bold text-danger-600">
                {health.services.filter(s => s.status === 'stopped').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-warning-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-warning-600">
                {health.services.filter(s => s.status === 'error').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Health History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Health History</h3>
        <div className="space-y-2">
          {health.services.map((service, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  service.health === 'healthy' ? 'bg-success-500' :
                  service.health === 'warning' ? 'bg-warning-500' :
                  'bg-danger-500'
                }`} />
                <span className="text-sm font-medium text-gray-900">{service.name}</span>
              </div>
              <div className="text-sm text-gray-500">
                {formatRelativeTime(service.lastCheck)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-600">Overall Status</h4>
            <p className="text-lg text-gray-900 capitalize">{health.status}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600">Total Uptime</h4>
            <p className="text-lg text-gray-900">{formatDuration(health.uptime * 1000)}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600">Last Check</h4>
            <p className="text-lg text-gray-900">{formatRelativeTime(health.lastCheck)}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600">Healthy Services</h4>
            <p className="text-lg text-gray-900">
              {health.services.filter(s => s.health === 'healthy').length} / {health.services.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
