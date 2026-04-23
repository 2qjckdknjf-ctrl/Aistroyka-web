# Wave 4 Step 7 — Validation (Stage H)

## Tests

| Area | File |
|------|------|
| Stakeholders invite / accept guard | `lib/domain/stakeholders/stakeholders.service.test.ts` |
| Client portal uses policy + capabilities | `lib/domain/client-portal/client-portal.service.test.ts` |
| Client requests respond uses `canRespondToClientRequests` | `lib/domain/client-requests/client-requests.service.test.ts` |

## Commands

- `npm run test` — **193** files, **1164** tests (pass).
- `npm run build` — pass.

## Focused checks

- Respond path mocks `canRespondToClientRequests` separately from read access.
- Portal view asserts `capabilities.can_respond_to_requests`.
