/** PII/redaction: types for sensitive text detection (placeholder). */

export type PiiKind = "email" | "phone" | "identifier";

export interface RedactionResult {
  text: string;
  redacted: boolean;
  kinds: PiiKind[];
}
