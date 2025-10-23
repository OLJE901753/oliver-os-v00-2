import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bug, Send, EyeOff } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface LogEntry {
  id: string
  timestamp: Date
  type: 'sent' | 'received' | 'error'
  event: string
  data: any
}

export const WebSocketDebug: React.FC = () => {
  const { isConnected, emit, on, createThought, spawnAgent, ping } = useSocket()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [customEvent, setCustomEvent] = useState('')
  const [customData, setCustomData] = useState('')

  useEffect(() => {
    // Log all WebSocket events
    const logEvent = (type: 'sent' | 'received' | 'error', event: string, data: any) => {
      const logEntry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type,
        event,
        data
      }
      setLogs(prev => [logEntry, ...prev].slice(0, 100)) // Keep last 100 logs
    }

    // Listen to all events
    const events = [
      'connect', 'disconnect', 'connected', 'pong',
      'thought:processed', 'thought:error', 'thought:analyzed',
      'agent:spawned', 'agent:spawn_error',
      'voice:transcribed', 'voice:error',
      'collaboration:joined', 'collaboration:left',
      'subscribed', 'unsubscribed'
    ]

    events.forEach(event => {
      on(event, (data) => {
        logEvent('received', event, data)
      })
    })

    // Note: We can't easily override emit here without causing issues
    // The emit function is already wrapped in useCallback

    return () => {
      // Cleanup
    }
  }, [on, emit])

  const sendCustomEvent = () => {
    if (!customEvent.trim()) return

    try {
      const data = customData.trim() ? JSON.parse(customData) : undefined
      emit(customEvent, data)
      setCustomEvent('')
      setCustomData('')
    } catch (error) {
      console.error('Invalid JSON data:', error)
    }
  }

  const testThought = () => {
    createThought({
      content: 'Test thought from debug panel',
      user_id: 'debug-user',
      metadata: { source: 'debug' },
      tags: ['debug', 'test']
    })
  }

  const testAgent = () => {
    spawnAgent({
      agent_type: 'thought_processor',
      prompt: 'Process this test thought',
      metadata: { source: 'debug' }
    })
  }

  const testPing = () => {
    ping()
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'sent':
        return 'text-cyan-400'
      case 'received':
        return 'text-lime-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'sent':
        return '→'
      case 'received':
        return '←'
      case 'error':
        return '⚠'
      default:
        return '•'
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 glass-card border border-lime-500/20 shadow-neon-lime text-white p-3 rounded-full transition-all duration-300 z-50 hover:bg-lime-500/10"
        title="WebSocket Debug"
      >
        <Bug className="w-5 h-5" />
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 w-96 h-96 glass-card border border-lime-500/20 shadow-neon-lime z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-lime-500/20">
        <h3 className="text-white font-semibold flex items-center neon-text">
          <Bug className="w-4 h-4 mr-2 text-lime-400" />
          WebSocket Debug
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors duration-200"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Connection Status */}
      <div className="p-4 border-b border-lime-500/20">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full animate-neon-pulse ${isConnected ? 'bg-lime-400' : 'bg-red-400'}`} />
          <span className="text-sm text-white">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-lime-500/20">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testThought}
            className="neon-button text-white text-xs py-2 px-3 rounded transition-all duration-300"
          >
            Test Thought
          </button>
          <button
            onClick={testAgent}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 text-xs py-2 px-3 rounded transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50"
          >
            Test Agent
          </button>
          <button
            onClick={testPing}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs py-2 px-3 rounded transition-all duration-300 border border-cyan-500/30 hover:border-cyan-500/50"
          >
            Ping
          </button>
          <button
            onClick={clearLogs}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 text-xs py-2 px-3 rounded transition-all duration-300 border border-red-500/30 hover:border-red-500/50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Custom Event */}
      <div className="p-4 border-b border-lime-500/20">
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={customEvent}
              onChange={(e) => setCustomEvent(e.target.value)}
              placeholder="Event name"
              className="futuristic-input w-full text-sm"
            />
            <div className="absolute inset-0 rounded-lg bg-lime-400/5 pointer-events-none"></div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={customData}
              onChange={(e) => setCustomData(e.target.value)}
              placeholder='Data (JSON, e.g., {"key": "value"})'
              className="futuristic-input w-full text-sm"
            />
            <div className="absolute inset-0 rounded-lg bg-lime-400/5 pointer-events-none"></div>
          </div>
          <button
            onClick={sendCustomEvent}
            className="w-full neon-button-secondary text-white text-xs py-2 px-3 rounded transition-all duration-300 flex items-center justify-center"
          >
            <Send className="w-3 h-3 mr-1" />
            Send Event
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="text-xs glass-panel rounded p-2 border border-lime-500/10"
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className={getLogColor(log.type)}>
                  {getLogIcon(log.type)}
                </span>
                <span className="text-white font-medium">{log.event}</span>
                <span className="text-gray-400 flex items-center">
                  <div className="w-1 h-1 bg-lime-400 rounded-full mr-1 animate-neon-pulse"></div>
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-gray-300 text-xs overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-4">
              <div className="relative mb-2">
                <Bug className="w-8 h-8 mx-auto text-gray-400 opacity-50" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-lime-400/20 rounded-full blur-xl"
                />
              </div>
              <p className="text-gray-400 text-xs">
                No events yet
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
