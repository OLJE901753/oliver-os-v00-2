/**
 * Dashboard Components
 * Comprehensive dashboard with learning events, knowledge graph stats, memory stats, and agent activity
 * Following BMAD principles: Break, Map, Automate, Document
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Brain,
  Database,
  Activity,
  Zap,
  Network,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  MessageSquare,
  BarChart3,
  PieChart,
} from 'lucide-react';

// Types
interface LearningEvent {
  timestamp: string;
  event: string;
  data: Record<string, unknown>;
  context?: Record<string, unknown>;
}

interface KnowledgeGraphStats {
  totalNodes: number;
  totalRelationships: number;
  nodesByType: Record<string, number>;
  relationshipsByType: Record<string, number>;
  averageConnections: number;
}

interface MemoryStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  queueSize: number;
  processingRate: number;
}

interface AgentActivity {
  totalAgents: number;
  activeAgents: number;
  completedTasks: number;
  failedTasks: number;
  recentActivity: Array<{
    agent: string;
    action: string;
    timestamp: string;
  }>;
}

const API_BASE = 'http://localhost:3000/api';

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  subtitle?: string;
  color?: string;
}> = ({ title, value, icon, trend, subtitle, color = 'neon' }) => {
  const colorClasses = {
    neon: 'text-neon-400 border-neon-500/30 bg-neon-900/20',
    blue: 'text-blue-400 border-blue-500/30 bg-blue-900/20',
    green: 'text-green-400 border-green-500/30 bg-green-900/20',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-900/20',
    purple: 'text-purple-400 border-purple-500/30 bg-purple-900/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-400">{title}</div>
        <div className="text-gray-500">{icon}</div>
      </div>
      <div className="text-2xl font-orbitron mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      {trend !== undefined && (
        <div className={`text-xs mt-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '+' : ''}{trend}% from last period
        </div>
      )}
    </motion.div>
  );
};

// Learning Events Dashboard
const LearningEventsDashboard: React.FC = () => {
  const { data: eventsData } = useQuery({
    queryKey: ['learning-events'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/learning/events`);
      if (!res.ok) throw new Error('Failed to fetch learning events');
      const data = await res.json();
      return data.events as LearningEvent[];
    },
    refetchInterval: 5000,
  });

  const events = eventsData || [];

  const eventTypes = events.reduce((acc, event) => {
    const type = event.event.split('_')[0];
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentEvents = events.slice(-10).reverse();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-orbitron text-neon-400 flex items-center mb-4">
        <Zap className="w-5 h-5 mr-2" />
        Learning Events
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StatCard
          title="Total Events"
          value={events.length}
          icon={<Activity className="w-5 h-5" />}
          color="neon"
        />
        <StatCard
          title="Event Types"
          value={Object.keys(eventTypes).length}
          icon={<BarChart3 className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Last 24h"
          value={events.filter((e) => {
            const eventDate = new Date(e.timestamp);
            const now = new Date();
            return now.getTime() - eventDate.getTime() < 24 * 60 * 60 * 1000;
          }).length}
          icon={<Clock className="w-5 h-5" />}
          color="green"
        />
      </div>

      <div className="glass-card p-4 rounded-lg border border-neon-500/30">
        <h4 className="text-sm font-semibold text-neon-400 mb-3">Recent Events</h4>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {recentEvents.map((event, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-2 bg-black/40 rounded text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-neon-400 font-semibold">{event.event}</span>
                <span className="text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {event.data && Object.keys(event.data).length > 0 && (
                <div className="text-gray-400 mt-1 line-clamp-1">
                  {JSON.stringify(event.data).substring(0, 100)}...
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Knowledge Graph Stats Component
const KnowledgeGraphStats: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['knowledge-graph', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/knowledge/stats`);
      if (!res.ok) throw new Error('Failed to fetch knowledge graph stats');
      return res.json() as KnowledgeGraphStats;
    },
    refetchInterval: 10000,
  });

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-orbitron text-neon-400 flex items-center mb-4">
        <Network className="w-5 h-5 mr-2" />
        Knowledge Graph Stats
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Total Nodes"
          value={stats.totalNodes}
          icon={<Brain className="w-5 h-5" />}
          color="neon"
        />
        <StatCard
          title="Relationships"
          value={stats.totalRelationships}
          icon={<Network className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Avg Connections"
          value={stats.averageConnections.toFixed(1)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Node Types"
          value={stats.nodesByType ? Object.keys(stats.nodesByType).length : 0}
          icon={<PieChart className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-lg border border-neon-500/30">
          <h4 className="text-sm font-semibold text-neon-400 mb-3">Nodes by Type</h4>
          <div className="space-y-2">
            {stats.nodesByType ? Object.entries(stats.nodesByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize text-sm">{type.replace('_', ' ')}</span>
                <span className="text-neon-400 font-semibold">{count}</span>
              </div>
            )) : (
              <div className="text-gray-400 text-sm">No data available</div>
            )}
          </div>
        </div>

        <div className="glass-card p-4 rounded-lg border border-neon-500/30">
          <h4 className="text-sm font-semibold text-neon-400 mb-3">Relationships by Type</h4>
          <div className="space-y-2">
            {stats.relationshipsByType ? Object.entries(stats.relationshipsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize text-sm">{type.replace('_', ' ')}</span>
                <span className="text-blue-400 font-semibold">{count}</span>
              </div>
            )) : (
              <div className="text-gray-400 text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Memory Capture Stats Component
const MemoryCaptureStats: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['memory', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/memory/stats`);
      if (!res.ok) throw new Error('Failed to fetch memory stats');
      return res.json() as MemoryStats;
    },
    refetchInterval: 5000,
  });

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-orbitron text-neon-400 flex items-center mb-4">
        <Database className="w-5 h-5 mr-2" />
        Memory Capture Stats
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Total Memories"
          value={stats.total}
          icon={<FileText className="w-5 h-5" />}
          color="neon"
        />
        <StatCard
          title="In Queue"
          value={stats.queueSize}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Processing Rate"
          value={`${stats.processingRate}/min`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Memory Types"
          value={stats.byType ? Object.keys(stats.byType).length : 0}
          icon={<BarChart3 className="w-5 h-5" />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-lg border border-neon-500/30">
          <h4 className="text-sm font-semibold text-neon-400 mb-3">By Status</h4>
          <div className="space-y-2">
            {stats.byStatus ? Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize text-sm">{status}</span>
                <span className="text-neon-400 font-semibold">{count}</span>
              </div>
            )) : (
              <div className="text-gray-400 text-sm">No data available</div>
            )}
          </div>
        </div>

        <div className="glass-card p-4 rounded-lg border border-neon-500/30">
          <h4 className="text-sm font-semibold text-neon-400 mb-3">By Type</h4>
          <div className="space-y-2">
            {stats.byType ? Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize text-sm">{type}</span>
                <span className="text-purple-400 font-semibold">{count}</span>
              </div>
            )) : (
              <div className="text-gray-400 text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Agent Activity Monitoring Component
const AgentActivityMonitoring: React.FC = () => {
  const { data: statusData } = useQuery({
    queryKey: ['unified-agent', 'status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/unified/status`);
      if (!res.ok) throw new Error('Failed to fetch agent status');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: decisionsData } = useQuery({
    queryKey: ['unified-agent', 'decisions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/unified/decisions`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.decisions || [];
    },
    refetchInterval: 5000,
  });

  const decisions = decisionsData || [];
  const recentDecisions = decisions.slice(-10).reverse();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-orbitron text-neon-400 flex items-center mb-4">
        <Activity className="w-5 h-5 mr-2" />
        Agent Activity
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StatCard
          title="Total Decisions"
          value={decisions.length}
          icon={<CheckCircle className="w-5 h-5" />}
          color="neon"
        />
        <StatCard
          title="System Status"
          value={statusData?.status || 'unknown'}
          icon={<Activity className="w-5 h-5" />}
          color="green"
          subtitle={statusData?.message}
        />
        <StatCard
          title="Last 24h"
          value={recentDecisions.filter((d: any) => {
            const decisionDate = new Date(d.timestamp || d.createdAt);
            const now = new Date();
            return now.getTime() - decisionDate.getTime() < 24 * 60 * 60 * 1000;
          }).length}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="glass-card p-4 rounded-lg border border-neon-500/30">
        <h4 className="text-sm font-semibold text-neon-400 mb-3">Recent Decisions</h4>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {recentDecisions.length > 0 ? (
            recentDecisions.map((decision: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-2 bg-black/40 rounded text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-neon-400 font-semibold">
                    {decision.agent || decision.sender || 'Unknown'}
                  </span>
                  <span className="text-gray-500">
                    {new Date(decision.timestamp || decision.createdAt || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                {decision.message && (
                  <div className="text-gray-400 mt-1 line-clamp-1">{decision.message}</div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'learning' | 'knowledge' | 'memory' | 'agents'>('overview');

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-neon-500/20 glass-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-orbitron text-neon-400 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Oliver-OS Dashboard
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'learning', label: 'Learning' },
            { id: 'knowledge', label: 'Knowledge' },
            { id: 'memory', label: 'Memory' },
            { id: 'agents', label: 'Agents' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-neon-500 text-black shadow-neon-blue'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Nodes"
                value="..."
                icon={<Brain className="w-5 h-5" />}
                color="neon"
              />
              <StatCard
                title="Total Memories"
                value="..."
                icon={<FileText className="w-5 h-5" />}
                color="blue"
              />
              <StatCard
                title="Learning Events"
                value="..."
                icon={<Zap className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                title="Agent Decisions"
                value="..."
                icon={<Activity className="w-5 h-5" />}
                color="amber"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LearningEventsDashboard />
              <MemoryCaptureStats />
            </div>
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="max-w-7xl mx-auto">
            <LearningEventsDashboard />
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="max-w-7xl mx-auto">
            <KnowledgeGraphStats />
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="max-w-7xl mx-auto">
            <MemoryCaptureStats />
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="max-w-7xl mx-auto">
            <AgentActivityMonitoring />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

