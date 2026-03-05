import type { PrivacySettingsRow } from "./pii.types";

/** Block export of high PII unless tenant allows (enterprise permission). */
export function canExportWithPii(settings: PrivacySettingsRow | null, piiLevel: string): boolean {
  if (!settings?.allow_exports) return false;
  if (piiLevel === "high" && settings.pii_mode !== "enforce") return true;
  if (piiLevel === "high") return false;
  return true;
}

/** Whether to redact text in AI prompts based on tenant settings. */
export function shouldRedactAiPrompts(settings: PrivacySettingsRow | null): boolean {
  return settings?.redact_ai_prompts ?? true;
}
