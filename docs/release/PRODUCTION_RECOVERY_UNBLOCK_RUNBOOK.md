# Production Recovery Unblock Runbook

## Context

- Current production (`https://aistroyka.ai`) returns HTTP `500` on root and key smoke endpoints.
- Deploy from this workspace is blocked by Cloudflare API code `10027` (Worker size exceeds `3 MiB` plan limit).
- Current production Worker (`aistroyka-web-production`) has only one available version, so rollback is not currently possible.
- `wrangler secret list --env production` returns `[]` in this account/session (no secrets attached), so critical runtime keys likely need explicit restore.

## Goal

Restore production runtime to healthy state and re-open release gate checks without weakening auth/security controls.

## Immediate Operator Paths

### Path A — Restore via rollback (if a previous version appears)

Use only if Cloudflare now shows at least one older healthy version.

```bash
cd apps/web
bunx wrangler versions list --env production --config wrangler.toml
# pick known-good VERSION_ID (older than current broken one)
bunx wrangler rollback <VERSION_ID> --env production --config wrangler.toml --message "rollback: restore healthy production runtime" --yes
```

### Path B — Unblock deploy size limit (required in current state)

Because code `10027` blocks upload, choose one of:

1) Move production Worker to a paid plan/account that allows larger script size (up to 10 MiB), or  
2) Use a production account/project that already has adequate Worker limits.

Then redeploy:

```bash
# repo root
bun run cf:build
bun run cf:deploy:prod
```

If using direct wrangler deploy path:

```bash
cd apps/web
bunx wrangler deploy --env production --config wrangler.toml
```

## Required Secrets / Runtime Inputs

- `SYSTEM_API_KEY` set in production runtime
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL=https://aistroyka.ai`
- Any smoke auth material used by protected probes:
  - `AUTH_HEADER` or `COOKIE`
  - or `SMOKE_EMAIL` + `SMOKE_PASSWORD` + Supabase public envs for token minting

### Safe restore commands (values from operator vault only)

```bash
cd apps/web

# Never paste secrets into chat/logs. Use terminal only.
printf '%s' "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | bunx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY --env production --config wrangler.toml
printf '%s' "$SYSTEM_API_KEY" | bunx wrangler secret put SYSTEM_API_KEY --env production --config wrangler.toml
printf '%s' "$SUPABASE_SERVICE_ROLE_KEY" | bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production --config wrangler.toml

# Non-secret public vars can stay in wrangler vars or be set via dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_APP_URL
```

## Post-Recovery Verification (must all pass)

### 1) System-route security

```bash
export BASE_URL="https://aistroyka.ai"
export SYSTEM_API_KEY="..."

curl -i "$BASE_URL/api/system/health"
curl -i "$BASE_URL/api/system/health" -H "X-System-Key: WRONG_KEY"
curl -i "$BASE_URL/api/system/health" -H "X-System-Key: $SYSTEM_API_KEY"
```

Expected:
- no-key: no operational payload (401/403/503 policy block acceptable)
- wrong-key: no operational payload (401/403/503 policy block acceptable)
- correct-key: authenticated response path works (200 or health-derived non-200)

### 2) Smoke

```bash
BASE_URL="https://aistroyka.ai" scripts/smoke/pilot_launch.sh
```

Must not return 500 on:
- `/api/v1/health`
- `/api/v1/config`
- `/api/v1/admin/jobs/cron-tick`
- `/api/v1/ops/metrics` (with valid tenant auth context)

### 3) Public root runtime

```bash
curl -i "https://aistroyka.ai/"
```

Must not return 500.

## Release Gate Re-Decision

After successful recovery, re-run and update:

- `docs/audit/LIVE_SMOKE_VERIFICATION_REPORT.md`
- `docs/audit/LIVE_SYSTEM_ROUTE_SECURITY_REPORT.md`
- `docs/audit/PRODUCTION_CLOSURE_MASTER_REPORT.md`
- `docs/release/PRODUCTION_RELEASE_GO_NO_GO.md`

Only then reconsider:
- Production release: `GO` or `GO ONLY TO STAGING`.
