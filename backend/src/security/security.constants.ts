/**
 * Rate limiting configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // Messages: 10 messages per second per user
  MESSAGE: {
    maxTokens: 10,
    refillRate: 10,
  },
  // Calls: 5 calls per second per user
  CALL: {
    maxTokens: 5,
    refillRate: 5,
  },
  // Typing: 20 typing events per second per user
  TYPING: {
    maxTokens: 20,
    refillRate: 20,
  },
  // API: 100 requests per second per user
  API: {
    maxTokens: 100,
    refillRate: 100,
  },
  // Login: 5 attempts per minute
  LOGIN: {
    maxTokens: 5,
    refillRate: 5 / 60, // 5 per minute
  },
  // Notifications: 50 per second per user
  NOTIFICATION: {
    maxTokens: 50,
    refillRate: 50,
  },
};

/**
 * File validation constants
 */
export const FILE_CONSTRAINTS = {
  IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
  VIDEO: {
    maxSize: 50 * 1024 * 1024, // 50MB
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    extensions: ['mp4', 'mov', 'avi', 'webm'],
  },
  AUDIO: {
    maxSize: 10 * 1024 * 1024, // 10MB
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
    extensions: ['mp3', 'wav', 'ogg', 'webm'],
  },
  DOCUMENT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
  },
  VOICE: {
    maxSize: 10 * 1024 * 1024, // 10MB
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'],
    extensions: ['mp3', 'wav', 'ogg', 'webm', 'm4a'],
  },
};

/**
 * Message constraints
 */
export const MESSAGE_CONSTRAINTS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 5000,
};

/**
 * Security headers
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
};

/**
 * Dangerous file extensions
 */
export const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr',
  'vbs', 'js', 'jar', 'zip', 'rar', '7z',
  'dll', 'sys', 'msi', 'app', 'deb',
];

/**
 * JWT configuration
 */
export const JWT_CONFIG = {
  EXPIRATION: '24h',
  REFRESH_EXPIRATION: '7d',
};

/**
 * Socket.IO event limits
 */
export const SOCKET_EVENT_LIMITS = {
  MESSAGE_PER_SECOND: 10,
  TYPING_PER_SECOND: 20,
  CALL_PER_SECOND: 5,
  TYPING_INDICATOR_DELAY: 1000, // Only emit every 1 second
};

/**
 * CORS configuration
 */
export const CORS_OPTIONS = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

/**
 * Password policy
 */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL: true,
};
