'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone } from 'lucide-react';

interface VideoCallProps {
  callId: string;
  remoteName: string;
  remoteAvatarUrl?: string | null;
  isMuted: boolean;
  videoEnabled: boolean;
  onToggleMute: (muted: boolean) => void;
  onToggleVideo: (enabled: boolean) => void;
  onEndCall: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  connectionState?: 'connecting' | 'connected' | 'disconnecting' | 'failed';
}

export const VideoCall: React.FC<VideoCallProps> = ({
  callId,
  remoteName,
  remoteAvatarUrl,
  isMuted,
  videoEnabled,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  localVideoRef,
  remoteVideoRef,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-md">
      {/* Remote video (main) */}
      <div className="relative h-full w-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />

        {/* Fallback avatar if no video */}
        {!videoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {remoteAvatarUrl ? (
              <img
                src={remoteAvatarUrl}
                alt={remoteName}
                className="h-32 w-32 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))]">
                <span className="text-5xl font-bold text-white">
                  {remoteName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Top overlay - Duration and status */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <div className="rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm">
            <p className="font-semibold text-white">{remoteName}</p>
          </div>

          <div className="rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm text-white font-semibold">
            {formatDuration(duration)}
          </div>
        </div>

        {/* Local video (PiP) */}
        <div className="absolute bottom-24 right-6 h-32 w-32 rounded-2xl border-2 border-white shadow-lg overflow-hidden bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          
          {/* Fallback for local video disabled */}
          {!videoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))]">
              <VideoOff size={20} className="text-white" />
            </div>
          )}
        </div>

        {/* Connection status indicator */}
        {connectionState !== 'connected' && (
          <div className="absolute top-6 right-6 rounded-full bg-yellow-500/80 px-3 py-1 backdrop-blur-sm">
            <p className="text-xs font-semibold text-white">
              {connectionState === 'connecting' && '🔄 Connecting...'}
              {connectionState === 'disconnecting' && '🔌 Disconnecting...'}
              {connectionState === 'failed' && '❌ Connection failed'}
            </p>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-6 py-6">
          {/* Mute button */}
          <button
            onClick={() => onToggleMute(!isMuted)}
            className={`rounded-full p-3 transition active:scale-95 ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* Video toggle button */}
          <button
            onClick={() => onToggleVideo(!videoEnabled)}
            className={`rounded-full p-3 transition active:scale-95 ${
              !videoEnabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
            }`}
            title={videoEnabled ? 'Disable video' : 'Enable video'}
          >
            {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          </button>

          {/* End call button */}
          <button
            onClick={onEndCall}
            className="rounded-full bg-red-600 p-4 text-white shadow-lg transition hover:bg-red-700 active:scale-95"
            title="End call"
          >
            <Phone size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
