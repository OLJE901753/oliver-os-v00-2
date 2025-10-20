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
        return 'text-blue-400'
      case 'received':
        return 'text-green-400'
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
        className="fixed bottom-4 right-4 bg-brain-800 hover:bg-brain-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-50"
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
      className="fixed bottom-4 right-4 w-96 h-96 bg-brain-800/95 backdrop-blur-sm rounded-xl border border-brain-700/50 shadow-xl z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-brain-700/50">
        <h3 className="text-white font-semibold flex items-center">
          <Bug className="w-4 h-4 mr-2" />
          WebSocket Debug
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-brain-400 hover:text-white transition-colors duration-200"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Connection Status */}
      <div className="p-4 border-b border-brain-700/50">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-white">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-brain-700/50">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testThought}
            className="bg-thought-500 hover:bg-thought-600 text-white text-xs py-2 px-3 rounded transition-colors duration-200"
          >
            Test Thought
          </button>
          <button
            onClick={testAgent}
            className="bg-purple-500 hover:bg-purple-600 text-white text-xs py-2 px-3 rounded transition-colors duration-200"
          >
            Test Agent
          </button>
          <button
            onClick={testPing}
            className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded transition-colors duration-200"
          >
            Ping
          </button>
          <button
            onClick={clearLogs}
            className="bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-3 rounded transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Custom Event */}
      <div className="p-4 border-b border-brain-700/50">
        <div className="space-y-2">
          <input
            type="text"
            value={customEvent}
            onChange={(e) => setCustomEvent(e.target.value)}
            placeholder="Event name"
            className="w-full bg-brain-700/50 border border-brain-600 rounded px-3 py-2 text-white text-sm placeholder-brain-400 focus:outline-none focus:ring-2 focus:ring-thought-400"
          />
          <input
            type="text"
            value={customData}
            onChange={(e) => setCustomData(e.target.value)}
            placeholder='Data (JSON, e.g., {"key": "value"})'
            className="w-full bg-brain-700/50 border border-brain-600 rounded px-3 py-2 text-white text-sm placeholder-brain-400 focus:outline-none focus:ring-2 focus:ring-thought-400"
          />
          <button
            onClick={sendCustomEvent}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-colors duration-200 flex items-center justify-center"
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
              className="text-xs bg-brain-700/30 rounded p-2 border border-brain-600/30"
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className={getLogColor(log.type)}>
                  {getLogIcon(log.type)}
                </span>
                <span className="text-white font-medium">{log.event}</span>
                <span className="text-brain-400">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-brain-300 text-xs overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-brain-400 text-xs text-center py-4">
              No events yet
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
