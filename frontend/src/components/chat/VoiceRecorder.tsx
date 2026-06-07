'use client';

import { useCallback, useRef, useState } from 'react';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';

interface VoiceRecorderProps {
  onSend?: (audioBlob: Blob, duration: number) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
}

/**
 * VoiceRecorder Component
 * Records voice messages with waveform visualization and playback
 */
export function VoiceRecorder({ onSend, onCancel, disabled = false }: VoiceRecorderProps) {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
    getAudioUrl,
  } = useMediaRecorder();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Format duration to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording with visual feedback
  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [startRecording]);

  // Stop recording and prepare for sending/playback
  const handleStopRecording = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  // Send the voice message
  const handleSend = useCallback(async () => {
    if (!audioBlob || !onSend) return;
    
    setIsSending(true);
    try {
      await onSend(audioBlob, duration);
      clearRecording();
      setIsPlaying(false);
    } catch (err) {
      console.error('Failed to send voice message:', err);
    } finally {
      setIsSending(false);
    }
  }, [audioBlob, duration, onSend, clearRecording]);

  // Handle playback
  const handlePlayback = useCallback(async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      const audioUrl = getAudioUrl();
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        setIsPlaying(true);
        drawWaveform();
      }
    }
  }, [isPlaying, getAudioUrl]);

  // Draw waveform visualization
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    // Draw current time indicator
    const progress = (audio.currentTime / audio.duration) * width;
    ctx.strokeStyle = '#FF6B00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(progress, 0);
    ctx.lineTo(progress, height);
    ctx.stroke();

    if (audio.paused && audio.currentTime === 0) {
      // Draw default waveform (resting state)
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, height / 2 - 10);
        ctx.lineTo(i, height / 2 + 10);
        ctx.stroke();
      }
    }

    if (!audio.paused && audio.currentTime > 0) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
  }, []);

  // Handle audio end
  const handleAudioEnd = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
        <div className="font-semibold">Microphone Error</div>
        <div>{error}</div>
        <button
          onClick={clearRecording}
          className="mt-2 text-red-600 hover:text-red-800 underline text-xs"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Recording in progress
  if (isRecording) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-blue-900">
            Recording... {formatDuration(duration)}
          </span>
        </div>
        <div className="flex gap-2">
          {!isPaused ? (
            <button
              onClick={pauseRecording}
              disabled={disabled}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium transition"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={resumeRecording}
              disabled={disabled}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium transition"
            >
              Resume
            </button>
          )}
          <button
            onClick={handleStopRecording}
            disabled={disabled}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium transition"
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  // Voice recorded - preview mode
  if (audioBlob) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-purple-900">
            Voice Message {formatDuration(duration)}
          </span>
          <span className="text-xs text-purple-700">
            ({(audioBlob.size / 1024).toFixed(1)} KB)
          </span>
        </div>

        {/* Waveform canvas */}
        <canvas
          ref={canvasRef}
          width={320}
          height={60}
          className="w-full mb-3 bg-white border border-purple-200 rounded"
        />

        {/* Audio element for playback */}
        <audio
          ref={audioRef}
          onEnded={handleAudioEnd}
          onLoadedMetadata={() => drawWaveform()}
        />

        {/* Controls */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handlePlayback}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm font-medium transition"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={clearRecording}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm font-medium transition"
          >
            Delete
          </button>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isSending || disabled}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium transition"
        >
          {isSending ? 'Sending...' : 'Send Voice Message'}
        </button>
      </div>
    );
  }

  // Idle state - button to start recording
  return (
    <button
      onClick={handleStartRecording}
      disabled={disabled}
      className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-2"
    >
      🎤 Record Voice Message
    </button>
  );
}
