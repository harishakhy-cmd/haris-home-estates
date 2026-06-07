'use client';

import React, { useRef } from 'react';
import { AudioCall } from './AudioCall';
import { VideoCall } from './VideoCall';

export type CallType = 'audio' | 'video';
export type ConnectionState = 'connecting' | 'connected' | 'disconnecting' | 'failed';

interface CallScreenProps {
  callId: string;
  callType: CallType;
  remoteName: string;
  remoteAvatarUrl?: string | null;
  isMuted: boolean;
  videoEnabled: boolean;
  audioLevel: number;
  connectionState?: ConnectionState;
  onToggleMute: (muted: boolean) => void;
  onToggleVideo?: (enabled: boolean) => void;
  onEndCall: () => void;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  callId,
  callType,
  remoteName,
  remoteAvatarUrl,
  isMuted,
  videoEnabled,
  audioLevel,
  connectionState = 'connecting',
  onToggleMute,
  onToggleVideo,
  onEndCall,
  localStream,
  remoteStream,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Set up video streams
  React.useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  React.useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callType === 'audio') {
    return (
      <AudioCall
        callId={callId}
        remoteName={remoteName}
        remoteAvatarUrl={remoteAvatarUrl}
        isMuted={isMuted}
        audioLevel={audioLevel}
        onToggleMute={onToggleMute}
        onEndCall={onEndCall}
        connectionState={connectionState}
      />
    );
  }

  return (
    <VideoCall
      callId={callId}
      remoteName={remoteName}
      remoteAvatarUrl={remoteAvatarUrl}
      isMuted={isMuted}
      videoEnabled={videoEnabled}
      onToggleMute={onToggleMute}
      onToggleVideo={onToggleVideo || (() => {})}
      onEndCall={onEndCall}
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
      connectionState={connectionState}
    />
  );
};
