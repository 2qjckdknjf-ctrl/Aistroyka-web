# Live Smoke Verification Report

## Commands Run

- `BASE_URL="https://aistroyka.ai" scripts/smoke/pilot_launch.sh`
- `BASE_URL="https://staging.aistroyka.ai" scripts/smoke/pilot_launch.sh`
- `curl -i "https://aistroyka.ai/"`
- `curl -i "https://staging.aistroyka.ai/"`
- `bun run cf:deploy:prod`
- `bunx wrangler deploy --env production --config wrangler.toml`
- Additional live probes:
  - `curl -i "https://staging.aistroyka.ai/api/v1/projects/00000000-0000-0000-0000-000000000000/documents"`
  - `curl -i "https://staging.aistroyka.ai/api/v1/projects/00000000-0000-0000-0000-000000000000/costs"`

## Result

- Production smoke:
  - `/api/v1/health`: FAIL (500)
  - `/api/v1/config`: FAIL (500)
  - `/api/v1/admin/jobs/cron-tick`: FAIL (500)
  - `/api/v1/ops/metrics`: FAIL (500)
- Staging smoke:
  - health/config/cron-tick: PASS
  - ops/metrics: FAIL (401, missing auth)
- Staging route probes for docs/costs without auth: HTTP 401 (auth guard active)
- Production root page: HTTP 500
- Staging root page: HTTP 307 redirect (healthy)
- Production redeploy attempts: FAIL (`Cloudflare API code 10027`, Worker size > 3 MiB)

## Proof Summary

- Production smoke is currently red due to runtime 500 responses on core endpoints.
- Staging runtime health/config/cron path is healthy.
- Tenant-auth protected endpoints require valid auth (as expected) and reject anonymous calls.
- Staging ops/metrics requires `COOKIE` or `AUTH_HEADER` (or smoke user credentials + Supabase public env values to mint user JWT).
- Direct recovery deploy from this session is blocked by Cloudflare Worker plan size limit for this account/runtime path.

## Files Changed

- `docs/audit/LIVE_SMOKE_VERIFICATION_REPORT.md`

## Blockers

- Missing smoke auth material for tenant-scoped `ops/metrics`:
  - `AUTH_HEADER` or `COOKIE`
  - or `SMOKE_EMAIL` + `SMOKE_PASSWORD` + (`SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL`) + (`SUPABASE_ANON_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Production endpoints returning 500 require operator runtime/environment remediation.
- Deploy blocker: Cloudflare Worker size limit (3 MiB) rejects current OpenNext bundle (`handler.mjs` ~31 MiB). Requires paid-plan deploy path or alternative production account/runtime strategy.

## Final Verdict

FAIL
