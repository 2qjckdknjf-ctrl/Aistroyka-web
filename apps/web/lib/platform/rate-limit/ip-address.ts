/**
 * Canonical IPv4 / IPv6 parse + normalize for rate-limit keying.
 * Edge/Worker-safe (no node:net). Rejects malformed / out-of-range tokens.
 */

export type ParsedIp =
  | { ok: true; family: "ipv4" | "ipv6"; canonical: string }
  | { ok: false };

function parseIpv4(raw: string): ParsedIp {
  const parts = raw.split(".");
  if (parts.length !== 4) return { ok: false };
  const octets: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return { ok: false };
    // Reject leading zeros like 01 (except bare 0) to avoid ambiguity.
    if (p.length > 1 && p.startsWith("0")) return { ok: false };
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) return { ok: false };
    octets.push(n);
  }
  return { ok: true, family: "ipv4", canonical: octets.join(".") };
}

function expandIpv6(raw: string): number[] | null {
  if (!raw || raw.includes(".") || /[^0-9a-fA-F:]/.test(raw)) return null;
  if (raw.includes(":::")) return null;

  const sides = raw.split("::");
  if (sides.length > 2) return null;

  const parseSide = (side: string): number[] | null => {
    if (side === "") return [];
    const parts = side.split(":");
    const out: number[] = [];
    for (const p of parts) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(p)) return null;
      out.push(parseInt(p, 16));
    }
    return out;
  };

  if (sides.length === 1) {
    const hextets = parseSide(sides[0]!);
    if (!hextets || hextets.length !== 8) return null;
    return hextets;
  }

  const left = parseSide(sides[0]!);
  const right = parseSide(sides[1]!);
  if (!left || !right) return null;
  const missing = 8 - left.length - right.length;
  if (missing < 1) return null;
  return [...left, ...Array(missing).fill(0), ...right];
}

function parseIpv6(raw: string): ParsedIp {
  // Reject bare "::::" style and lone colon noise before expand.
  if (raw === "::") {
    return {
      ok: true,
      family: "ipv6",
      canonical: "0000:0000:0000:0000:0000:0000:0000:0000",
    };
  }
  const hextets = expandIpv6(raw);
  if (!hextets) return { ok: false };
  const canonical = hextets.map((h) => h.toString(16).padStart(4, "0")).join(":");
  return { ok: true, family: "ipv6", canonical };
}

/** Parse and canonicalize a single IP token. Rejects multi-hop / garbage. */
export function parseAndNormalizeIp(raw: string): ParsedIp {
  const value = raw.trim();
  if (!value || value.length > 64) return { ok: false };
  if (value.includes(",") || value.includes(" ") || value.includes("%")) return { ok: false };

  if (value.includes(":")) {
    return parseIpv6(value);
  }
  if (value.includes(".")) {
    return parseIpv4(value);
  }
  return { ok: false };
}
