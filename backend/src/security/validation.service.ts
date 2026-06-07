import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Input validation and sanitization service
 */
@Injectable()
export class ValidationService {
  /**
   * Validate and sanitize message content
   */
  sanitizeMessage(content: string, maxLength: number = 5000): string {
    if (!content || typeof content !== 'string') {
      throw new BadRequestException('Message must be a non-empty string');
    }

    let sanitized = content.trim();

    if (sanitized.length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    if (sanitized.length > maxLength) {
      throw new BadRequestException(
        `Message cannot exceed ${maxLength} characters`
      );
    }

    // Remove potentially dangerous characters while preserving unicode
    sanitized = this.removeXSS(sanitized);

    return sanitized;
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate UUID format
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate phone number (basic validation)
   */
  isValidPhoneNumber(phone: string): boolean {
    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    // Check if remaining is all digits and reasonable length
    return /^\d{7,15}$/.test(cleaned);
  }

  /**
   * Validate file MIME type
   */
  isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
    if (!mimeType || typeof mimeType !== 'string') {
      return false;
    }

    return allowedTypes.some((allowed) => {
      if (allowed.endsWith('/*')) {
        // Handle wildcards like image/*
        const prefix = allowed.slice(0, -2);
        return mimeType.startsWith(prefix);
      }
      return mimeType === allowed;
    });
  }

  /**
   * Validate file size
   */
  isValidFileSize(
    size: number,
    minBytes: number = 0,
    maxBytes: number = 10 * 1024 * 1024
  ): boolean {
    return size >= minBytes && size <= maxBytes;
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename: string, maxLength: number = 255): string {
    if (!filename || typeof filename !== 'string') {
      throw new BadRequestException('Filename must be a non-empty string');
    }

    // Remove path separators and potentially dangerous characters
    let sanitized = filename
      .replace(/[\/\\:*?"<>|]/g, '')
      .replace(/^\.+/, '')
      .trim();

    if (sanitized.length === 0) {
      sanitized = 'file';
    }

    // Truncate if too long
    if (sanitized.length > maxLength) {
      const ext = sanitized.substring(sanitized.lastIndexOf('.'));
      sanitized = sanitized.substring(0, maxLength - ext.length) + ext;
    }

    return sanitized;
  }

  /**
   * Remove XSS vectors from string
   */
  private removeXSS(input: string): string {
    // Remove script tags and event handlers
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove dangerous protocols
    sanitized = sanitized.replace(/javascript:/gi, '').replace(/data:text\/html/gi, '');

    return sanitized;
  }

  /**
   * Escape HTML entities
   */
  escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Parse JSON safely
   */
  parseJSON<T>(json: string, defaultValue?: T): T | null {
    try {
      return JSON.parse(json);
    } catch {
      return defaultValue ?? null;
    }
  }

  /**
   * Validate object keys (prevent prototype pollution)
   */
  isValidKeys(obj: Record<string, unknown>, allowedKeys: string[]): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) {
        return false;
      }
      if (!allowedKeys.includes(key)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate URL (prevent SSRF)
   */
  isValidURL(url: string, allowedHosts?: string[]): boolean {
    try {
      const parsed = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }

      // Check against allowed hosts if provided
      if (allowedHosts && !allowedHosts.includes(parsed.hostname)) {
        return false;
      }

      // Prevent SSRF by disallowing private IPs
      if (this.isPrivateIP(parsed.hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if hostname is a private IP
   */
  private isPrivateIP(hostname: string): boolean {
    const privateRanges = [
      /^localhost$/i,
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^::1$/,
      /^fc[0-9a-f]{2}:/i,
    ];

    return privateRanges.some((range) => range.test(hostname));
  }

  /**
   * Validate pagination params
   */
  validatePagination(
    page: unknown,
    limit: unknown,
    maxLimit: number = 100
  ): { page: number; limit: number } {
    const pageNum = parseInt(String(page)) || 1;
    const limitNum = parseInt(String(limit)) || 20;

    if (pageNum < 1) {
      throw new BadRequestException('Page must be >= 1');
    }

    if (limitNum < 1 || limitNum > maxLimit) {
      throw new BadRequestException(
        `Limit must be between 1 and ${maxLimit}`
      );
    }

    return { page: pageNum, limit: limitNum };
  }
}
