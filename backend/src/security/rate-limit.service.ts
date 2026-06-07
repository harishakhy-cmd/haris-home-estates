import { Injectable } from '@nestjs/common';

/**
 * Token bucket algorithm for rate limiting
 * Efficient for tracking multiple users/clients
 */
export interface RateLimitConfig {
  maxTokens: number; // Maximum tokens (requests allowed)
  refillRate: number; // Tokens added per second
  refillInterval: number; // Milliseconds between refills (calculated from rate)
}

interface TokenBucket {
  tokens: number;
  lastRefillTime: number;
}

@Injectable()
export class RateLimitService {
  private buckets: Map<string, TokenBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  /**
   * Create a rate limiter with given config
   */
  static createConfig(
    maxTokens: number,
    refillRate: number // tokens per second
  ): RateLimitConfig {
    return {
      maxTokens,
      refillRate,
      refillInterval: 1000 / refillRate,
    };
  }

  /**
   * Check if action is allowed (consumes 1 token if allowed)
   */
  isAllowed(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(identifier);

    if (!bucket) {
      bucket = {
        tokens: config.maxTokens,
        lastRefillTime: now,
      };
      this.buckets.set(identifier, bucket);
    }

    // Refill tokens based on time elapsed
    const timePassed = now - bucket.lastRefillTime;
    const tokensToAdd = (timePassed / config.refillInterval) * config.refillRate;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefillTime = now;
    }

    // Check if we have tokens
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get remaining tokens for an identifier
   */
  getRemainingTokens(identifier: string, config: RateLimitConfig): number {
    const bucket = this.buckets.get(identifier);
    if (!bucket) return config.maxTokens;

    const now = Date.now();
    const timePassed = now - bucket.lastRefillTime;
    const tokensToAdd = (timePassed / config.refillInterval) * config.refillRate;

    return Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.buckets.delete(identifier);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.buckets.clear();
  }

  /**
   * Cleanup old buckets every 5 minutes
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes

      for (const [key, bucket] of this.buckets) {
        if (now - bucket.lastRefillTime > maxAge) {
          this.buckets.delete(key);
        }
      }
    }, 60000); // Run every minute
  }

  /**
   * Stop cleanup interval (call on app shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    return {
      bucketsCount: this.buckets.size,
    };
  }

  /**
   * Destroy service
   */
  onModuleDestroy(): void {
    this.stopCleanup();
  }
}
