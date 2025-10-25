import React from 'react';
import { Menu, Wifi, WifiOff, RefreshCw, Settings } from 'lucide-react';
import { formatRelativeTime } from '@utils/index';

interface HeaderProps {
  isConnected: boolean;
  lastUpdated: Date;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ isConnected, lastUpdated, onMenuClick }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SA</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Smart Assistance
                </h1>
                <p className="text-sm text-gray-500">Monitoring Dashboard</p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-success-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-danger-600" />
              )}
              <span className={`text-sm font-medium ${
                isConnected ? 'text-success-600' : 'text-danger-600'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Last Updated */}
            <div className="text-sm text-gray-500">
              Updated {formatRelativeTime(lastUpdated)}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              title="Refresh Dashboard"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            {/* Settings Button */}
            <button
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
