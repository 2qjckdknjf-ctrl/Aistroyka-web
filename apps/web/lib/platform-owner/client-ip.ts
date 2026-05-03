/**
 * Best-effort client IP for Edge middleware (Cloudflare / proxies).
 * `OWNER_IP_ALLOWLIST` should list exact IPs or optional CIDR (we support /nn suffix on IPv4).
 */

export function getRequestClientIp(request: { headers: Headers }): string | null {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xff = request.headers.get("x-forwarded-for")?.trim();
  if (xff) return xff.split(",")[0]?.trim() || null;
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return null;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return (((parts[0] * 256 + parts[1]) * 256 + parts[2]) * 256 + parts[3]) >>> 0;
}

function parseCidrOrIp(entry: string): { base: number; mask: number } | null {
  const s = entry.trim();
  if (!s) return null;
  const slash = s.indexOf("/");
  if (slash === -1) {
    const ip = ipv4ToInt(s);
    if (ip == null) return null;
    return { base: ip, mask: 0xffffffff };
  }
  const ipStr = s.slice(0, slash);
  const bits = Number(s.slice(slash + 1));
  const ip = ipv4ToInt(ipStr);
  if (ip == null || !Number.isInteger(bits) || bits < 0 || bits > 32) return null;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return { base: ip & mask, mask };
}

export function parseOwnerIpAllowlist(raw: string | undefined): string[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Returns true when allowlist is non-empty and IP is not allowed. */
export function isIpBlockedByOwnerAllowlist(clientIp: string | null, allowlistRaw: string | undefined): boolean {
  const entries = parseOwnerIpAllowlist(allowlistRaw);
  if (entries.length === 0) return false;
  if (!clientIp) return true;

  for (const entry of entries) {
    const rule = parseCidrOrIp(entry);
    if (!rule) continue;
    const ip = ipv4ToInt(clientIp);
    if (ip == null) return true;
    if ((ip & rule.mask) === (rule.base & rule.mask)) return false;
  }
  return true;
}
