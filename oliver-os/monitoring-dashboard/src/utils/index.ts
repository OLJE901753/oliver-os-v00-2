import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
  return format(date, 'MMM dd, yyyy HH:mm:ss');
}

export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getStatusColor(status: 'healthy' | 'warning' | 'critical'): string {
  switch (status) {
    case 'healthy':
      return 'text-success-600 bg-success-100';
    case 'warning':
      return 'text-warning-600 bg-warning-100';
    case 'critical':
      return 'text-danger-600 bg-danger-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return '↗️';
    case 'down':
      return '↘️';
    case 'stable':
      return '→';
    default:
      return '→';
  }
}

export function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return 'text-success-600';
    case 'down':
      return 'text-danger-600';
    case 'stable':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

export function calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable';

  const recent = data.slice(-5);
  const older = data.slice(-10, -5);

  if (older.length === 0) return 'stable';

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const change = (recentAvg - olderAvg) / olderAvg;

  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'stable';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateMockData(type: 'metrics' | 'performance' | 'alerts', count: number = 10) {
  const now = new Date();
  
  switch (type) {
    case 'metrics':
      return Array.from({ length: count }, (_, i) => ({
        name: `Metric ${i + 1}`,
        value: Math.random() * 100,
        threshold: 80,
        status: Math.random() > 0.8 ? 'critical' : Math.random() > 0.6 ? 'warning' : 'healthy',
        timestamp: new Date(now.getTime() - i * 60000).toISOString(),
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        unit: '%'
      }));
    
    case 'performance':
      return Array.from({ length: count }, (_, i) => ({
        timestamp: new Date(now.getTime() - i * 60000).toISOString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        responseTime: Math.random() * 1000,
        throughput: Math.random() * 1000
      }));
    
    case 'alerts':
      return Array.from({ length: count }, (_, i) => ({
        id: `alert-${i + 1}`,
        type: ['warning', 'critical', 'info'][Math.floor(Math.random() * 3)] as 'warning' | 'critical' | 'info',
        metric: `Metric ${i + 1}`,
        message: `Alert message ${i + 1}`,
        timestamp: new Date(now.getTime() - i * 300000).toISOString(),
        resolved: Math.random() > 0.7,
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      }));
    
    default:
      return [];
  }
}
