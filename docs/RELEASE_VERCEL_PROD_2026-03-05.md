# Release: Vercel production hardening — 2026-03-05

**Branch:** `release/vercel-prod-hardening-2026-03-05`  
**Target:** Vercel production deploy.  
**Timezone:** Europe/Madrid.

---

## What changed (high level)

- **Build pipeline:** Removed OpenNext from default path; root `build` runs `apps/web` → `next build`. Resolves peer dependency conflict (next@14 vs @opennextjs/cloudflare peer next@15/16).
- **Lockfile / install:** Clean `npm install` in root and apps/web; no ERESOLVE override. apps/web keeps committed `package-lock.json`.
- **TypeScript / lint:** Fixed `FinalizeResult` return type in upload-session.service; fixed `privateKeyPem` in FCM provider; root ESLint no longer extends Next (avoids plugin conflict).
- **Security:** `poweredByHeader: false` in next.config; `.env.example` expanded with NEXT_PUBLIC_APP_URL and server-only var names; SECURITY_NOTES.md documents Next.js advisory and upgrade path.
- **Docs:** DEPLOY_CLOUDFLARE_OPTIONAL.md (CF as optional path); release logs and notes in `docs/_release_2026-03-05/`.

---

## Commands used

| Step | Command | Log |
|------|---------|-----|
| Baseline | `node -v`, `npm -v`, `cat package.json`, `npm ls` | [00_baseline.txt](_release_2026-03-05/logs/00_baseline.txt) |
| Pipeline check | Manual check of build scripts + ESLint | [00_pipeline_check.txt](_release_2026-03-05/logs/00_pipeline_check.txt) |
| Vercel build | `npx vercel build` (from apps/web) | [01_vercel_build.txt](_release_2026-03-05/logs/01_vercel_build.txt) — requires `vercel login` + `vercel link` + `vercel pull --yes` |
| Install | Root: `rm -rf node_modules && npm install`; apps/web: same | [02_install_ci.txt](_release_2026-03-05/logs/02_install_ci.txt) |
| Dep tree | `npm ls` (root + apps/web) | [02_dep_tree.txt](_release_2026-03-05/logs/02_dep_tree.txt) |
| Typecheck | `cd apps/web && npx tsc --noEmit` | [03_typecheck.txt](_release_2026-03-05/logs/03_typecheck.txt) |
| Lint | `npm run lint` | [03_lint.txt](_release_2026-03-05/logs/03_lint.txt) |
| Tests | `npm test` | [03_tests.txt](_release_2026-03-05/logs/03_tests.txt) |
| Next build | `npm run build` | [03_next_build.txt](_release_2026-03-05/logs/03_next_build.txt) |
| Smoke | `npm run start` + curl GET /, /en/login, /api/health, /api/v1/health | [03_runtime_smoke.txt](_release_2026-03-05/logs/03_runtime_smoke.txt) |

---

## Vercel settings

- **Root Directory:** `apps/web`
- **Build Command:** `npm run build`
- **Output Directory:** default (`.next`)
- **Install Command:** default (`npm install` or `npm ci` if lockfile present)

---

## Env vars (names only)

- **Required (build + runtime):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`
- **Server-only / optional:** `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `AI_ANALYSIS_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, FCM vars (`FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`). See `apps/web/.env.example`.

---

## Proof summary

- **npm install / npm ls:** No invalid deps; no peer override required. See 02_install_ci.txt, 02_dep_tree.txt.
- **npx tsc --noEmit:** Pass. See 03_typecheck.txt.
- **npm run lint:** Pass. See 03_lint.txt.
- **npm test:** 60 files, 296 tests passed. See 03_tests.txt.
- **npm run build:** Next.js 14.2.18 build success. See 03_next_build.txt.
- **npx vercel build:** Not run in this release (no Vercel credentials/link). To get green: run `vercel login`, `vercel link`, `vercel pull --yes`, then `cd apps/web && npx vercel build`. Production deploy uses the same pipeline (`npm run build` in apps/web).
- **Smoke:** GET / 307, /en/login 200, /api/health 200, /api/v1/health 200. See 03_runtime_smoke.txt.

---

## Known issues / follow-ups

- **Next.js:** 14.2.18 has security advisories; recommend upgrading to 14.2.x patch (e.g. 14.2.25+) in a follow-up. See docs/_release_2026-03-05/SECURITY_NOTES.md.
- **Vercel:** Run `npx vercel build` locally after linking project to confirm full Vercel pipeline.
- **Cloudflare:** To use CF deploy, re-add @opennextjs/cloudflare and restore open-next config. See docs/DEPLOY_CLOUDFLARE_OPTIONAL.md.

---

## Artifacts

- **Logs:** `docs/_release_2026-03-05/logs/`
- **Notes:** `docs/_release_2026-03-05/SECURITY_NOTES.md`, `docs/_release_2026-03-05/PERF_NOTES.md`
- **Screens:** `docs/_release_2026-03-05/screens/` (empty; optional screenshots can be added)
