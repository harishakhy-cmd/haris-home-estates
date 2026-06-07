import { useState, useCallback, useRef, useEffect } from 'react';

export type MediaDeviceType = 'camera' | 'microphone';

export interface MediaDeviceState {
  camera: {
    stream: MediaStream | null;
    active: boolean;
    error: Error | null;
    supported: boolean;
  };
  microphone: {
    stream: MediaStream | null;
    active: boolean;
    error: Error | null;
    supported: boolean;
  };
}

export interface UseMediaDevicesReturn extends MediaDeviceState {
  requestCamera: (constraints?: MediaTrackConstraints) => Promise<MediaStream | null>;
  requestMicrophone: (constraints?: MediaTrackConstraints) => Promise<MediaStream | null>;
  stopCamera: () => void;
  stopMicrophone: () => void;
  stopAll: () => void;
  hasPermission: (type: MediaDeviceType) => Promise<boolean>;
}

export const useMediaDevices = (): UseMediaDevicesReturn => {
  const [state, setState] = useState<MediaDeviceState>({
    camera: {
      stream: null,
      active: false,
      error: null,
      supported: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
    },
    microphone: {
      stream: null,
      active: false,
      error: null,
      supported: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
    },
  });

  const streamRefs = useRef<Record<MediaDeviceType, MediaStream | null>>({
    camera: null,
    microphone: null,
  });

  const requestDevice = useCallback(
    async (
      type: MediaDeviceType,
      constraints: Partial<MediaStreamConstraints> = {}
    ): Promise<MediaStream | null> => {
      try {
        // Check browser support
        if (!navigator.mediaDevices?.getUserMedia) {
          const error = new Error('Media devices not supported in this browser');
          setState((prev) => ({
            ...prev,
            [type]: { ...prev[type], error, supported: false },
          }));
          return null;
        }

        // Stop existing stream
        if (streamRefs.current[type]) {
          streamRefs.current[type]?.getTracks().forEach((track) => track.stop());
        }

        // Request stream
        const config: MediaStreamConstraints =
          type === 'camera'
            ? { video: constraints.video || { width: 1280, height: 720 }, ...constraints }
            : { audio: constraints.audio || true, ...constraints };

        const stream = await navigator.mediaDevices.getUserMedia(config);
        streamRefs.current[type] = stream;

        setState((prev) => ({
          ...prev,
          [type]: {
            stream,
            active: true,
            error: null,
            supported: true,
          },
        }));

        return stream;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // Categorize permission errors
        if (err.name === 'NotAllowedError') {
          err.message = `Permission denied to access ${type}`;
        } else if (err.name === 'NotFoundError') {
          err.message = `No ${type} device found`;
        } else if (err.name === 'NotReadableError') {
          err.message = `${type} is in use by another application`;
        } else if (err.name === 'OverconstrainedError') {
          err.message = `${type} constraints cannot be satisfied`;
        } else if (err.name === 'TypeError') {
          err.message = `Invalid ${type} constraints`;
        }

        setState((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            error: err,
            active: false,
          },
        }));

        return null;
      }
    },
    []
  );

  const requestCamera = useCallback(
    (constraints?: MediaTrackConstraints) =>
      requestDevice('camera', { video: constraints }),
    [requestDevice]
  );

  const requestMicrophone = useCallback(
    (constraints?: MediaTrackConstraints) =>
      requestDevice('microphone', { audio: constraints }),
    [requestDevice]
  );

  const stopStream = useCallback((type: MediaDeviceType) => {
    const stream = streamRefs.current[type];
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRefs.current[type] = null;

      setState((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          stream: null,
          active: false,
        },
      }));
    }
  }, []);

  const stopCamera = useCallback(() => stopStream('camera'), [stopStream]);
  const stopMicrophone = useCallback(() => stopStream('microphone'), [stopStream]);

  const stopAll = useCallback(() => {
    stopCamera();
    stopMicrophone();
  }, [stopCamera, stopMicrophone]);

  const hasPermission = useCallback(async (type: MediaDeviceType): Promise<boolean> => {
    try {
      const permissionName =
        type === 'camera'
          ? ('camera' as PermissionName)
          : ('microphone' as PermissionName);

      const permission = await navigator.permissions.query({ name: permissionName });
      return permission.state === 'granted';
    } catch {
      // Fallback: try to request and immediately stop
      try {
        const stream = await requestDevice(type);
        if (stream) {
          stopStream(type);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }
  }, [requestDevice, stopStream]);

  // Cleanup on unmount
  const cleanupRef = useRef(() => {
    stopAll();
  });

  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, [stopAll]);

  return {
    ...state,
    requestCamera,
    requestMicrophone,
    stopCamera,
    stopMicrophone,
    stopAll,
    hasPermission,
  };
};
