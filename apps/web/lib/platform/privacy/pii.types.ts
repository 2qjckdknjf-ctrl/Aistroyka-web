/**
 * PII classification types. Levels: none | low | medium | high.
 */

export type PiiType = "EMAIL" | "PHONE" | "ADDRESS" | "PERSON_NAME" | "ID_NUMBER";

export type PiiLevel = "none" | "low" | "medium" | "high";

export interface PiiClassification {
  pii_level: PiiLevel;
  types: PiiType[];
}

export interface PrivacySettingsRow {
  tenant_id: string;
  pii_mode: "off" | "detect" | "enforce";
  redact_ai_prompts: boolean;
  allow_exports: boolean;
  created_at: string;
}
