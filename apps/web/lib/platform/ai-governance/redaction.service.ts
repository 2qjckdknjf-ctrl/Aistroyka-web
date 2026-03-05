/**
 * Lightweight redaction: regex for emails/phones, mask obvious identifiers.
 * Log that redaction occurred (audit + metrics). No heavy NLP.
 */

import type { RedactionResult } from "./pii.types";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /\+?[\d\s\-()]{10,}/g;
const MASK = "[REDACTED]";

export function redactText(input: string): RedactionResult {
  let text = input;
  const kinds: ("email" | "phone" | "identifier")[] = [];

  if (EMAIL_RE.test(input)) {
    kinds.push("email");
    text = text.replace(EMAIL_RE, MASK);
  }
  if (PHONE_RE.test(input)) {
    kinds.push("phone");
    text = text.replace(PHONE_RE, MASK);
  }

  return {
    text,
    redacted: kinds.length > 0,
    kinds,
  };
}
