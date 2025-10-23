import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (_event: string, _data?: any) => void
  on: (_event: string, _callback: (_data: any) => void) => void
  off: (_event: string, _callback?: (_data: any) => void) => void
  
  // Oliver-OS specific methods
  createThought: (data: { content: string; user_id?: string; metadata?: any; tags?: string[] }) => void
  analyzeThought: (thoughtId: string) => void
  spawnAgent: (data: { agent_type: string; prompt: string; metadata?: any }) => void
  sendVoiceData: (data: { audio_data: any; user_id?: string; metadata?: any }) => void
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
  ping: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection - disabled for frontend-only mode
    // const newSocket = io((import.meta as any).env?.VITE_WS_URL || 'http://localhost:3000', {
    //   transports: ['websocket'],
    //   autoConnect: true,
    //   reconnection: true,
    //   reconnectionAttempts: 5,
    //   reconnectionDelay: 1000,
    // })
    
    // Mock socket for frontend-only mode
    const newSocket = null

    // Connection event handlers - disabled for frontend-only mode
    // newSocket.on('connect', () => {
    //   console.log('Connected to WebSocket server')
    //   setIsConnected(true)
    // })

    // newSocket.on('connected', (data) => {
    //   console.log('Welcome message:', data.message)
    //   console.log('Client ID:', data.client_id)
    // })

    // newSocket.on('disconnect', (_reason) => {
    //   console.log('Disconnected from WebSocket server')
    //   setIsConnected(false)
    // })

    // newSocket.on('connect_error', (_error) => {
    //   console.error('WebSocket connection error')
    //   setIsConnected(false)
    // })

    // newSocket.on('reconnect', (attemptNumber) => {
    //   console.log('Reconnected to WebSocket server after', attemptNumber, 'attempts')
    //   setIsConnected(true)
    // })

    // newSocket.on('reconnect_error', (_error) => {
    //   console.error('WebSocket reconnection error')
    // })

    // newSocket.on('reconnect_failed', () => {
    //   console.error('WebSocket reconnection failed')
    //   setIsConnected(false)
    // })

    // Backend-specific event handlers - disabled for frontend-only mode
    // newSocket.on('pong', (data) => {
    //   console.log('Pong received:', data.timestamp)
    // })

    // newSocket.on('subscribed', (data) => {
    //   console.log('Subscribed to channel:', data.channel)
    // })

    // newSocket.on('unsubscribed', (data) => {
    //   console.log('Unsubscribed from channel:', data.channel)
    // })

    setSocket(newSocket)

    // Cleanup on unmount - disabled for frontend-only mode
    // return () => {
    //   newSocket.close()
    // }
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    if (socket && isConnected) {
      console.log('Emitting event:', event, data)
      socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }, [socket, isConnected])

  const on = useCallback((event: string, callback: (_data: any) => void) => {
    if (socket) {
      console.log('Listening to event:', event)
      socket.on(event, callback)
    }
  }, [socket])

  const off = useCallback((event: string, callback?: (_data: any) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback)
      } else {
        socket.off(event)
      }
    }
  }, [socket])

  // Oliver-OS specific methods
  const createThought = useCallback((data: { content: string; user_id?: string; metadata?: any; tags?: string[] }) => {
    emit('thought:create', data)
  }, [emit])

  const analyzeThought = useCallback((thoughtId: string) => {
    emit('thought:analyze', { thought_id: thoughtId })
  }, [emit])

  const spawnAgent = useCallback((data: { agent_type: string; prompt: string; metadata?: any }) => {
    emit('agent:spawn', data)
  }, [emit])

  const sendVoiceData = useCallback((data: { audio_data: any; user_id?: string; metadata?: any }) => {
    emit('voice:data', data)
  }, [emit])

  const subscribe = useCallback((channel: string) => {
    emit('subscribe', channel)
  }, [emit])

  const unsubscribe = useCallback((channel: string) => {
    emit('unsubscribe', channel)
  }, [emit])

  const ping = useCallback(() => {
    emit('ping')
  }, [emit])

  const value: SocketContextType = {
    socket,
    isConnected,
    emit,
    on,
    off,
    createThought,
    analyzeThought,
    spawnAgent,
    sendVoiceData,
    subscribe,
    unsubscribe,
    ping,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
