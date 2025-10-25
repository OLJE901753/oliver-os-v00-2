import React from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { QualityGate } from '@types/index';
import { formatRelativeTime, formatPercentage } from '@utils/index';

interface QualityGatesProps {
  gates: QualityGate[];
}

const QualityGates: React.FC<QualityGatesProps> = ({ gates }) => {
  const passedGates = gates.filter(gate => gate.passed);
  const failedGates = gates.filter(gate => !gate.passed);
  const overallStatus = failedGates.length === 0 ? 'passed' : 'failed';

  const handleRunGates = () => {
    // This would trigger a quality gate run
    console.log('Running quality gates...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quality Gates</h2>
          <p className="text-sm text-gray-600">Automated quality checks and thresholds</p>
        </div>
        <button
          onClick={handleRunGates}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Run Gates</span>
        </button>
      </div>

      {/* Overall Status */}
      <div className={`p-4 rounded-lg border-2 ${
        overallStatus === 'passed' 
          ? 'bg-success-50 border-success-200' 
          : 'bg-danger-50 border-danger-200'
      }`}>
        <div className="flex items-center space-x-3">
          {overallStatus === 'passed' ? (
            <CheckCircle className="h-6 w-6 text-success-600" />
          ) : (
            <XCircle className="h-6 w-6 text-danger-600" />
          )}
          <div>
            <h3 className={`text-lg font-semibold ${
              overallStatus === 'passed' ? 'text-success-800' : 'text-danger-800'
            }`}>
              Quality Gates {overallStatus === 'passed' ? 'Passed' : 'Failed'}
            </h3>
            <p className={`text-sm ${
              overallStatus === 'passed' ? 'text-success-600' : 'text-danger-600'
            }`}>
              {passedGates.length} of {gates.length} gates passed
            </p>
          </div>
        </div>
      </div>

      {/* Gates List */}
      <div className="space-y-3">
        {gates.map((gate, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {gate.passed ? (
                  <CheckCircle className="h-5 w-5 text-success-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-danger-600" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{gate.name}</h4>
                  <p className="text-sm text-gray-600">{gate.message}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-gray-900">
                    {gate.current.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">
                    / {gate.threshold}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatRelativeTime(gate.lastRun)}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{formatPercentage(gate.current / gate.threshold, 1)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    gate.passed ? 'bg-success-500' : 'bg-danger-500'
                  }`}
                  style={{ width: `${Math.min(100, (gate.current / gate.threshold) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-success-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Passed</p>
              <p className="text-2xl font-bold text-success-600">{passedGates.length}</p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8 text-danger-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-danger-600">{failedGates.length}</p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {gates.length > 0 ? formatPercentage(passedGates.length / gates.length, 1) : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityGates;
