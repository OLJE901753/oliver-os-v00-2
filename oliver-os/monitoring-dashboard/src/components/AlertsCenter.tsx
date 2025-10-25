import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Filter, Search, X } from 'lucide-react';
import { QualityAlert } from '@types/index';
import { formatRelativeTime, formatTimestamp } from '@utils/index';

interface AlertsCenterProps {
  alerts: QualityAlert[];
}

const AlertsCenter: React.FC<AlertsCenterProps> = ({ alerts }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<QualityAlert | null>(null);

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && !alert.resolved) ||
      (filter === 'resolved' && alert.resolved);
    
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.metric.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical');
  const warningAlerts = activeAlerts.filter(alert => alert.type === 'warning');

  const handleResolveAlert = (alertId: string) => {
    // This would resolve the alert
    console.log('Resolving alert:', alertId);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    // This would acknowledge the alert
    console.log('Acknowledging alert:', alertId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Alerts Center</h2>
          <p className="text-sm text-gray-600">Monitor and manage system alerts</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {activeAlerts.length} active alerts
          </span>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-danger-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-danger-600">{criticalAlerts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-warning-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Warning</p>
              <p className="text-2xl font-bold text-warning-600">{warningAlerts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-success-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-success-600">
                {alerts.filter(alert => alert.resolved).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All', count: alerts.length },
            { key: 'active', label: 'Active', count: activeAlerts.length },
            { key: 'resolved', label: 'Resolved', count: alerts.filter(alert => alert.resolved).length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-success-400 mx-auto mb-4" />
            <p className="text-gray-500">No alerts found</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-item cursor-pointer hover:shadow-md transition-shadow ${
                alert.type === 'critical' ? 'alert-critical' :
                alert.type === 'warning' ? 'alert-warning' :
                'alert-info'
              }`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium">{alert.metric}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.type === 'critical' ? 'bg-danger-100 text-danger-800' :
                        alert.type === 'warning' ? 'bg-warning-100 text-warning-800' :
                        'bg-primary-100 text-primary-800'
                      }`}>
                        {alert.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.severity === 'high' ? 'bg-danger-100 text-danger-800' :
                        alert.severity === 'medium' ? 'bg-warning-100 text-warning-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {formatRelativeTime(alert.timestamp)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTimestamp(alert.timestamp)}
                    </div>
                  </div>
                  
                  {!alert.resolved && (
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledgeAlert(alert.id);
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveAlert(alert.id);
                        }}
                        className="px-3 py-1 text-xs bg-success-100 text-success-700 rounded hover:bg-success-200 transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Alert Details</h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600">Metric</h4>
                <p className="text-lg text-gray-900">{selectedAlert.metric}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600">Message</h4>
                <p className="text-gray-900">{selectedAlert.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Type</h4>
                  <p className="text-gray-900 capitalize">{selectedAlert.type}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Severity</h4>
                  <p className="text-gray-900 capitalize">{selectedAlert.severity}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600">Timestamp</h4>
                <p className="text-gray-900">{formatTimestamp(selectedAlert.timestamp)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600">Status</h4>
                <p className={`capitalize ${
                  selectedAlert.resolved ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {selectedAlert.resolved ? 'Resolved' : 'Active'}
                </p>
              </div>
            </div>
            
            {!selectedAlert.resolved && (
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    handleAcknowledgeAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => {
                    handleResolveAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
                >
                  Resolve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsCenter;
