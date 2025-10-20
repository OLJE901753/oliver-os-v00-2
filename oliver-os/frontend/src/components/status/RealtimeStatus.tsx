import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Activity, Clock, Brain } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface SystemStatus {
  websocket: 'connected' | 'disconnected' | 'connecting'
  aiServices: 'online' | 'offline' | 'unknown'
  database: 'online' | 'offline' | 'unknown'
  lastUpdate: Date
}

export const RealtimeStatus: React.FC = () => {
  const { isConnected, on, ping } = useSocket()
  const [status, setStatus] = useState<SystemStatus>({
    websocket: 'disconnected',
    aiServices: 'unknown',
    database: 'unknown',
    lastUpdate: new Date()
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const [pingLatency, setPingLatency] = useState<number | null>(null)

  useEffect(() => {
    // Update WebSocket status
    setStatus(prev => ({
      ...prev,
      websocket: isConnected ? 'connected' : 'disconnected',
      lastUpdate: new Date()
    }))

    // Listen for system status updates
    on('system:status', (data) => {
      setStatus(prev => ({
        ...prev,
        aiServices: data.ai_services || 'unknown',
        database: data.database || 'unknown',
        lastUpdate: new Date()
      }))
    })

    // Listen for pong responses to measure latency
    on('pong', (data) => {
      const now = new Date()
      const sentTime = new Date(data.timestamp)
      const latency = now.getTime() - sentTime.getTime()
      setPingLatency(latency)
    })

    // Ping the server periodically
    const pingInterval = setInterval(() => {
      if (isConnected) {
        ping()
      }
    }, 30000) // Ping every 30 seconds

    return () => {
      clearInterval(pingInterval)
    }
  }, [isConnected, on, ping])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
        return 'text-green-400'
      case 'disconnected':
      case 'offline':
        return 'text-red-400'
      case 'connecting':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
        return <Wifi className="w-4 h-4" />
      case 'disconnected':
      case 'offline':
        return <WifiOff className="w-4 h-4" />
      case 'connecting':
        return <Activity className="w-4 h-4 animate-pulse" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-brain-800/90 backdrop-blur-sm rounded-xl border border-brain-700/50 shadow-lg"
      >
        {/* Status Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-3 p-4 hover:bg-brain-700/50 transition-colors duration-200 rounded-xl"
        >
          <div className={`${getStatusColor(status.websocket)}`}>
            {getStatusIcon(status.websocket)}
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-medium">
              Oliver-OS Status
            </p>
            <p className="text-brain-400 text-xs">
              {status.websocket === 'connected' ? 'Connected' : 'Disconnected'}
              {pingLatency && ` • ${pingLatency}ms`}
            </p>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-brain-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </button>

        {/* Expanded Status Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-brain-700/50"
            >
              <div className="p-4 space-y-4">
                {/* WebSocket Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`${getStatusColor(status.websocket)}`}>
                      {getStatusIcon(status.websocket)}
                    </div>
                    <span className="text-white text-sm">WebSocket</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    status.websocket === 'connected' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {status.websocket}
                  </span>
                </div>

                {/* AI Services Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`${getStatusColor(status.aiServices)}`}>
                      <Brain className="w-4 h-4" />
                    </div>
                    <span className="text-white text-sm">AI Services</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    status.aiServices === 'online' 
                      ? 'bg-green-500/20 text-green-400' 
                      : status.aiServices === 'offline'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {status.aiServices}
                  </span>
                </div>

                {/* Database Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`${getStatusColor(status.database)}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-white text-sm">Database</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    status.database === 'online' 
                      ? 'bg-green-500/20 text-green-400' 
                      : status.database === 'offline'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {status.database}
                  </span>
                </div>

                {/* Last Update */}
                <div className="flex items-center space-x-2 text-brain-400 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>
                    Last update: {status.lastUpdate.toLocaleTimeString()}
                  </span>
                </div>

                {/* Connection Info */}
                {isConnected && (
                  <div className="pt-2 border-t border-brain-700/50">
                    <div className="flex items-center justify-between text-xs text-brain-400">
                      <span>Latency</span>
                      <span>{pingLatency ? `${pingLatency}ms` : 'Measuring...'}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
