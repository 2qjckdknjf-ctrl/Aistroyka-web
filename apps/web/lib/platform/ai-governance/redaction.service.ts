import { PII_PATTERNS } from "./pii.types";

const MASK = "***";

export function redactPII(text: string): { redacted: string; applied: boolean } {
  if (!text || typeof text !== "string") return { redacted: text, applied: false };
  let redacted = text;
  let applied = false;
  for (const pattern of Object.values(PII_PATTERNS)) {
    const before = redacted;
    redacted = redacted.replace(pattern, MASK);
    if (redacted !== before) applied = true;
  }
  return { redacted, applied };
}
