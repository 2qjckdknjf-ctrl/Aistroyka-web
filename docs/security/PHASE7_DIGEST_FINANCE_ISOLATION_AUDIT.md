# Phase 7 — Daily digest finance isolation audit

## Scope

Owner-facing digest lines must obey the same **customer finance isolation** rule as the rest of the product: no internal margin, planned vs actual cost disclosure, subcontractor pricing, or “internal budget pressure” wording.

## Implementation path (owner)

1. API: `GET /api/v1/projects/:id/daily-digest?audience=owner`
2. Service: `buildOwnerProjectDailyDigest` → `getClientProjectView` → `buildOwnerDigestLinesFromClientView`
3. Data boundary: owner lines are **only** a function of `ClientProjectView`, which is already the customer-safe projection layer.

## Manager path (explicit non-isolation)

Manager digest uses `ProjectSummary` and intentionally includes:

- “internal budget signals show actual above planned”
- “internal spend is near the planned ceiling”

These strings are **not** included in owner builders and must not be referenced in owner API responses.

## Tests

`daily-digest.service.test.ts` asserts owner line text (lowercased join) does not match forbidden patterns:

- `margin`, `profit`, `planned total`, `actual cost`, `internal budget`, `subcontractor`

## Residual risks

| Risk | Mitigation |
|------|------------|
| Future edit adds summary fields into owner builder | Code review: owner path must not import `ProjectSummary` or cost repositories. |
| `ClientProjectView` accidentally gains internal fields | Review client-portal adapter; keep finance fields customer-scoped only. |
| i18n / copy drift | Owner dashboard copy already marked “customer-safe” in messages; keep terminology aligned. |

## Verdict

**PASS** for current architecture: owner digest is structurally isolated to portal view data; manager digest may include internal budget language by design.
