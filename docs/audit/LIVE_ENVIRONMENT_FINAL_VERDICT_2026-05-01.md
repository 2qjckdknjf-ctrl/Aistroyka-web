# Live Environment Final Verdict (2026-05-01)

## Check matrix

- Supabase live: **BLOCKED**
- production health: **PASS**
- system route auth: **BLOCKED (partial)**
- smoke: **FAIL/BLOCKED**
- documents live: **BLOCKED**
- costs live: **BLOCKED**
- production-ready: **PARTIAL**
- pilot-ready: **PARTIAL**

## Evidence summary

1. Production health endpoint
   - `GET https://aistroyka.ai/api/v1/health` -> HTTP 200, `ok=true`.
   - `buildStamp.sha7 = e509f53`, `buildStamp.buildTime = 2026-04-27 10:49`.
   - Current branch head in this workspace: `e89b4854` (deployed prod is behind local head).

2. System route protection
   - No key: HTTP 401.
   - Wrong key: HTTP 401.
   - Correct key path: blocked (`SYSTEM_API_KEY` missing in env).

3. Smoke
   - `scripts/smoke/pilot_launch.sh` against production:
     - health/config/cron tick passed,
     - auth-sensitive metrics failed with HTTP 401 due to missing auth credentials.

4. Supabase
   - `supabase projects list` blocked due to missing `SUPABASE_ACCESS_TOKEN`.
   - No `SUPABASE_PROJECT_REF` provided; link/migration list/dry-run not executable.

5. Documents/Costs live routes
   - Anonymous checks return 401 (protection works).
   - Authenticated tenant checks blocked (no user JWT/session in current environment).

## Remaining external blockers (exact)

1. Missing `SUPABASE_ACCESS_TOKEN`
2. Missing `SUPABASE_PROJECT_REF`
3. Missing `SYSTEM_API_KEY`
4. Missing valid tenant user auth material for smoke and documents/cost checks

## Exact next operator actions

```bash
# Supabase live verification
export SUPABASE_ACCESS_TOKEN="<supabase_pat>"
export SUPABASE_PROJECT_REF="<target_project_ref>"
supabase projects list
supabase link --project-ref "$SUPABASE_PROJECT_REF" --yes
supabase migration list
supabase db push --dry-run --linked

# System route positive-path auth verification
export SYSTEM_API_KEY="<real_system_api_key>"
curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: $SYSTEM_API_KEY"

# Authenticated production smoke
BASE_URL="https://aistroyka.ai" \
AUTH_HEADER="Bearer <tenant_user_jwt>" \
CRON_SECRET="<secret_if_required>" \
scripts/smoke/pilot_launch.sh

# Documents and costs live verification (read-only first)
export BASE_URL="https://aistroyka.ai"
export AUTH_HEADER="Bearer <tenant_manager_user_jwt>"
export PROJECT_ID="<existing_project_id>"
curl -i "$BASE_URL/api/v1/projects/$PROJECT_ID/documents" -H "Authorization: $AUTH_HEADER"
curl -i "$BASE_URL/api/v1/projects/$PROJECT_ID/costs" -H "Authorization: $AUTH_HEADER"
```

## Final statement

Local repository quality gates remain green, and production health endpoint is reachable.  
However, full closure of external P1 verification blockers is **not possible** in this session due to missing live credentials/secrets.  
Therefore:
- production-ready: **PARTIAL**
- pilot-ready: **PARTIAL**
