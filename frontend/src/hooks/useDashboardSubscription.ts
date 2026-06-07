'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';

export type DashboardEventType =
  | 'propertyCreated'
  | 'propertyUpdated'
  | 'paymentReceived'
  | 'bookingStatusChanged'
  | 'maintenanceUpdated'
  | 'statisticsUpdated';

export interface DashboardEvent {
  type: DashboardEventType;
  data: any;
  timestamp: string;
}

interface UseDashboardSubscriptionReturn {
  isConnected: boolean;
  isConnecting: boolean;
  subscribe: (eventType: DashboardEventType, callback: (data: any) => void) => () => void;
  unsubscribe: (eventType: DashboardEventType, callback: (data: any) => void) => void;
}

export function useDashboardSubscription(): UseDashboardSubscriptionReturn {
  const { user, token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const isConnectingRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const listeners = useRef(new Map<DashboardEventType, Set<(data: any) => void> >());

  useEffect(() => {
    if (!user || !token) return;

    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    try {
      const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/dashboard`, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('Connected to dashboard namespace');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from dashboard namespace');
        setIsConnected(false);
      });

      socket.on('connected', (data) => {
        console.log('Dashboard connection confirmed:', data);
      });

      const eventTypes: DashboardEventType[] = [
        'propertyCreated',
        'propertyUpdated',
        'paymentReceived',
        'bookingStatusChanged',
        'maintenanceUpdated',
        'statisticsUpdated',
      ];

      eventTypes.forEach((eventType) => {
        socket.on(eventType, (data) => {
          const callbacks = listeners.current.get(eventType);
          if (callbacks) {
            callbacks.forEach((callback) => {
              try {
                callback(data);
              } catch (error) {
                console.error(`Error in ${eventType} callback:`, error);
              }
            });
          }
        });
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to connect to dashboard:', error);
    } finally {
      isConnectingRef.current = false;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user, token]);

  const subscribe = useCallback(
    (eventType: DashboardEventType, callback: (data: any) => void) => {
      if (!listeners.current.has(eventType)) {
        listeners.current.set(eventType, new Set());
      }
      listeners.current.get(eventType)!.add(callback);

      return () => {
        listeners.current.get(eventType)?.delete(callback);
      };
    },
    []
  );

  const unsubscribe = useCallback(
    (eventType: DashboardEventType, callback: (data: any) => void) => {
      listeners.current.get(eventType)?.delete(callback);
    },
    []
  );

  return {
    isConnected,
    isConnecting: isConnectingRef.current,
    subscribe,
    unsubscribe,
  };
}
