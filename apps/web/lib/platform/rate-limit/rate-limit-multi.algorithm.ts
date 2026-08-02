/**
 * Algorithm twin of public.rate_limit_try_increment_multi (see migration SQL).
 * Used for local concurrent semantic tests — NOT a live Postgres proof.
 */

export type RateLimitBucketInput = {
  key: string;
  limit: number;
  dimension: string;
};

export type MultiRateLimitResult = {
  allowed: boolean;
  limited_dimension: string | null;
  limited_key: string | null;
  current_count: number | null;
  limit: number | null;
  buckets: Array<{
    key: string;
    dimension: string;
    limit: number;
    current_count: number;
    next_count?: number;
  }>;
};

/** Shared slot map: `${key}\0${windowStart}` → count */
export type RateLimitSlotMap = Map<string, number>;

function slotId(key: string, windowStart: string): string {
  return `${key}\0${windowStart}`;
}

/**
 * Synchronous all-or-nothing multi-bucket decide+charge.
 * Callers must serialize access to `slots` (mutex) to mimic FOR UPDATE.
 */
export function rateLimitTryIncrementMultiSync(
  slots: RateLimitSlotMap,
  windowStart: string,
  buckets: RateLimitBucketInput[]
): MultiRateLimitResult {
  if (!windowStart || buckets.length < 1) {
    throw new Error("invalid multi rate limit input");
  }
  const sorted = [...buckets].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const planned: MultiRateLimitResult["buckets"] = [];

  for (const b of sorted) {
    if (!b.key || b.limit < 1) throw new Error("invalid bucket");
    const id = slotId(b.key, windowStart);
    const current = slots.get(id) ?? 0;
    if (!slots.has(id)) slots.set(id, 0);
    if (current >= b.limit) {
      return {
        allowed: false,
        limited_dimension: b.dimension,
        limited_key: b.key,
        current_count: current,
        limit: b.limit,
        buckets: planned,
      };
    }
    planned.push({
      key: b.key,
      dimension: b.dimension,
      limit: b.limit,
      current_count: current,
      next_count: current + 1,
    });
  }

  const results: MultiRateLimitResult["buckets"] = [];
  for (const b of sorted) {
    const id = slotId(b.key, windowStart);
    const next = (slots.get(id) ?? 0) + 1;
    slots.set(id, next);
    results.push({
      key: b.key,
      dimension: b.dimension,
      limit: b.limit,
      current_count: next,
    });
  }

  return {
    allowed: true,
    limited_dimension: null,
    limited_key: null,
    current_count: null,
    limit: null,
    buckets: results,
  };
}

/** Mutex wrapper so concurrent async callers serialize like row locks. */
export function createRateLimitMultiMutex(slots: RateLimitSlotMap = new Map()) {
  let chain: Promise<unknown> = Promise.resolve();
  return {
    slots,
    async run(
      windowStart: string,
      buckets: RateLimitBucketInput[]
    ): Promise<MultiRateLimitResult> {
      const run = chain.then(() => rateLimitTryIncrementMultiSync(slots, windowStart, buckets));
      chain = run.then(
        () => undefined,
        () => undefined
      );
      return run;
    },
  };
}
