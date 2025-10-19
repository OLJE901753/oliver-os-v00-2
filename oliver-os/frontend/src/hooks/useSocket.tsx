import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (_event: string, _data?: any) => void
  on: (_event: string, _callback: (_data: any) => void) => void
  off: (_event: string, _callback?: (_data: any) => void) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io((import.meta as any).env?.VITE_WS_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', (_reason) => {
      console.log('Disconnected from WebSocket server')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (_error) => {
      console.error('WebSocket connection error')
      setIsConnected(false)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to WebSocket server after', attemptNumber, 'attempts')
      setIsConnected(true)
    })

    newSocket.on('reconnect_error', (_error) => {
      console.error('WebSocket reconnection error')
    })

    newSocket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed')
      setIsConnected(false)
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      newSocket.close()
    }
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

  const value: SocketContextType = {
    socket,
    isConnected,
    emit,
    on,
    off,
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
