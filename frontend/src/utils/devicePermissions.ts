/**
 * Device permissions utility for requesting and checking device permissions
 * Handles camera, microphone, geolocation, and other browser APIs
 */

export type PermissionType = 'camera' | 'microphone' | 'geolocation' | 'notification';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

/**
 * Request a specific device permission
 * Returns true if permission granted, false otherwise
 */
export const requestPermission = async (
  type: PermissionType
): Promise<boolean> => {
  try {
    switch (type) {
      case 'camera': {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }

      case 'microphone': {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }

      case 'geolocation': {
        return await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false)
          );
        });
      }

      case 'notification': {
        if (!('Notification' in window)) {
          return false;
        }
        if (Notification.permission === 'granted') {
          return true;
        }
        if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error(`Permission request failed for ${type}:`, error);
    return false;
  }
};

/**
 * Check if a permission is supported in the current browser
 */
export const isPermissionSupported = (type: PermissionType): boolean => {
  if (typeof navigator === 'undefined') return false;

  switch (type) {
    case 'camera':
    case 'microphone':
      return !!navigator.mediaDevices?.getUserMedia;
    case 'geolocation':
      return !!navigator.geolocation;
    case 'notification':
      return 'Notification' in window;
    default:
      return false;
  }
};

/**
 * Check the current status of a permission
 * Returns { granted, denied, prompt }
 */
export const checkPermissionStatus = async (
  type: PermissionType
): Promise<PermissionStatus> => {
  try {
    // Use Permissions API if available
    if (navigator.permissions) {
      const permissionName = getPermissionName(type);
      if (permissionName) {
        const permission = await navigator.permissions.query({
          name: permissionName as PermissionName,
        });

        return {
          granted: permission.state === 'granted',
          denied: permission.state === 'denied',
          prompt: permission.state === 'prompt',
        };
      }
    }

    // Fallback: try to determine status by attempting request
    switch (type) {
      case 'notification': {
        if (!('Notification' in window)) {
          return { granted: false, denied: true, prompt: false };
        }
        return {
          granted: Notification.permission === 'granted',
          denied: Notification.permission === 'denied',
          prompt: Notification.permission === 'default',
        };
      }

      default:
        // For camera, microphone, geolocation, we can't reliably determine without requesting
        return { granted: false, denied: false, prompt: true };
    }
  } catch (error) {
    console.error(`Permission check failed for ${type}:`, error);
    return { granted: false, denied: false, prompt: true };
  }
};

/**
 * Get the permission name for the Permissions API
 */
const getPermissionName = (type: PermissionType): string | null => {
  switch (type) {
    case 'camera':
      return 'camera';
    case 'microphone':
      return 'microphone';
    case 'geolocation':
      return 'geolocation';
    case 'notification':
      return 'notifications';
    default:
      return null;
  }
};

/**
 * Handle permission denial with user-friendly message
 */
export const getPermissionErrorMessage = (type: PermissionType): string => {
  switch (type) {
    case 'camera':
      return 'Camera permission is required for video calls. Please enable it in your browser settings.';
    case 'microphone':
      return 'Microphone permission is required for audio calls and voice messages. Please enable it in your browser settings.';
    case 'geolocation':
      return 'Location permission is required for property features. Please enable it in your browser settings.';
    case 'notification':
      return 'Notification permission is required for push notifications. Please enable it in your browser settings.';
    default:
      return 'Permission denied. Please check your browser settings.';
  }
};

/**
 * Open browser permissions settings page
 * Different for each browser and OS
 */
export const openPermissionsSettings = (): void => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('chrome')) {
    // Chrome on all platforms
    window.location.href = 'chrome://settings/content';
  } else if (userAgent.includes('firefox')) {
    // Firefox on all platforms
    window.location.href = 'about:preferences#privacy';
  } else if (userAgent.includes('safari')) {
    // Safari - must go through system settings
    alert('Please open System Preferences > Security & Privacy > Camera/Microphone to enable permissions.');
  } else if (userAgent.includes('edg')) {
    // Edge
    window.location.href = 'edge://settings/content';
  } else {
    alert('Please check your browser settings to enable the required permissions.');
  }
};

/**
 * Get device capabilities
 */
export interface DeviceCapabilities {
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasGeolocation: boolean;
  hasNotifications: boolean;
  isSecureContext: boolean;
  isMobile: boolean;
}

export const getDeviceCapabilities = async (): Promise<DeviceCapabilities> => {
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;
  const userAgent =
    typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  // Check for media devices
  let hasCamera = false;
  let hasMicrophone = false;

  if (isSecureContext && navigator.mediaDevices?.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      hasCamera = devices.some((device) => device.kind === 'videoinput');
      hasMicrophone = devices.some((device) => device.kind === 'audioinput');
    } catch (error) {
      console.warn('Error enumerating devices:', error);
    }
  }

  return {
    hasCamera,
    hasMicrophone,
    hasGeolocation: !!navigator.geolocation,
    hasNotifications: 'Notification' in window,
    isSecureContext,
    isMobile,
  };
};
