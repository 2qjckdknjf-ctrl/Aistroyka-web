/**
 * Deterministic binding between a validated skill input and trusted approval evidence.
 * The hash is computed only from validated input; model text is never authoritative scope.
 */

import { AgentError } from "../errors";

export async function hashRuntimeSkillInput(input: unknown): Promise<string> {
  let canonical: string;
  try {
    canonical = stableJson(input);
  } catch {
    throw new AgentError("AGENT_INVALID_INPUT", "input_not_canonicalizable", 400);
  }

  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function stableJson(input: unknown): string {
  const normalized = normalize(input);
  const encoded = JSON.stringify(normalized);
  if (typeof encoded !== "string") throw new TypeError("input_not_serializable");
  return encoded;
}

function normalize(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("non_finite_number");
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => normalize(item));
  if (typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new TypeError("non_plain_object");
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const item = (value as Record<string, unknown>)[key];
      if (typeof item === "undefined") continue;
      out[key] = normalize(item);
    }
    return out;
  }
  throw new TypeError("unsupported_input_type");
}
