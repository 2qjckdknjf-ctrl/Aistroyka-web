/**
 * Lightweight denial aggregation for ops hooks (log-based SIEM ingestion).
 * Not distributed-safe across isolates; complements edge logs.
 */

type DenyBucket = { count: number; firstAt: number; lastReason: string };

const WINDOW_MS = 5 * 60 * 1000;
const ALERT_THRESHOLD = 25;

const ipBuckets = new Map<string, DenyBucket>();

function prune(now: number): void {
  for (const [k, v] of ipBuckets) {
    if (now - v.firstAt > WINDOW_MS) ipBuckets.delete(k);
  }
}

export function recordOwnerSecurityDenial(input: {
  clientIp: string | null;
  reason: string;
  path: string;
}): void {
  const now = Date.now();
  prune(now);
  const key = input.clientIp ?? "unknown_ip";
  const cur = ipBuckets.get(key);
  if (!cur || now - cur.firstAt > WINDOW_MS) {
    ipBuckets.set(key, { count: 1, firstAt: now, lastReason: input.reason });
    return;
  }
  cur.count += 1;
  cur.lastReason = input.reason;
  if (cur.count === ALERT_THRESHOLD) {
    console.error(
      JSON.stringify({
        type: "owner_security_alert",
        alert: "repeated_owner_denials",
        clientIp: input.clientIp,
        windowMinutes: WINDOW_MS / 60000,
        count: cur.count,
        lastReason: cur.lastReason,
        samplePath: input.path,
      })
    );
  }
}

export function recordOwnerSecurityAlert(input: Record<string, unknown>): void {
  console.error(JSON.stringify({ type: "owner_security_alert", ...input }));
}
