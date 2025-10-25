import React from 'react';
import { X, BarChart3, Activity, Cpu, Shield, AlertTriangle, TestTube, Database } from 'lucide-react';
import { cn } from '@utils/index';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Tab[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  onTabChange, 
  tabs 
}) => {
  const iconMap = {
    BarChart3,
    Activity,
    Cpu,
    Shield,
    AlertTriangle,
    TestTube,
    Database,
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = iconMap[tab.icon.name as keyof typeof iconMap] || BarChart3;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    activeTab === tab.id
                      ? "bg-primary-100 text-primary-700 border-r-2 border-primary-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div>Smart Assistance v1.0.0</div>
            <div>Monitoring Dashboard</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
