# Wave 4 Step 6 — Validation (Stage H)

## Tests

| Area | File |
|------|------|
| Service: validation, respond, complete, public row | `lib/domain/client-requests/client-requests.service.test.ts` |
| API list/create | `app/api/v1/projects/[id]/client-requests/route.test.ts` |
| Client portal still loads with `client_requests` | `lib/domain/client-portal/client-portal.service.test.ts` |

## Commands

- `npm run test` — **192** files, **1163** tests (pass).
- `npm run build` — production build (pass).

## Focused checks

- Stakeholder DTO omits internal user ids (`rowToPublic` assertion).
- `info_only` requests reject `respond` API path.
