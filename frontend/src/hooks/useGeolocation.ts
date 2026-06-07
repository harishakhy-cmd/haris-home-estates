import { useState, useCallback, useRef, useEffect } from 'react';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface UseGeolocationReturn {
  location: GeoLocation | null;
  error: Error | null;
  loading: boolean;
  supported: boolean;
  watching: boolean;
  getCurrentLocation: (options?: PositionOptions) => Promise<GeoLocation | null>;
  watchLocation: (options?: PositionOptions) => string | null;
  stopWatching: (watchId?: string) => void;
  stopAll: () => void;
}

const positionToGeoLocation = (position: GeolocationPosition): GeoLocation => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,
  altitude: position.coords.altitude,
  altitudeAccuracy: position.coords.altitudeAccuracy,
  heading: position.coords.heading,
  speed: position.coords.speed,
  timestamp: position.timestamp,
});

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [supported] = useState(() => {
    return typeof navigator !== 'undefined' && !!navigator.geolocation;
  });

  const watchIds = useRef<Map<string, number>>(new Map());
  const nextWatchId = useRef(0);

  const handlePositionError = useCallback((err: GeolocationPositionError): Error => {
    let message = 'Unknown geolocation error';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Permission denied to access geolocation';
        break;
      case err.POSITION_UNAVAILABLE:
        message = 'Geolocation data is unavailable';
        break;
      case err.TIMEOUT:
        message = 'Geolocation request timed out';
        break;
    }

    return new Error(message);
  }, []);

  const getCurrentLocation = useCallback(
    async (options: PositionOptions = {}): Promise<GeoLocation | null> => {
      if (!supported) {
        const err = new Error('Geolocation not supported in this browser');
        setError(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        return await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const geoLocation = positionToGeoLocation(position);
              setLocation(geoLocation);
              resolve(geoLocation);
            },
            (err) => {
              const error = handlePositionError(err);
              setError(error);
              reject(error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
              ...options,
            }
          );
        });
      } catch (err) {
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supported, handlePositionError]
  );

  const watchLocation = useCallback(
    (options: PositionOptions = {}): string | null => {
      if (!supported) {
        const err = new Error('Geolocation not supported in this browser');
        setError(err);
        return null;
      }

      try {
        setError(null);
        setWatching(true);

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const geoLocation = positionToGeoLocation(position);
            setLocation(geoLocation);
            setError(null);
          },
          (err) => {
            const error = handlePositionError(err);
            setError(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
            ...options,
          }
        );

        const key = `watch-${nextWatchId.current++}`;
        watchIds.current.set(key, watchId);

        return key;
      } catch (err) {
        setWatching(false);
        return null;
      }
    },
    [supported, handlePositionError]
  );

  const stopWatching = useCallback((watchId?: string) => {
    if (watchId) {
      const id = watchIds.current.get(watchId);
      if (id !== undefined) {
        navigator.geolocation.clearWatch(id);
        watchIds.current.delete(watchId);
      }
    } else {
      watchIds.current.forEach((id) => {
        navigator.geolocation.clearWatch(id);
      });
      watchIds.current.clear();
    }

    if (watchIds.current.size === 0) {
      setWatching(false);
    }
  }, []);

  const stopAll = useCallback(() => {
    watchIds.current.forEach((id) => {
      navigator.geolocation.clearWatch(id);
    });
    watchIds.current.clear();
    setWatching(false);
    setLocation(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  return {
    location,
    error,
    loading,
    supported,
    watching,
    getCurrentLocation,
    watchLocation,
    stopWatching,
    stopAll,
  };
};
