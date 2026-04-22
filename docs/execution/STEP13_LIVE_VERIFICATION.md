# STEP13 LIVE VERIFICATION

## Validation Executed

1. `bun run build` => PASS
2. `bun run test` => PASS
3. Supabase MCP:
   - `list_migrations` includes `20260307500000_project_cost_items`
   - `list_tables` includes `public.project_cost_items` (RLS enabled)
   - SQL existence check confirms table presence
4. Authenticated runtime execution with smoke owner account:
   - `GET https://staging.aistroyka.ai/api/v1/projects` => `200` (5 projects)
   - `GET https://staging.aistroyka.ai/api/v1/projects/:id/costs` => `200`
   - `POST https://staging.aistroyka.ai/api/v1/projects/:id/costs` => `403 {"error":"Create failed"}` on all 5 projects
   - `GET https://www.aistroyka.ai/api/v1/projects` => `200` (0 projects for smoke tenant)
5. Control DB check under same authenticated identity:
   - direct Supabase insert into `project_cost_items` with the same user/token => SUCCESS
6. Direct staging deploy attempt:
   - `bun run cf:deploy:staging` => FAIL (missing `CLOUDFLARE_API_TOKEN`)
7. GitHub deploy path check:
   - `Deploy Cloudflare (Staging)` run `24777783096` => SUCCESS on SHA `36f3925fc9921d06448fbf5899cdd0af45f4446f`
   - post-deploy recheck: `POST /api/v1/projects/:id/costs` still `403 {"error":"Create failed"}`
   - repeated server deploy `24778999751` => SUCCESS; `POST /costs` still `403 {"error":"Create failed"}`
8. Repo-level bugfix + verification:
   - patched `cost.repository.create` to avoid `NaN` for omitted `actual_amount`
   - `bun run --cwd apps/web test lib/domain/costs` => PASS
   - `bun run --cwd apps/web build` => PASS

## Interpretation

- Route exists and is reachable in staging and production path.
- DB migration/table truth is present in connected live Supabase.
- Cost create failure on staging is now narrowed to runtime/deploy parity of shipped SHA; repo-level fix exists and is validated locally.

## Exact Operator Commands For Final Live Closure

1. Deploy updated runtime to staging with valid Cloudflare credentials:

```bash
CLOUDFLARE_API_TOKEN="<token>" \
CLOUDFLARE_ACCOUNT_ID="<account-id>" \
bun run cf:deploy:staging
```

2. Re-run authenticated runtime verification:

```bash
STEP13_VERIFY_BASE_URL="https://staging.aistroyka.ai" \
STEP13_VERIFY_EMAIL="<manager-email>" \
STEP13_VERIFY_PASSWORD="<manager-password>" \
NEXT_PUBLIC_SUPABASE_URL="<supabase-url>" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>" \
node apps/web/scripts/verify-cost-runtime.mjs
```

Expected result: successful GET + POST + PATCH responses and non-empty updated summary fields.

