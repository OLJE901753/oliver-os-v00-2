import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SystemStatus } from '../types';

export function useOSStatus() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [data, setData] = useState<SystemStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected to Oliver-OS');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('system:status', (status: SystemStatus) => {
      setData(status);
    });

    socketInstance.on('system:logs', (log: { timestamp: string; level: string; message: string }) => {
      setData(prev => ({
        ...prev!,
        logs: [...(prev?.logs || []), log].slice(-50),
      }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { data, isConnected, socket };
}
