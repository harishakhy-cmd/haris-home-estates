'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    isAuthenticated: false,
    userId: null as string | null,
  });

  useEffect(() => {
    // Only initialize socket on client side
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

    // Create socket connection
    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection event listeners
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnectionState((prev) => ({ ...prev, isConnected: true }));

      // Authenticate after connection
      socket.emit('authenticate', { token }, (response: any) => {
        if (response?.success) {
          console.log('Socket authenticated, userId:', response.userId);
          setConnectionState((prev) => ({
            ...prev,
            isAuthenticated: true,
            userId: response.userId,
          }));
        } else {
          console.error('Socket authentication failed:', response?.error);
        }
      });
    });

    socket.on('authenticated', (data: any) => {
      console.log('Authenticated event received:', data);
      setConnectionState((prev) => ({
        ...prev,
        isAuthenticated: true,
        userId: data.userId,
      }));
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        isAuthenticated: false,
      }));
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected: connectionState.isConnected,
        isAuthenticated: connectionState.isAuthenticated,
        userId: connectionState.userId,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
