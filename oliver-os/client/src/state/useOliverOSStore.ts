import { create } from 'zustand';

interface OliverOSState {
  // Real-time data
  realTimeThoughtCount: number;
  agentStatus: string;
  systemHealth: number;
  networkLatency: number;
  
  // UI state
  activePanel: string | null;
  isInterfaceActive: boolean;
  
  // Actions
  updateThoughtCount: (count: number) => void;
  updateAgentStatus: (status: string) => void;
  updateSystemHealth: (health: number) => void;
  updateNetworkLatency: (latency: number) => void;
  setActivePanel: (panel: string | null) => void;
  toggleInterface: () => void;
}

export const useOliverOSStore = create<OliverOSState>((set) => ({
  // Initial state
  realTimeThoughtCount: 42,
  agentStatus: 'Processing',
  systemHealth: 85,
  networkLatency: 12,
  activePanel: null,
  isInterfaceActive: true,
  
  // Actions
  updateThoughtCount: (count) => set({ realTimeThoughtCount: count }),
  updateAgentStatus: (status) => set({ agentStatus: status }),
  updateSystemHealth: (health) => set({ systemHealth: health }),
  updateNetworkLatency: (latency) => set({ networkLatency: latency }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleInterface: () => set((state) => ({ isInterfaceActive: !state.isInterfaceActive })),
}));

// Mock data updater for demonstration
export const startMockDataUpdates = () => {
  setInterval(() => {
    const store = useOliverOSStore.getState();
    
    // Update thought count
    store.updateThoughtCount(Math.floor(Math.random() * 100) + 20);
    
    // Update agent status
    const statuses = ['Processing', 'Idle', 'Active', 'Learning', 'Analyzing'];
    store.updateAgentStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    
    // Update system health
    store.updateSystemHealth(Math.floor(Math.random() * 20) + 80);
    
    // Update network latency
    store.updateNetworkLatency(Math.floor(Math.random() * 20) + 5);
  }, 2000); // Update every 2 seconds
};
