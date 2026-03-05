# Privacy and PII policy

## PII types (heuristic)

- **EMAIL,** **PHONE:** Regex detection.
- **ADDRESS:** Pattern (number + street-type).
- **PERSON_NAME:** Title + capitalized words.
- **ID_NUMBER:** 16-digit pattern (e.g. card-like).

## PII levels

- **none:** No PII detected.
- **low:** Person name only.
- **medium:** Email or phone.
- **high:** Address or ID number.

## Tenant settings (privacy_settings)

- **pii_mode:** off | detect | enforce. detect = classify and store findings; enforce = also block exports of high PII unless allowed.
- **redact_ai_prompts:** If true, redact detected PII before sending to AI.
- **allow_exports:** If false, block exports; if true, allow exports subject to high-PII block when enforce.

## Enforcement

- **Export:** Block export of high PII unless enterprise permission (allow_exports + pii_mode not enforce for high).
- **AI prompts:** Redact when redact_ai_prompts is true (use existing redaction.service).
- **Sharing:** Limit contractor scope (documented; enforced via RBAC/scopes).

## Admin

- GET /api/v1/admin/privacy/findings?range=30d lists PII findings for tenant. Permission: admin:read (privacy_admin when scoped).
