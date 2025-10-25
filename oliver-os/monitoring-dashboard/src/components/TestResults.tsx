import React, { useState } from 'react';
import { TestTube, CheckCircle, XCircle, Clock, Play, RefreshCw, Filter } from 'lucide-react';
import { TestResult } from '@types/index';
import { formatDuration, formatRelativeTime, formatTimestamp } from '@utils/index';

interface TestResultsProps {
  results: TestResult[];
}

const TestResults: React.FC<TestResultsProps> = ({ results }) => {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed' | 'running' | 'pending'>('all');
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true;
    return result.status === filter;
  });

  const passedTests = results.filter(r => r.status === 'passed');
  const failedTests = results.filter(r => r.status === 'failed');
  const runningTests = results.filter(r => r.status === 'running');
  const pendingTests = results.filter(r => r.status === 'pending');

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-danger-600" />;
      case 'running':
        return <Clock className="h-5 w-5 text-warning-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return 'text-success-600 bg-success-100';
      case 'failed':
        return 'text-danger-600 bg-danger-100';
      case 'running':
        return 'text-warning-600 bg-warning-100';
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleRunTest = (testName: string) => {
    // This would trigger a test run
    console.log('Running test:', testName);
  };

  const handleRunAllTests = () => {
    // This would run all tests
    console.log('Running all tests...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
          <p className="text-sm text-gray-600">Monitor test execution and results</p>
        </div>
        <button
          onClick={handleRunAllTests}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Play className="h-4 w-4" />
          <span>Run All Tests</span>
        </button>
      </div>

      {/* Test Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-success-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Passed</p>
              <p className="text-2xl font-bold text-success-600">{passedTests.length}</p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8 text-danger-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-danger-600">{failedTests.length}</p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-warning-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-2xl font-bold text-warning-600">{runningTests.length}</p>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center space-x-3">
            <TestTube className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{results.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All', count: results.length },
          { key: 'passed', label: 'Passed', count: passedTests.length },
          { key: 'failed', label: 'Failed', count: failedTests.length },
          { key: 'running', label: 'Running', count: runningTests.length },
          { key: 'pending', label: 'Pending', count: pendingTests.length },
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

      {/* Test Results List */}
      <div className="space-y-3">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tests found</p>
          </div>
        ) : (
          filteredResults.map((test) => (
            <div
              key={test.id}
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTest(test)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{test.name}</h4>
                    <p className="text-sm text-gray-600">
                      Duration: {formatDuration(test.duration)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                      {test.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(test.timestamp)}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunTest(test.name);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Run test"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Test Detail Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Test Details</h3>
              <button
                onClick={() => setSelectedTest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600">Test Name</h4>
                <p className="text-lg text-gray-900">{selectedTest.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Status</h4>
                  <p className={`capitalize ${getStatusColor(selectedTest.status)}`}>
                    {selectedTest.status}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Duration</h4>
                  <p className="text-gray-900">{formatDuration(selectedTest.duration)}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600">Timestamp</h4>
                <p className="text-gray-900">{formatTimestamp(selectedTest.timestamp)}</p>
              </div>
              
              {selectedTest.details && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Details</h4>
                  <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                    {selectedTest.details}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  handleRunTest(selectedTest.name);
                  setSelectedTest(null);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Run Test
              </button>
              <button
                onClick={() => setSelectedTest(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResults;
