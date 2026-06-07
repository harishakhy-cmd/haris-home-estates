'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useDashboardSubscription, DashboardEventType } from '@/hooks/useDashboardSubscription';

export interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  location: string;
  images: string[];
  ownerId: string;
  status: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  amount: number;
  landlordId: string;
  tenantId: string;
  propertyId: string;
  status: string;
  createdAt: Date;
}

export interface Booking {
  id: string;
  status: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  updatedAt: Date;
}

export interface DashboardStats {
  totalProperties?: number;
  totalBookings?: number;
  totalRevenue?: number;
  activeListings?: number;
  pendingBookings?: number;
  [key: string]: any;
}

interface DashboardState {
  properties: Property[];
  payments: Payment[];
  bookings: Booking[];
  stats: DashboardStats;
  lastUpdated: {
    properties?: Date;
    payments?: Date;
    bookings?: Date;
    stats?: Date;
  };
}

type DashboardAction =
  | { type: 'ADD_PROPERTY'; payload: Property }
  | { type: 'UPDATE_PROPERTY'; payload: Property }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'UPDATE_BOOKING'; payload: Booking }
  | { type: 'UPDATE_STATS'; payload: DashboardStats }
  | { type: 'SET_PROPERTIES'; payload: Property[] }
  | { type: 'SET_BOOKINGS'; payload: Booking[] };

const initialState: DashboardState = {
  properties: [],
  payments: [],
  bookings: [],
  stats: {},
  lastUpdated: {},
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'ADD_PROPERTY':
      return {
        ...state,
        properties: [action.payload, ...state.properties],
        lastUpdated: { ...state.lastUpdated, properties: new Date() },
      };

    case 'UPDATE_PROPERTY':
      return {
        ...state,
        properties: state.properties.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
        lastUpdated: { ...state.lastUpdated, properties: new Date() },
      };

    case 'ADD_PAYMENT':
      return {
        ...state,
        payments: [action.payload, ...state.payments],
        lastUpdated: { ...state.lastUpdated, payments: new Date() },
      };

    case 'ADD_BOOKING':
      return {
        ...state,
        bookings: [action.payload, ...state.bookings],
        lastUpdated: { ...state.lastUpdated, bookings: new Date() },
      };

    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
        lastUpdated: { ...state.lastUpdated, bookings: new Date() },
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: action.payload,
        lastUpdated: { ...state.lastUpdated, stats: new Date() },
      };

    case 'SET_PROPERTIES':
      return {
        ...state,
        properties: action.payload,
        lastUpdated: { ...state.lastUpdated, properties: new Date() },
      };

    case 'SET_BOOKINGS':
      return {
        ...state,
        bookings: action.payload,
        lastUpdated: { ...state.lastUpdated, bookings: new Date() },
      };

    default:
      return state;
  }
}

interface DashboardContextType {
  state: DashboardState;
  addProperty: (property: Property) => void;
  updateProperty: (property: Property) => void;
  addPayment: (payment: Payment) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (booking: Booking) => void;
  updateStats: (stats: DashboardStats) => void;
  setProperties: (properties: Property[]) => void;
  setBookings: (bookings: Booking[]) => void;
  isConnected: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: React.ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { isConnected, subscribe } = useDashboardSubscription();

  useEffect(() => {
    // Subscribe to all dashboard events
    const unsubscribers: Array<() => void> = [];

    const events: DashboardEventType[] = [
      'propertyCreated',
      'propertyUpdated',
      'paymentReceived',
      'bookingStatusChanged',
      'maintenanceUpdated',
      'statisticsUpdated',
    ];

    events.forEach((eventType) => {
      const unsubscribe = subscribe(eventType, (data) => {
        switch (eventType) {
          case 'propertyCreated':
            dispatch({ type: 'ADD_PROPERTY', payload: data });
            break;
          case 'propertyUpdated':
            dispatch({ type: 'UPDATE_PROPERTY', payload: data });
            break;
          case 'paymentReceived':
            dispatch({ type: 'ADD_PAYMENT', payload: data });
            break;
          case 'bookingStatusChanged':
            if (state.bookings.find((b) => b.id === data.id)) {
              dispatch({ type: 'UPDATE_BOOKING', payload: data });
            } else {
              dispatch({ type: 'ADD_BOOKING', payload: data });
            }
            break;
          case 'statisticsUpdated':
            dispatch({ type: 'UPDATE_STATS', payload: data.stats });
            break;
          default:
            break;
        }
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [subscribe, state.bookings]);

  const addProperty = useCallback((property: Property) => {
    dispatch({ type: 'ADD_PROPERTY', payload: property });
  }, []);

  const updateProperty = useCallback((property: Property) => {
    dispatch({ type: 'UPDATE_PROPERTY', payload: property });
  }, []);

  const addPayment = useCallback((payment: Payment) => {
    dispatch({ type: 'ADD_PAYMENT', payload: payment });
  }, []);

  const addBooking = useCallback((booking: Booking) => {
    dispatch({ type: 'ADD_BOOKING', payload: booking });
  }, []);

  const updateBooking = useCallback((booking: Booking) => {
    dispatch({ type: 'UPDATE_BOOKING', payload: booking });
  }, []);

  const updateStats = useCallback((stats: DashboardStats) => {
    dispatch({ type: 'UPDATE_STATS', payload: stats });
  }, []);

  const setProperties = useCallback((properties: Property[]) => {
    dispatch({ type: 'SET_PROPERTIES', payload: properties });
  }, []);

  const setBookings = useCallback((bookings: Booking[]) => {
    dispatch({ type: 'SET_BOOKINGS', payload: bookings });
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        state,
        addProperty,
        updateProperty,
        addPayment,
        addBooking,
        updateBooking,
        updateStats,
        setProperties,
        setBookings,
        isConnected,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
