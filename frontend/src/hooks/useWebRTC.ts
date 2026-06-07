'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: ['turn:openrelay.metered.ca:80'], username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: ['turn:openrelay.metered.ca:443'], username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: ['turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' },
];

interface UseWebRTCOptions {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onError?: (error: Error) => void;
}

export const useWebRTC = (options: UseWebRTCOptions = {}) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>('new');
  const [audioLevel, setAudioLevel] = useState(0);

  // Initialize peer connection
  const initializePeerConnection = useCallback(async () => {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          options.onIceCandidate?.(event.candidate);
        }
      };

      peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
        options.onRemoteStream?.(event.streams[0]);
      };

      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        setConnectionState(peerConnection.connectionState);
        options.onConnectionStateChange?.(peerConnection.connectionState);
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
        setIceConnectionState(peerConnection.iceConnectionState);
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    } catch (error: any) {
      const err = new Error(`Failed to initialize peer connection: ${error.message}`);
      options.onError?.(err);
      throw err;
    }
  }, [options]);

  // Get local media stream (audio and/or video)
  const getLocalStream = useCallback(
    async (constraints: MediaStreamConstraints = { audio: true, video: false }) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        setLocalStream(stream);
        options.onLocalStream?.(stream);

        // Set up audio analysis for mute detection
        if (constraints.audio && stream.getAudioTracks().length > 0) {
          const audioCtx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          const source = (audioCtx as any).createMediaStreamAudioSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;

          // Monitor audio level
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average);
            requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }

        return stream;
      } catch (error: any) {
        const err = new Error(`Failed to get local stream: ${error.message}`);
        options.onError?.(err);
        throw err;
      }
    },
    [options]
  );

  // Add local stream to peer connection
  const addLocalStreamToPeerConnection = useCallback(async (stream: MediaStream) => {
    if (!peerConnectionRef.current) {
      await initializePeerConnection();
    }

    const peerConnection = peerConnectionRef.current!;

    // Add all tracks from the stream
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    return peerConnection;
  }, [initializePeerConnection]);

  // Create offer
  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnectionRef.current.setLocalDescription(offer);
      return offer;
    } catch (error: any) {
      const err = new Error(`Failed to create offer: ${error.message}`);
      options.onError?.(err);
      throw err;
    }
  }, [options]);

  // Create answer
  const createAnswer = useCallback(async () => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const answer = await peerConnectionRef.current.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnectionRef.current.setLocalDescription(answer);
      return answer;
    } catch (error: any) {
      const err = new Error(`Failed to create answer: ${error.message}`);
      options.onError?.(err);
      throw err;
    }
  }, [options]);

  // Set remote description (offer or answer)
  const setRemoteDescription = useCallback(
    async (description: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection not initialized');
      }

      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(description));
      } catch (error: any) {
        const err = new Error(`Failed to set remote description: ${error.message}`);
        options.onError?.(err);
        throw err;
      }
    },
    [options]
  );

  // Add ICE candidate
  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection not initialized');
      }

      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error: any) {
        console.warn('Failed to add ICE candidate:', error.message);
      }
    },
    []
  );

  // Mute/unmute audio
  const setAudioMuted = useCallback((muted: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }, []);

  // Enable/disable video
  const setVideoEnabled = useCallback((enabled: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }, []);

  // Get statistics
  const getStats = useCallback(async () => {
    if (!peerConnectionRef.current) return null;

    try {
      const stats = await peerConnectionRef.current.getStats();
      const report: any = {
        audio: {},
        video: {},
        connection: {},
      };

      stats.forEach((stat) => {
        if (stat.type === 'inbound-rtp') {
          if (stat.kind === 'audio') {
            report.audio.bytesReceived = stat.bytesReceived;
            report.audio.packetsLost = stat.packetsLost;
          } else if (stat.kind === 'video') {
            report.video.bytesReceived = stat.bytesReceived;
            report.video.packetsLost = stat.packetsLost;
            report.video.framesDecoded = stat.framesDecoded;
          }
        } else if (stat.type === 'outbound-rtp') {
          if (stat.kind === 'audio') {
            report.audio.bytesSent = stat.bytesSent;
          } else if (stat.kind === 'video') {
            report.video.bytesSent = stat.bytesSent;
            report.video.framesEncoded = stat.framesEncoded;
          }
        } else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
          report.connection.currentRoundTripTime = stat.currentRoundTripTime;
          report.connection.availableOutgoingBitrate = stat.availableOutgoingBitrate;
        }
      });

      return report;
    } catch (error: any) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }, []);

  // Clean up
  const cleanup = useCallback(() => {
    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setRemoteStream(null);
    remoteStreamRef.current = null;
    analyserRef.current = null;
    setConnectionState('new');
    setIceConnectionState('new');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    localStream,
    remoteStream,
    connectionState,
    iceConnectionState,
    audioLevel,

    // Methods
    initializePeerConnection,
    getLocalStream,
    addLocalStreamToPeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    setAudioMuted,
    setVideoEnabled,
    getStats,
    cleanup,

    // Refs
    peerConnectionRef,
  };
};
