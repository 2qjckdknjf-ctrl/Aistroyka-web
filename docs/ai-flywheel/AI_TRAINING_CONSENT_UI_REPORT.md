# AI Training Consent UI Report

**Date:** 2026-06-17

## UI location

- Page: `/[locale]/admin/ai/training-consent`
- Component: `AdminAiTrainingConsentClient.tsx`
- Access: existing `/admin/*` layout — owner/admin only via `requireAdmin`

## API

- `GET /api/v1/tenant/ai-training-consent` — read current consent
- `PATCH /api/v1/tenant/ai-training-consent` — update consent (boolean body)

## Behavior

- Toggle default **off**
- Plain-language explanation + revocation bullets (i18n: `aiFlywheel.consent.*`)
- Save writes `tenants.ai_training_consent` via service role after admin role check
- Audit: `ai_training_consent_change` via `auditTrainingConsentChange()`

## Permissions

- `hasMinRole(..., "admin")` required — workers/members/viewers/customer/owner portal blocked
- Tenant owner (`tenants.user_id`) with admin layout access allowed

## i18n

Updated: `en.json`, `ru.json`, `es.json`, `it.json`

## Link

Added from `/admin/ai` observability page.
