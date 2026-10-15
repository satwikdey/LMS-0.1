/** Tiny in-process sliding-window limiter (per server instance) for login and public forms. */
const buckets = new Map<string, number[]>();

export function hit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return true;
}

export function resetRateLimits() {
  buckets.clear();
}
