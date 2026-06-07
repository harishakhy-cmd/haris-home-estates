import { useRef, useCallback, useState } from 'react';

interface MediaRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
}

/**
 * Hook for managing MediaRecorder API with React
 * Handles recording, pausing, resuming, and playback
 */
export function useMediaRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<MediaRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    error: null,
  });

  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null, duration: 0, audioBlob: null }));

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        setState((prev) => ({
          ...prev,
          error: `Recording error: ${event.error}`,
          isRecording: false,
        }));
        cleanup();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;

      // Start duration timer
      let duration = 0;
      timerRef.current = setInterval(() => {
        duration += 1;
        setState((prev) => ({ ...prev, duration }));
      }, 1000);

      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      setState((prev) => ({ ...prev, error: message }));
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      
      // Resume timer
      let duration = state.duration;
      timerRef.current = setInterval(() => {
        duration += 1;
        setState((prev) => ({ ...prev, duration: duration }));
      }, 1000);

      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [state.duration]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && state.isRecording) {
        const recorder = mediaRecorderRef.current;

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setState((prev) => ({
            ...prev,
            isRecording: false,
            isPaused: false,
            audioBlob: blob,
          }));
          cleanup();
          resolve(blob);
        };

        recorder.stop();
      } else {
        resolve(null);
      }
    });
  }, [state.isRecording]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const clearRecording = useCallback(() => {
    setState((prev) => ({
      ...prev,
      audioBlob: null,
      duration: 0,
      error: null,
    }));
    audioChunksRef.current = [];
  }, []);

  const getAudioUrl = useCallback(() => {
    if (state.audioBlob) {
      return URL.createObjectURL(state.audioBlob);
    }
    return null;
  }, [state.audioBlob]);

  const getAudioData = useCallback(() => {
    if (state.audioBlob) {
      return {
        blob: state.audioBlob,
        duration: state.duration,
        size: state.audioBlob.size,
        mimeType: state.audioBlob.type,
      };
    }
    return null;
  }, [state.audioBlob, state.duration]);

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
    getAudioUrl,
    getAudioData,
    cleanup,
  };
}
