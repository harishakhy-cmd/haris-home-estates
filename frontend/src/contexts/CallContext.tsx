'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export interface IncomingCall {
  callId: string;
  initiatorId: string;
  initiator: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  callType: 'audio' | 'video';
}

export interface ActiveCall {
  callId: string;
  recipientId: string;
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  callType: 'audio' | 'video';
  startedAt?: Date;
  duration?: number;
}

interface CallContextType {
  // Incoming calls
  incomingCalls: IncomingCall[];
  addIncomingCall: (call: IncomingCall) => void;
  removeIncomingCall: (callId: string) => void;
  clearIncomingCalls: () => void;

  // Active call
  activeCall: ActiveCall | null;
  setActiveCall: (call: ActiveCall | null) => void;

  // Call state
  callState: 'idle' | 'ringing' | 'answered' | 'ended';
  setCallState: (state: 'idle' | 'ringing' | 'answered' | 'ended') => void;

  // Call duration
  callDuration: number;
  setCallDuration: (duration: number) => void;
  incrementDuration: () => void;

  // Mute/Video state
  isMuted: boolean;
  toggleMute: () => void;
  isVideoEnabled: boolean;
  toggleVideo: () => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [incomingCalls, setIncomingCalls] = useState<IncomingCall[]>([]);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'answered' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addIncomingCall = useCallback((call: IncomingCall) => {
    setIncomingCalls((prev) => {
      // Avoid duplicates
      if (prev.some((c) => c.callId === call.callId)) return prev;
      return [...prev, call];
    });
  }, []);

  const removeIncomingCall = useCallback((callId: string) => {
    setIncomingCalls((prev) => prev.filter((c) => c.callId !== callId));
  }, []);

  const clearIncomingCalls = useCallback(() => {
    setIncomingCalls([]);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled((prev) => !prev);
  }, []);

  const incrementDuration = useCallback(() => {
    setCallDuration((prev) => prev + 1);
  }, []);

  return (
    <CallContext.Provider
      value={{
        incomingCalls,
        addIncomingCall,
        removeIncomingCall,
        clearIncomingCalls,
        activeCall,
        setActiveCall,
        callState,
        setCallState,
        callDuration,
        setCallDuration,
        incrementDuration,
        isMuted,
        toggleMute,
        isVideoEnabled,
        toggleVideo,
        error,
        setError,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};
