import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { PerformanceData } from '@types/index';
import { formatBytes, formatDuration, formatTimestamp } from '@utils/index';

interface PerformanceChartsProps {
  data: PerformanceData[];
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ data }) => {
  // Process data for charts
  const chartData = data.map(item => ({
    ...item,
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    memoryMB: item.memory / 1024 / 1024, // Convert to MB
  }));

  const latestData = data[0] || {
    cpu: 0,
    memory: 0,
    responseTime: 0,
    throughput: 0,
    timestamp: new Date().toISOString()
  };

  const metrics = [
    {
      title: 'CPU Usage',
      value: latestData.cpu,
      unit: '%',
      color: '#3b82f6',
      trend: data.length > 1 ? (data[0].cpu - data[1].cpu) : 0,
    },
    {
      title: 'Memory Usage',
      value: latestData.memory,
      unit: 'MB',
      color: '#10b981',
      trend: data.length > 1 ? (data[0].memory - data[1].memory) : 0,
    },
    {
      title: 'Response Time',
      value: latestData.responseTime,
      unit: 'ms',
      color: '#f59e0b',
      trend: data.length > 1 ? (data[0].responseTime - data[1].responseTime) : 0,
    },
    {
      title: 'Throughput',
      value: latestData.throughput,
      unit: 'req/s',
      color: '#ef4444',
      trend: data.length > 1 ? (data[0].throughput - data[1].throughput) : 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value.toFixed(1)}{metric.unit}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  metric.trend > 0 ? 'text-success-600' : 
                  metric.trend < 0 ? 'text-danger-600' : 'text-gray-600'
                }`}>
                  {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">vs prev</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CPU Usage</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'CPU Usage']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Usage Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}MB`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}MB`, 'Memory Usage']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="memoryMB"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Time Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}ms`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}ms`, 'Response Time']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Throughput</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}/s`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)} req/s`, 'Throughput']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="throughput"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {data.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Memory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Throughput
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(item.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.cpu.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatBytes(item.memory)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(item.responseTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.throughput.toFixed(1)} req/s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceCharts;
