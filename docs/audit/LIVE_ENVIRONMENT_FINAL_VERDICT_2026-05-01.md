# Live Environment Final Verdict (2026-05-01)

## Final status matrix

- Supabase live: **BLOCKED**
- production health: **PASS**
- system route auth: **BLOCKED**
- smoke: **BLOCKED**
- documents live: **BLOCKED**
- costs live: **BLOCKED**
- production-ready: **NO**
- pilot-ready: **NO**

## Evidence references

- `docs/audit/LIVE_SUPABASE_VERIFICATION_2026-05-01.md`
- `docs/audit/LIVE_DEPLOY_TRUTH_2026-05-01.md`
- `docs/audit/LIVE_SYSTEM_ROUTE_AUTH_2026-05-01.md`
- `docs/audit/LIVE_SMOKE_2026-05-01.md`
- `docs/audit/LIVE_DOCUMENTS_COSTS_VERIFICATION_2026-05-01.md`

## Key proven facts

1. Production and staging health are live:
   - `https://aistroyka.ai/api/v1/health` -> HTTP `200`, `buildStamp.sha7="e509f53"`, `buildStamp.buildTime="2026-04-27 10:49"`
   - `https://staging.aistroyka.ai/api/v1/health` -> HTTP `200`, `buildStamp.sha7="e3abb52"`, `buildStamp.buildTime="2026-04-26 14:08"`
   - Current local head: `7178c6bb` (both deployed envs behind local HEAD).

2. `/api/system/*` unauthorized path is protected:
   - no key: HTTP `401`
   - wrong key: HTTP `401`
   - positive path with real key remains unverified (missing `SYSTEM_API_KEY`).

3. Smoke script executes on both production and staging:
   - health/config/cron-tick: PASS
   - auth-sensitive `ops/metrics`: HTTP `401` without tenant auth.

4. Documents/cost routes are protected from anonymous access on both envs (HTTP `401`), but authenticated positive paths are unverified.

5. Supabase live migration checks did not run due to missing Supabase credentials.

## Exact remaining external blockers

1. `SUPABASE_ACCESS_TOKEN` missing
2. `SUPABASE_PROJECT_REF` missing
3. `SYSTEM_API_KEY` missing
4. Tenant auth material missing for protected live checks (`AUTH_HEADER` or `COOKIE`)
5. Approved staging tenant/project context missing for mutation-safe verification

## Operator closeout commands

```bash
# 1) Supabase live migration verification
export SUPABASE_ACCESS_TOKEN="<supabase_pat>"
export SUPABASE_PROJECT_REF="<target_project_ref>"
supabase projects list
supabase link --project-ref "$SUPABASE_PROJECT_REF" --yes
supabase migration list
supabase db push --dry-run --linked

# 2) /api/system/* positive-path verification
export SYSTEM_API_KEY="<real_system_api_key>"
curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: $SYSTEM_API_KEY"
curl -i https://aistroyka.ai/api/system/metrics -H "X-System-Key: $SYSTEM_API_KEY"

# 3) Authenticated smoke on production and staging
export AUTH_HEADER="Bearer <tenant_user_jwt>"
BASE_URL="https://aistroyka.ai" scripts/smoke/pilot_launch.sh
BASE_URL="https://staging.aistroyka.ai" scripts/smoke/pilot_launch.sh

# 4) Documents/costs authenticated read checks
export PROJECT_ID="<existing_project_id>"
curl -i "https://aistroyka.ai/api/v1/projects/$PROJECT_ID/documents" -H "Authorization: $AUTH_HEADER"
curl -i "https://aistroyka.ai/api/v1/projects/$PROJECT_ID/costs" -H "Authorization: $AUTH_HEADER"
```

## Final verdict

External P1 verification blockers are **partially reduced** (negative-path protections and deploy truth proven), but **not closed** due to missing live secrets/auth context.
