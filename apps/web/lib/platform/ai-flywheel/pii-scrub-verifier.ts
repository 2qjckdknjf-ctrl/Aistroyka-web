/**
 * Re-scan scrubbed output. Failed examples must be dropped from export.
 */

import { scrubText } from "./pii-scrub";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const SPANISH_MOBILE_RE = /(?:\+34[\s.-]?)?(?:[67]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}|\d{3}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/;
const SPANISH_LANDLINE_RE =
  /(?:\+34[\s.-]?)?(?:[89]\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2})/;
const IBAN_RE = /\bES\d{2}[\s]?[0-9]{4}[\s]?[0-9]{4}[\s]?[0-9]{4}[\s]?[0-9]{4}[\s]?[0-9]{4}\b/i;
const GENERIC_IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9\s]{10,30}\b/i;
const BANK_CARD_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
const NIE_RE = /\b[XYZ]\d{7}[A-Z]\b/i;
const NIF_RE = /\b\d{8}[A-Z]\b/i;
const CIF_RE = /\b[A-HJ-NP-SUVW]\d{7}[0-9A-J]\b/i;
const CADASTRAL_RE = /\b\d{7}[A-Z]{2}\d{4}[A-Z]\b/i;
const SOCIAL_HANDLE_RE = /\b(?:whatsapp|telegram|wa\.me|t\.me)[:\s@/]*[@]?[\w.-]{3,32}\b/i;
const ADDRESS_RE = /\b(?:C\/|Calle|Carrer|Av\.?|Avenida|Plaza|Plaça)\s+[\w\s\d,.ºª/-]{3,}/i;

const CHECKS: Array<{ re: RegExp; label: string }> = [
  { re: EMAIL_RE, label: "EMAIL" },
  { re: IBAN_RE, label: "BANK_DETAIL" },
  { re: GENERIC_IBAN_RE, label: "BANK_DETAIL" },
  { re: BANK_CARD_RE, label: "BANK_DETAIL" },
  { re: NIE_RE, label: "TAX_ID" },
  { re: NIF_RE, label: "TAX_ID" },
  { re: CIF_RE, label: "TAX_ID" },
  { re: CADASTRAL_RE, label: "CADASTRAL" },
  { re: SPANISH_MOBILE_RE, label: "PHONE" },
  { re: SPANISH_LANDLINE_RE, label: "PHONE" },
  { re: SOCIAL_HANDLE_RE, label: "SOCIAL_HANDLE" },
  { re: ADDRESS_RE, label: "ADDRESS" },
];

export interface VerifyResult {
  passed: boolean;
  violations: string[];
}

function collectViolations(text: string): string[] {
  const violations: string[] = [];
  for (const { re, label } of CHECKS) {
    if (re.test(text) && !violations.includes(label)) violations.push(label);
    re.lastIndex = 0;
  }
  return violations;
}

/** Verify a single string passes post-scrub scan. */
export function verifyScrubbedText(text: string): VerifyResult {
  const violations = collectViolations(text);
  return { passed: violations.length === 0, violations };
}

/** Verify all string leaves in JSON. Fails if any unsanitized PII remains. */
export function verifyScrubbedJson(value: unknown): VerifyResult {
  const violations: string[] = [];

  function walk(v: unknown): void {
    if (typeof v === "string") {
      for (const t of collectViolations(v)) {
        if (!violations.includes(t)) violations.push(t);
      }
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) walk(item);
      return;
    }
    if (v !== null && typeof v === "object") {
      for (const item of Object.values(v as Record<string, unknown>)) walk(item);
    }
  }

  walk(value);
  return { passed: violations.length === 0, violations };
}

/** Scrub then verify. Returns null if verification fails (example must be dropped). */
export function scrubAndVerify(text: string): { text: string } | null {
  const scrubbed = scrubText(text);
  const verify = verifyScrubbedText(scrubbed.text);
  if (!verify.passed) return null;
  return { text: scrubbed.text };
}
