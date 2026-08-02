/**
 * Shared SSRF-safe remote media fetch for AI provider paths.
 * Edge/Worker-safe URL/IP checks; optional node:dns when available.
 * Never logs full URLs, query strings, or raw binary.
 */

import { parseAndNormalizeIp } from "@/lib/platform/rate-limit/ip-address";

export type SafeRemoteMediaErrorCode =
  | "invalid_url"
  | "scheme_not_allowed"
  | "https_required"
  | "host_blocked"
  | "ip_blocked"
  | "dns_blocked"
  | "redirect_blocked"
  | "too_large"
  | "wrong_mime"
  | "timeout"
  | "empty"
  | "fetch_failed";

export class SafeRemoteMediaError extends Error {
  constructor(
    message: string,
    readonly code: SafeRemoteMediaErrorCode
  ) {
    super(message);
    this.name = "SafeRemoteMediaError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
  "metadata",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

const DEFAULT_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DEFAULT_VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/octet-stream",
]);

export type AssertSafeRemoteMediaUrlOptions = {
  /** When true (production), only https is allowed. */
  requireHttps?: boolean;
  maxUrlLength?: number;
};

export type FetchSafeRemoteMediaOptions = AssertSafeRemoteMediaUrlOptions & {
  maxBytes: number;
  timeoutMs?: number;
  maxRedirects?: number;
  /** Allow cross-host redirects (default false). */
  allowCrossHostRedirect?: boolean;
  allowedMimeTypes?: ReadonlySet<string>;
  /** When true, missing/unknown MIME is rejected. Default true for images. */
  requireMimeAllowList?: boolean;
  signal?: AbortSignal;
  /** Optional resolver for tests. */
  resolveHostIps?: (hostname: string) => Promise<string[]>;
  fetchImpl?: typeof fetch;
};

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

function isIpv4Blocked(octets: number[]): boolean {
  const [a, b] = octets;
  if (a === undefined || b === undefined) return true;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isIpv6Blocked(canonical: string): boolean {
  const parts = canonical.split(":").map((h) => parseInt(h, 16));
  if (parts.length !== 8 || parts.some((n) => Number.isNaN(n))) return true;
  // :: and ::1
  if (parts.every((n) => n === 0)) return true;
  if (
    parts[0] === 0 &&
    parts[1] === 0 &&
    parts[2] === 0 &&
    parts[3] === 0 &&
    parts[4] === 0 &&
    parts[5] === 0 &&
    parts[6] === 0 &&
    parts[7] === 1
  ) {
    return true;
  }
  // IPv4-mapped ::ffff:x.x.x.x
  if (
    parts[0] === 0 &&
    parts[1] === 0 &&
    parts[2] === 0 &&
    parts[3] === 0 &&
    parts[4] === 0 &&
    parts[5] === 0xffff
  ) {
    const hi = parts[6]!;
    const lo = parts[7]!;
    return isIpv4Blocked([(hi >> 8) & 0xff, hi & 0xff, (lo >> 8) & 0xff, lo & 0xff]);
  }
  // Unique local fc00::/7
  if ((parts[0]! & 0xfe00) === 0xfc00) return true;
  // Link-local fe80::/10
  if ((parts[0]! & 0xffc0) === 0xfe80) return true;
  return false;
}

/** Returns true when the IP must not be contacted for AI media fetch. */
export function isBlockedIpAddress(raw: string): boolean {
  const parsed = parseAndNormalizeIp(raw);
  if (!parsed.ok) return true;
  if (parsed.family === "ipv4") {
    const octets = parsed.canonical.split(".").map((n) => Number(n));
    return isIpv4Blocked(octets);
  }
  return isIpv6Blocked(parsed.canonical);
}

function isBlockedHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (host.includes("metadata.google")) return true;
  // Literal IP in hostname
  if (host.startsWith("[") && host.endsWith("]")) {
    return isBlockedIpAddress(host.slice(1, -1));
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) {
    return isBlockedIpAddress(host);
  }
  return false;
}

async function defaultResolveHostIps(hostname: string): Promise<string[]> {
  const host = normalizeHostname(hostname);
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) {
    return [host.replace(/^\[|\]$/g, "")];
  }
  try {
    const dns = await import("node:dns/promises");
    const results = await dns.lookup(host, { all: true, verbatim: true });
    return results.map((r) => r.address);
  } catch {
    // Fail closed when DNS cannot be resolved for AI media.
    throw new SafeRemoteMediaError("DNS resolution failed for media host", "dns_blocked");
  }
}

/**
 * Validate a remote media URL before any provider call (including provider-side fetch).
 */
