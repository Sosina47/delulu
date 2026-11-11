const WINDOW_MS = 60_000;
const MAX_TRACKED_IPS = 2_000;

const buckets = new Map<string, number[]>();

function prune(now: number, timestamps: number[]): number[] {
  return timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
}

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Note: serverless instances are isolated and recycled, so this is a
 * best-effort guard, not a hard global quota. It is enough to stop accidental
 * double-submits and casual abuse for a hackathon deployment.
 */
export function checkRateLimit(ip: string, limitPerMinute: number): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(ip) ?? [];
  const recent = prune(now, existing);

  if (recent.length >= limitPerMinute) {
    const oldest = recent[0] ?? now;
    buckets.set(ip, recent);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)),
    };
  }

  recent.push(now);
  buckets.set(ip, recent);

  if (buckets.size > MAX_TRACKED_IPS) {
    const firstKey = buckets.keys().next().value;
    if (typeof firstKey === 'string') {
      buckets.delete(firstKey);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function getRateLimit(): number {
  const parsed = Number.parseInt(process.env.RATE_LIMIT_PER_MIN ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed, 120);
  }
  return 8;
}

/** Test helper. */
export function resetRateLimit(): void {
  buckets.clear();
}
