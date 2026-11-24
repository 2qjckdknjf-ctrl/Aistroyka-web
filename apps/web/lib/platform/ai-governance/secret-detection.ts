/**
 * Pre-egress secret detection (AIS-PILOT-001 / Codex delta 2026-11-24 P0).
 * Pure regex over text payloads — no network, no real secrets required.
 * Call fail-closed before LLM / external transmission.
 */

export type SecretKind =
  | "openai_sk"
  | "github_pat"
  | "google_api_key"
  | "slack_token"
  | "stripe_webhook"
  | "jwt"
  | "pem_private_key";

export interface SecretHit {
  kind: SecretKind;
  /** Character index of the match start (for tests / diagnostics — never log the value). */
  index: number;
}

const PATTERNS: Array<{ kind: SecretKind; re: RegExp }> = [
  { kind: "openai_sk", re: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { kind: "github_pat", re: /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g },
  { kind: "google_api_key", re: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { kind: "slack_token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { kind: "stripe_webhook", re: /\bwhsec_[A-Za-z0-9]{16,}\b/g },
  {
    kind: "jwt",
    re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  { kind: "pem_private_key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
];

/** Scan arbitrary text for high-signal secret shapes. Empty/whitespace → no hits. */
export function detectSecrets(input: string | null | undefined): SecretHit[] {
  if (!input || !input.trim()) return [];
  const hits: SecretHit[] = [];
  for (const { kind, re } of PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      hits.push({ kind, index: m.index });
      // Avoid pathological zero-width loops
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
  }
  return hits;
}

/** True when any payload string contains a secret pattern. */
export function containsSecrets(...payloads: Array<string | null | undefined>): boolean {
  return payloads.some((p) => detectSecrets(p).length > 0);
}