export async function assertSafeRemoteMediaUrl(
  rawUrl: string,
  opts: FetchSafeRemoteMediaOptions | AssertSafeRemoteMediaUrlOptions = {}
): Promise<URL> {
  const maxUrlLength = opts.maxUrlLength ?? 2048;
  if (!rawUrl || rawUrl.length > maxUrlLength) {
    throw new SafeRemoteMediaError("Media URL too long or empty", "invalid_url");
  }
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SafeRemoteMediaError("Media URL is invalid", "invalid_url");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SafeRemoteMediaError("Media URL scheme not allowed", "scheme_not_allowed");
  }
  if (opts.requireHttps && parsed.protocol !== "https:") {
    throw new SafeRemoteMediaError("Media URL must be https", "https_required");
  }
  if (parsed.username || parsed.password) {
    throw new SafeRemoteMediaError("Media URL must not include credentials", "invalid_url");
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new SafeRemoteMediaError("Media host is not allowed", "host_blocked");
  }

  const resolve =
    "resolveHostIps" in opts && opts.resolveHostIps
      ? opts.resolveHostIps
      : defaultResolveHostIps;
  const ips = await resolve(parsed.hostname);
  if (!ips.length) {
    throw new SafeRemoteMediaError("Media host could not be resolved", "dns_blocked");
  }
  for (const ip of ips) {
    if (isBlockedIpAddress(ip)) {
      throw new SafeRemoteMediaError("Media host resolves to a blocked address", "ip_blocked");
    }
  }
  return parsed;
}

function mergeContentType(header: string | null): string {
  return (header ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

async function readBodyWithCap(
  res: Response,
  maxBytes: number
): Promise<Uint8Array> {
  const cl = res.headers.get("content-length");
  if (cl) {
    const n = Number(cl);
    if (Number.isFinite(n) && n > maxBytes) {
      throw new SafeRemoteMediaError("Media exceeds size limit", "too_large");
    }
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const buf = await res.arrayBuffer();
    const u = new Uint8Array(buf);
    if (u.length === 0) throw new SafeRemoteMediaError("Empty media body", "empty");
    if (u.length > maxBytes) throw new SafeRemoteMediaError("Media exceeds size limit", "too_large");
    return u;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.length) continue;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new SafeRemoteMediaError("Media exceeds size limit", "too_large");
    }
    chunks.push(value);
  }
  if (total === 0) throw new SafeRemoteMediaError("Empty media body", "empty");
  const data = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    data.set(c, off);
    off += c.length;
  }
  return data;
}

/**
 * Fetch remote media with scheme/host/IP/redirect/MIME/size/timeout controls.
 */
export async function fetchSafeRemoteMedia(
  rawUrl: string,
  opts: FetchSafeRemoteMediaOptions
): Promise<{ data: Uint8Array; contentType: string; finalUrlHost: string }> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const maxRedirects = opts.maxRedirects ?? 3;
  const allowCrossHost = opts.allowCrossHostRedirect === true;
  const requireMime = opts.requireMimeAllowList !== false;
  const allowedMime = opts.allowedMimeTypes ?? DEFAULT_IMAGE_MIME;
  const fetchImpl = opts.fetchImpl ?? fetch;

  let current = await assertSafeRemoteMediaUrl(rawUrl, opts);
  const originHost = normalizeHostname(current.hostname);

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    opts.signal?.addEventListener("abort", onAbort, { once: true });

    let res: Response;
    try {
      res = await fetchImpl(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
      if (e instanceof SafeRemoteMediaError) throw e;
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      if (msg.includes("abort") || msg.includes("timeout")) {
        throw new SafeRemoteMediaError("Media fetch timed out", "timeout");
      }
      throw new SafeRemoteMediaError("Media fetch failed", "fetch_failed");
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new SafeRemoteMediaError("Redirect missing location", "redirect_blocked");
      let next: URL;
      try {
        next = new URL(loc, current);
      } catch {
        throw new SafeRemoteMediaError("Redirect location invalid", "redirect_blocked");
      }
      if (!allowCrossHost && normalizeHostname(next.hostname) !== originHost) {
        throw new SafeRemoteMediaError("Cross-host redirect not allowed", "redirect_blocked");
      }
      current = await assertSafeRemoteMediaUrl(next.toString(), opts);
      continue;
    }

    if (!res.ok) {
      throw new SafeRemoteMediaError(`Media fetch failed: HTTP ${res.status}`, "fetch_failed");
    }

    const contentType = mergeContentType(res.headers.get("content-type"));
    if (requireMime) {
      if (!contentType || !allowedMime.has(contentType)) {
        throw new SafeRemoteMediaError("Media content-type not allowed", "wrong_mime");
      }
    }

    const data = await readBodyWithCap(res, opts.maxBytes);
    return {
      data,
      contentType: contentType || "application/octet-stream",
      finalUrlHost: normalizeHostname(current.hostname),
    };
  }

  throw new SafeRemoteMediaError("Too many redirects", "redirect_blocked");
}

export const SAFE_IMAGE_MIME_TYPES = DEFAULT_IMAGE_MIME;
export const SAFE_VIDEO_MIME_TYPES = DEFAULT_VIDEO_MIME;
