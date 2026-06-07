'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Phone, Volume2, Volume1, VolumeX } from 'lucide-react';

interface AudioCallProps {
  callId: string;
  remoteName: string;
  remoteAvatarUrl?: string | null;
  isMuted: boolean;
  audioLevel: number;
  onToggleMute: (muted: boolean) => void;
  onEndCall: () => void;
  connectionState?: 'connecting' | 'connected' | 'disconnecting' | 'failed';
}

export const AudioCall: React.FC<AudioCallProps> = ({
  callId,
  remoteName,
  remoteAvatarUrl,
  isMuted,
  audioLevel,
  onToggleMute,
  onEndCall,
  connectionState = 'connecting',
}) => {
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get volume icon based on audio level
  const getVolumeIcon = () => {
    if (audioLevel < 30) return <VolumeX size={20} />;
    if (audioLevel < 70) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--secondary))]/20 backdrop-blur-md">
      <div className="mx-4 w-full max-w-sm rounded-3xl border border-[hsl(var(--border))] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card))]/90 p-8 shadow-2xl">
        {/* Remote user avatar */}
        <div className="mb-6 flex justify-center">
          {remoteAvatarUrl ? (
            <img
              src={remoteAvatarUrl}
              alt={remoteName}
              className="h-24 w-24 rounded-full border-4 border-[hsl(var(--primary))]/30 object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[hsl(var(--primary))]/30 bg-[hsl(var(--muted))] shadow-lg">
              <span className="text-3xl font-bold text-[hsl(var(--muted-foreground))]">
                {remoteName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Call duration */}
        <div className="mb-2 text-center">
          <h2 className="mb-2 text-2xl font-bold text-[hsl(var(--foreground))]">{remoteName}</h2>
          <p className="text-lg font-semibold text-[hsl(var(--primary))]">{formatDuration(duration)}</p>
        </div>

        {/* Connection status */}
        <div className="mb-8 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {connectionState === 'connecting' && 'Connecting...'}
            {connectionState === 'connected' && 'Connected'}
            {connectionState === 'disconnecting' && 'Disconnecting...'}
            {connectionState === 'failed' && 'Connection failed'}
          </p>
        </div>

        {/* Audio level meter */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex-1 rounded-full bg-[hsl(var(--muted))] p-1">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
              style={{ width: `${Math.min(audioLevel, 100)}%` }}
            />
          </div>
          <div className="text-[hsl(var(--muted-foreground))]">{getVolumeIcon()}</div>
        </div>

        {/* Control buttons */}
        <div className="flex gap-4">
          {/* Mute button */}
          <button
            onClick={() => onToggleMute(!isMuted)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 font-semibold transition active:scale-95 ${
              isMuted
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80'
            }`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* End call button */}
          <button
            onClick={onEndCall}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500/20 px-4 py-3 font-semibold text-red-500 transition hover:bg-red-500/30 active:scale-95"
          >
            <Phone size={20} />
            <span>End</span>
          </button>
        </div>
      </div>
    </div>
  );
};
