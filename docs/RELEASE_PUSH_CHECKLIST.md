# Release push checklist (phase5-2-1)

## Stage 0 — Snapshot (diagnostics)

```
## git status -sb
## release/vercel-prod-hardening-2026-03-05
 M .cursor/settings.json
 M .gitignore
 M apps/web/... (many)
?? .github/workflows/update-lockfile-linux.yml
?? apps/web/app/.../DashboardOpsOverviewClient.tsx
?? ... (untracked: admin, cockpit, api routes, tests, docs, audit_* dirs, engine/, ios/, bun.lock.bak)
```

```
## git remote -v
origin	git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git (fetch)
origin	git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git (push)
```

```
## git log --oneline --decorate -n 30
667212dd (HEAD -> release/vercel-prod-hardening-2026-03-05, origin/release/vercel-prod-hardening-2026-03-05) docs(ops): add lockfile frozen / cache notes to final report
5ae6f882 chore(deps): refresh lockfile for bun install --frozen-lockfile in CI/Cloudflare
... (see git log)
2dadfeda chore(repo): ignore derived and heavy artifacts
```

```
## git diff --stat origin/main..HEAD (summary)
662 files changed, 43939 insertions(+), 15329 deletions(-)
```

```
## du -sh .  &&  git ls-files | wc -l
2.0G    .
1087
```

**Risks:** Resolved: placeholders in env examples; zips and .cursor removed from index; report-list tests aligned; project-scoped.repository + routes added for build.

---

## Stage 1 — Secrets

- rg scan: only env **names** and test stubs (fake PEM); no literal API keys or JWTs in source.
- **Action:** Replace real Supabase anon key in apps/web/.env.staging.example, .env.production.example, .env.local.example with placeholders.
- .env* tracked: only *.example (templates); .gitignore has .env, .env.local, etc. OK.

---

## Stage 2 — Hygiene

- Remove from index: phase0-stabilization-archive.zip, apps/web/archive_web_*.zip, .cursor/settings.json.
- .gitignore already: .cursor/, TestLogs/, **/DerivedData/, **/SourcePackages/, ios/build/, exports/, audit_artifacts/, reports/, *.zip, etc.
- Commit: chore(repo): cleanup ignored artifacts and harden gitignore

---

## Stage 5 — Quality gates

- cd apps/web && npm test -- --run  → **pass** (66 files, 312 tests)
- npm run cf:build → **pass**

---

## Env vars required (no values in repo)

- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL
- Server-only: SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, AI_ANALYSIS_URL, Stripe, FCM_*

---

## Reproduce build locally

```bash
cd /Users/alex/Projects/AISTROYKA
bun install --frozen-lockfile
cd apps/web
npm test -- --run
npm run cf:build
```

---

## Release hygiene pass 2 (append)

### 1) Диагностика

```
## git status -sb
## release/phase5-2-1...origin/release/phase5-2-1
 M docs/REPORT-DEPLOY-ENTERPRISE-FINAL-20260305.md
 M docs/REPORT-PHASE4-1-MOBILE-HARDENING.md
 M docs/runbooks/MOBILE_SYNC.md
 M docs/runbooks/MOBILE_UPLOADS.md
 M docs/runbooks/PUSH_DELIVERY.md
?? audit_memory_v1_artifacts/
?? audit_p2_1_artifacts/
?? audit_web_artifacts/
?? audit_web_integration/
?? audit_web_p0_artifacts/
?? bun.lock.bak
?? engine/
?? ios/
```

```
## git clean -ndX (would remove ignored)
Would remove .DS_Store, .cursor/, .next/, node_modules/, apps/web/.next/, .open-next/,
apps/web/lib/domain/reports/report-list.repository.test.ts, archive_*.zip, exports/, etc.
```

```
## git clean -nd (would remove untracked)
audit_*/, bun.lock.bak, engine/Aistroyk/dist/, engine/Aistroyk/supabase/, ios/
```
