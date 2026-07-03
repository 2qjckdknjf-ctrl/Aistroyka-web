# Validation Checklist — AISTROYKA

> Run the subset relevant to your change. All web checks are safe (no secrets beyond build-time `NEXT_PUBLIC_*`, no deploy).
> Mirrors the PR gate `.github/workflows/ci-check.yml`.

## Web

```bash
bun install --frozen-lockfile          # install
node scripts/ci/validate-npm-lock.cjs  # Vercel npm lock parity
bun run i18n:check                      # i18n parity (dashboard/activation scope)
bun run lint                            # ESLint
bunx --cwd apps/web tsc --noEmit        # typecheck
bun run test                            # contracts build + apps/web unit tests
bun run cf:build                        # OpenNext/Workers bundle (NO deploy)
```

- [ ] install OK
- [ ] npm-lock validation OK
- [ ] i18n OK (required if user-visible strings changed; update en/ru/es/it together)
- [ ] lint OK
- [ ] typecheck OK
- [ ] tests OK
- [ ] cf:build OK

> Notes: `cf:build` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`. **Never** run `bun run build` and `bun run cf:build` in parallel.

## Supabase (DB)

```bash
supabase migration list                 # if CLI installed (currently MISSING locally)
# Dry-run / diff before any apply
```

- [ ] migration list reviewed
- [ ] migration sanity (repo↔remote timestamp skew reconciled — non-destructive)
- [ ] dry-run / diff reviewed
- [ ] **apply ONLY with explicit owner approval** (never as part of routine validation)

> If Supabase CLI is unavailable, use MCP Supabase (`list_tables`, `get_advisors`) read-only; do not `apply_migration` without approval.

## Cloud / Deployment

- [ ] env check — required vars present (names in `CLOUD_DATABASE_DEPLOYMENT_AUDIT.md`); values not printed
- [ ] deployment workflow status reviewed (staging → prod chain), not triggered manually
- [ ] smoke check (post-deploy, operator/CI): `GET /api/v1/health` → `buildStamp.sha7` matches deployed SHA
- [ ] **No manual production deploy** without approval + the CI chain

## Mobile

```bash
# iOS (Xcode present locally)
ios/scripts/run-ios-uitest-smoke-local.sh
# Android (JDK 17 + Gradle wrapper present)
cd android && ./gradlew assembleDebug
```

- [ ] iOS build / UITest smoke (only if iOS touched)
- [ ] Android build (only if Android touched; verify SDK/platform 35)
- [ ] Known deferred scope respected (store uploads owner-gated; no store-live claims)

## Git

- [ ] `git status` clean of unintended changes (explicit staging only; no `git add .`)
- [ ] branch pushed to `origin`
- [ ] PR opened via protected path (non-author approval; no self-approve)
- [ ] handoff written + `STATUS.md` updated
