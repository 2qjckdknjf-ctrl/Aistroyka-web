# Web Step-by-Step Plan — Aistroyka (apps/web)

**Horizon:** 7 days (P0 + selected P1) and 30 days (full P1/P2).  
**Rule:** No product logic changes; DX, quality, performance, and safety only.

---

## 7-day plan

### Day 1–2: P0 — Typecheck and CI

| # | Goal | What to do | Files | Definition of done | Regression |
|---|------|------------|-------|--------------------|------------|
| 1 | Fix typecheck so `tsc --noEmit` passes | Either: (a) Exclude `**/*.test.ts` from tsconfig used by `tsc --noEmit`, or (b) Fix Vitest typings for `vi.stubEnv(key, value)` (e.g. add declaration or use correct overload). Prefer (b) if Vitest 4 documents two-arg stubEnv. | `tsconfig.json` or `tsconfig.build.json` (exclude tests); or `app/api/health/route.test.ts`, `app/api/analysis/process/route.test.ts` | `npx tsc --noEmit` exits 0 | Run `npm run test` and `npm run build` |
| 2 | CI typecheck aligned with local | Ensure CI runs the same typecheck that passes locally (e.g. `tsc --noEmit` with same include/exclude, or `next build` which runs its own check). | `.github/workflows/ci.yml` (or equivalent) | CI green including typecheck | Push and verify workflow |

### Day 3: P1 — Lint/format baseline

| # | Goal | What to do | Files | Definition of done | Regression |
|---|------|------------|-------|--------------------|------------|
| 3 | Prettier + format check | Add Prettier, config (e.g. single quotes, trailing comma), format all TS/TSX/JSON; add `format` and `format:check` scripts; run format:check in CI. | `package.json`, `.prettierrc` (or .json), `.prettierignore`; optionally `.github/workflows/ci.yml` | `npm run format:check` passes; CI runs it | `npm run lint` and `npm run build` still pass |

### Day 4: P1 — API error shape

| # | Goal | What to do | Files | Definition of done | Regression |
|---|------|------------|-------|--------------------|------------|
| 4 | Use shared error shape on API routes | Introduce or use `lib/api/errorShape.ts`; have each API route return a consistent JSON shape on 4xx/5xx (e.g. `{ error: string, code?: string }`). Update only response shape, not business logic. | `lib/api/errorShape.ts`, `app/api/health/route.ts`, `app/api/projects/route.ts`, `app/api/ai/analyze-image/route.ts`, `app/api/analysis/process/route.ts`, upload/trigger/tenant routes | All API error responses conform to one shape; clients can rely on it | Manual smoke: call one route with invalid input; run API tests |

### Day 5: P1 — Project page query parallelization

| # | Goal | What to do | Files | Definition of done | Regression |
|---|------|------------|-------|--------------------|------------|
| 5 | Parallelize independent Supabase queries on project [id] | In `app/[locale]/(dashboard)/projects/[id]/page.tsx`, group independent reads (e.g. project by id; media by project_id; then jobs by media_ids; then analyses by job_ids) and use Promise.all where order is not required. Keep same data shape and RLS. | `app/[locale]/(dashboard)/projects/[id]/page.tsx` | No change in UI/output; fewer sequential round-trips; same or better TTFB | Load project page; verify data and no console errors; run build |

### Day 6–7: P1 — E2E smoke skeleton

| # | Goal | What to do | Files | Definition of done | Regression |
|---|------|------------|-------|--------------------|------------|
| 6 | Add Playwright and one smoke test | Install Playwright; add config (e.g. baseURL, one project); one test: open base URL, expect redirect to locale or login, then (if env allows) login and open dashboard. No hardcoded secrets; use env or skip when no auth. | `package.json`, `playwright.config.ts`, `e2e/smoke.spec.ts` (or similar) | `npx playwright test` runs and at least one smoke passes or is skipped with reason | Unit tests and build unchanged |

---

## 30-day plan (additional)

### P1 — Env and tooling

| # | Goal | What to do | Files | Definition of done | Regression |
|---|------|------------|-------|--------------------|------------|
| 7 | Server env schema (optional) | Document or validate server-only env (OPENAI_API_KEY, AI_ANALYSIS_URL, SUPABASE_SERVICE_ROLE_KEY, etc.) at startup or in one place (e.g. lib/env.ts or a small schema). No secrets in repo. | `lib/env.ts` or new `lib/env.server.ts` | Server routes fail fast with clear message if required server env missing | Run build and one API call |
| 8 | Unused exports / dead code | Add ESLint rule or ts-prune to flag unused exports; fix or suppress in a few passes. | `.eslintrc.json` or new script; selected source files | No new unused exports in critical paths; CI optional | Build and test |

### P1 — Performance

| # | Goal | What to do | Files | Definition of done | Regression |
|---|------|------------|-------|--------------------|------------|
| 9 | Dynamic import for heavy admin blocks | Use `next/dynamic` for one or two heavy admin components (e.g. governance or trust) to reduce initial JS for admin routes. | `app/[locale]/(dashboard)/admin/**/page.tsx` and heavy components | Admin route First Load JS reduced; behavior unchanged | Open admin pages and run tests |
| 10 | next/image for media preview (if added) | When adding image preview for media, use `next/image` and add storage domain to next.config images.domains if needed. | `next.config.js`, e.g. `MediaAnalysisRow.tsx` or new preview component | No raw `<img>` for user content; sized/optimized | Visual check and build |

### P2 — Security and hardening

| # | Goal | What to do | Files | Definition of done | Regression |
|---|------|------------|-------|--------------------|------------|
| 11 | Document service role key usage | Add a short comment or doc: SUPABASE_SERVICE_ROLE_KEY is server-only; never in client or NEXT_PUBLIC_*. | `lib/supabase/admin.ts` or `docs/security.md` | Reviewer can confirm policy | N/A |
| 12 | CSP tightening (optional) | If feasible, reduce 'unsafe-inline' for scripts (e.g. nonces or hashes). May require Next/third-party audit. | `middleware.ts` SECURITY_HEADERS | CSP unchanged or stricter; no new console errors | Full app smoke |

### P2 — Testing and DX

| # | Goal | What to do | Files | Definition of done | Regression |
|---|------|------------|-------|--------------------|------------|
| 13 | E2E: open project and trigger AI flow | Add e2e: after login, open projects list, open one project, (optional) trigger analysis and wait for status. Use test tenant/project or skip if not configured. | `e2e/*.spec.ts` | Playwright test passes or skips with reason | Unit tests and build |
| 14 | API route tests for error paths | Add tests for 401/403/4xx and 5xx paths where missing (e.g. analyze-image, upload). | `app/api/**/route.test.ts` | Coverage of main error branches | `npm run test` |

---

## Priority summary

- **P0 (must):** Typecheck green (1), CI aligned (2).
- **P1 (should):** Prettier (3), API error shape (4), project page parallelization (5), E2E smoke (6); env schema (7), dead code (8); dynamic admin (9), next/image when adding preview (10).
- **P2 (nice):** Service role doc (11), CSP (12); E2E AI flow (13), API error-path tests (14).

**Regression check each step:** Run `npm run lint`, `npm run test`, `npm run build` unless the step only touches docs or config outside the app.
