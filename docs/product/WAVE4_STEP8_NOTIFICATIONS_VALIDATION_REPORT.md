# Wave 4 Step 8 — Validation report (Stage I)

## Automated tests

| Area | Command / file |
|------|------------------|
| Repository + row mapping | `vitest run lib/domain/stakeholder-notifications/stakeholder-notifications.repository.test.ts` |
| Cron tick contract | `vitest run app/api/v1/admin/jobs/cron-tick/route.test.ts` (mocked stakeholder reminders) |

## Production build

- `npm run build` from repository root (contracts + `apps/web` Next.js production build) — **passed** (exit code 0).

## Focused checks

- API routes compile: stakeholders, client-requests, respond, accept, stakeholder-notifications (GET + read), stakeholder-delivery, cron-tick.
- Lint on touched TSX/API files — no issues reported.

## Database

- Migration `20260329170000_stakeholder_notifications.sql` must be applied in each environment (not validated by CI DB apply in this run).
