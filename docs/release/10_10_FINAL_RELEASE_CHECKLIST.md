# 10/10 Final Release Checklist

Updated: 2026-05-01

## Pre-Release Gates

- [x] Typecheck passes.
- [x] Lint passes.
- [x] Unit/integration tests pass.
- [x] Production build passes.
- [x] Cloudflare/OpenNext build passes.
- [x] iOS Worker/Manager simulator builds pass.
- [x] Android debug build passes.
- [x] Smoke scripts are syntactically valid.

## Operator-Only Gates (External)

- [ ] Run staged deploy with real secrets and validate `/api/system/health` with system key.
- [ ] Run production deploy window procedure with rollback readiness.
- [ ] Execute pilot smoke against live URLs with authenticated accounts.
- [ ] Run Supabase live migration check (`supabase migration list`, dry-run verify target).

## Rollback Readiness

- Use last successful deploy artifact and workflow rollback procedure.
- Keep DB migrations forward-only; do not rewrite migration history.
