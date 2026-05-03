# Secret Exposure Remediation (2026-05-01)

## Scope

- Audit repository for leaked secrets in current files and git history.
- Apply non-destructive hardening in codebase.
- Provide operator runbook for full closure in Supabase/Cloudflare.

## What was verified

### 1) Working tree scan

- No live production secrets found in current tracked files.
- Matches were mostly:
  - test fixtures (`sk_test_xxx`, `whsec_xxx`, fake private-key blocks),
  - placeholders (`<...>`, `your-anon-key`),
  - environment variable names without values.

### 2) Git history scan

- Historical commits were found containing a concrete Supabase anon JWT value (public anon key format).
- Affected commits (contains historical occurrence):
  - `f5acb3af`
  - `fa37d145`
  - `b91bfde8`
  - `0a95c805`
  - `269aad2c`
  - `207b5558`
  - `4fa4dc1c`
- In current `HEAD`, that concrete value is not present anymore.

## Code hardening applied

### `scripts/bootstrap_local_supabase.sh`

- Redacted sensitive fields in `supabase start` output before printing to terminal.
- Removed printing of minted access token from final usage hints.
- Kept operational guidance but switched sensitive values to placeholders.

## Full closure actions (operator-required)

Because old commits may still be accessible from clones/forks/caches, full closure requires secret rotation even if current files are clean.

1. Rotate Supabase keys in Dashboard:
   - anon key
   - service_role key
2. Update runtime secrets in Cloudflare Worker environments:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - any dependent derived secrets if used
3. Redeploy staging + production.
4. Re-run smoke and health checks.
5. Verify old key material no longer works.

## Suggested operator command sequence

```bash
# 1) Rotate keys in Supabase Dashboard first.
# 2) Then update secrets in Cloudflare (from apps/web):
cd apps/web

# Example (interactive, values are not echoed by wrangler):
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY --env staging
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY --env production
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env staging
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production

# 3) Deploy
cd ../..
bun run cf:build

# deploy commands per existing runbook/workflow
```

## About history rewrite

- History rewrite is the only way to physically purge old values from git object history.
- It was **not executed** in this pass (safety and collaboration impact).
- If required, run a coordinated maintenance window with:
  - mirror clone backup,
  - `git filter-repo` replacement rules,
  - force-push all branches/tags,
  - teammate re-clone/rebase instructions.

## Ongoing guardrails

- Use only ephemeral shell exports or ignored local env files for secrets.
- Never print tokens/keys in scripts or docs.
- Run periodic scan:

```bash
./scripts/scan-secrets-history.sh
```
