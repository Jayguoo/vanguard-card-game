interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitBucket {
  timestamps: number[];
}

export class RateLimiter {
  private buckets = new Map<string, RateLimitBucket>();
  private rules = new Map<string, RateLimitRule>();

  addRule(eventName: string, maxRequests: number, windowMs: number): void {
    this.rules.set(eventName, { maxRequests, windowMs });
  }

  /** Returns true if allowed, false if rate-limited. */
  check(socketId: string, eventName: string): boolean {
    const rule = this.rules.get(eventName);
    if (!rule) return true;

    const key = `${socketId}:${eventName}`;
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { timestamps: [] };
      this.buckets.set(key, bucket);
    }

    // Remove expired timestamps
    const cutoff = now - rule.windowMs;
    bucket.timestamps = bucket.timestamps.filter(t => t > cutoff);

    if (bucket.timestamps.length >= rule.maxRequests) {
      return false;
    }

    bucket.timestamps.push(now);
    return true;
  }

  /** Clean up all buckets for a disconnected socket. */
  clearSocket(socketId: string): void {
    const prefix = `${socketId}:`;
    for (const key of this.buckets.keys()) {
      if (key.startsWith(prefix)) {
        this.buckets.delete(key);
      }
    }
  }

  /** Periodic cleanup of stale entries. */
  cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      const eventName = key.substring(key.indexOf(':') + 1);
      const rule = this.rules.get(eventName);
      if (!rule) {
        this.buckets.delete(key);
        continue;
      }
      const cutoff = now - rule.windowMs;
      bucket.timestamps = bucket.timestamps.filter(t => t > cutoff);
      if (bucket.timestamps.length === 0) {
        this.buckets.delete(key);
      }
    }
  }
}
