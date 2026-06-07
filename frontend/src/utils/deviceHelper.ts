/**
 * Device and browser compatibility helper
 * Detects device type, browser, and available APIs
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'other';
export type OSType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'other';

export interface DeviceInfo {
  type: DeviceType;
  browser: BrowserType;
  os: OSType;
  userAgent: string;
  isSecureContext: boolean;
}

export interface APISupport {
  mediaDevices: boolean;
  geolocation: boolean;
  notifications: boolean;
  serviceWorker: boolean;
  sharedWorker: boolean;
  webRTC: boolean;
  webSocket: boolean;
  indexedDB: boolean;
  localStorage: boolean;
}

/**
 * Get device information
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent;
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;

  return {
    type: getDeviceType(userAgent),
    browser: getBrowserType(userAgent),
    os: getOSType(userAgent),
    userAgent,
    isSecureContext,
  };
};

/**
 * Detect device type from user agent
 */
const getDeviceType = (userAgent: string): DeviceType => {
  const lower = userAgent.toLowerCase();

  // Check for tablet first (before mobile, since tablets often report as mobile)
  if (
    /ipad|android(?!.*mobile)|tablet|nexus 7|nexus 10|kindle|playbook/i.test(lower)
  ) {
    return 'tablet';
  }

  // Check for mobile
  if (
    /android|webos|iphone|iemobile|opera mini|blackberry|palm|windows phone/i.test(
      lower
    )
  ) {
    return 'mobile';
  }

  return 'desktop';
};

/**
 * Detect browser type from user agent
 */
const getBrowserType = (userAgent: string): BrowserType => {
  const lower = userAgent.toLowerCase();

  if (lower.includes('edg')) return 'edge';
  if (lower.includes('chrome')) return 'chrome';
  if (lower.includes('firefox')) return 'firefox';
  if (lower.includes('safari') && !lower.includes('chrome')) return 'safari';

  return 'other';
};

/**
 * Detect OS type from user agent
 */
const getOSType = (userAgent: string): OSType => {
  const lower = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(lower)) return 'ios';
  if (/android/.test(lower)) return 'android';
  if (/windows/.test(lower)) return 'windows';
  if (/macintosh|mac os x/.test(lower)) return 'macos';
  if (/linux/.test(lower)) return 'linux';

  return 'other';
};

/**
 * Get API support information
 */
export const getAPISupport = (): APISupport => {
  return {
    mediaDevices: !!navigator.mediaDevices?.getUserMedia,
    geolocation: !!navigator.geolocation,
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    sharedWorker: 'SharedWorker' in window,
    webRTC:
      !!window.RTCPeerConnection ||
      !!(window as any).webkitRTCPeerConnection ||
      !!(window as any).mozRTCPeerConnection,
    webSocket: 'WebSocket' in window,
    indexedDB: !!window.indexedDB,
    localStorage: typeof localStorage !== 'undefined',
  };
};

/**
 * Check if running on mobile device
 */
export const isMobile = (): boolean => {
  return getDeviceType(navigator.userAgent) === 'mobile';
};

/**
 * Check if running on tablet device
 */
export const isTablet = (): boolean => {
  return getDeviceType(navigator.userAgent) === 'tablet';
};

/**
 * Check if running on desktop
 */
export const isDesktop = (): boolean => {
  return getDeviceType(navigator.userAgent) === 'desktop';
};

/**
 * Check if in PWA standalone mode (installed app)
 */
export const isStandaloneMode = (): boolean => {
  return (
    (navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  );
};

/**
 * Get browser version
 */
export const getBrowserVersion = (): string => {
  const ua = navigator.userAgent;
  let match = ua.match(/(?:Firefox|Chrome|Safari|Edge)\/(\d+)/);
  return match ? match[1] : 'unknown';
};

/**
 * Check if browser supports a specific feature
 */
export const supportsFeature = (feature: keyof APISupport): boolean => {
  return getAPISupport()[feature];
};

/**
 * Get screen dimensions
 */
export const getScreenInfo = () => {
  return {
    width: window.innerWidth || screen.width,
    height: window.innerHeight || screen.height,
    pixelRatio: window.devicePixelRatio || 1,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
  };
};

/**
 * Check if device has touch capability
 */
export const hasTouch = (): boolean => {
  return (
    'ontouchstart' in window ||
    'onmsgesturechange' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

/**
 * Check if device is in dark mode
 */
export const isDarkMode = (): boolean => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Check if device has reduced motion preference
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check network connection status
 */
export const getNetworkStatus = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) {
    return {
      online: navigator.onLine,
      effectiveType: 'unknown',
      downlink: undefined,
      rtt: undefined,
      saveData: false,
    };
  }

  return {
    online: navigator.onLine,
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData || false,
  };
};
