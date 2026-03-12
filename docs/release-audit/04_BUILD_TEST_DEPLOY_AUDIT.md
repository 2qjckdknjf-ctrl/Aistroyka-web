# Release Audit — Phase 4: Build / Test / Deploy Validation

**Generated:** Release Readiness Audit

---

## 1. Package Manager and Workspace

- **Root:** bun@1.2.15, workspaces: apps/web, packages/contracts, contracts-openapi, api-client.
- **Lockfile:** Present; `bun install` completed successfully.
- **Monorepo integrity:** TypeScript project references not explicitly audited; build order is build:contracts then build:web. Contracts are file dependency in apps/web.

---

## 2. Validation Results

 | Check | Command | Result | Notes |
 | --- | --- | --- | --- |
 | Install | `bun install` | PASS | Exit 0 |
 | Contracts build | `bun run build:contracts` | PASS | clean + tsc |
 | Web build | `bun run build:web` | PASS | Next.js 15.5.12, 127 pages |
 | CF/OpenNext build | `bun run cf:build` | PASS | worker.js produced, patches applied |
 | Unit tests | `bun run test` (Vitest) | PASS | 77 files, 364 tests |
 | Lint | Not run in this audit | — | `bun run lint` exists |
 | E2E | Not run | — | Playwright; requires env |

---

## 3. Production Build Scripts

- **Root:** `build` → build:contracts && build:web.
- **CF:** `cf:build` uses NEXT_PRIVATE_STANDALONE, fix-standalone, ensure-styled-jsx-dist, opennextjs-cloudflare build, patch-worker-bypass-api-middleware, patch-server-handler-require-middleware-manifest.
- **Deploy:** cf:deploy (dev/staging/prod); prod uses wrangler.deploy.toml and patched deploy.

---

## 4. Required Environment Variables

From config and code (names only; no values):

- **Supabase:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (or equivalent for getAdminClient).
- **Auth:** Session via Supabase; no separate JWT secret required for Next.
- **AI:** OPENAI_API_KEY (and/or ANTHROPIC_API_KEY, GEMINI/GOOGLE_AI for providers).
- **Cron:** CRON_SECRET when REQUIRE_CRON_SECRET=true.
- **Debug:** DEBUG_AUTH, DEBUG_DIAG, ENABLE_DIAG_ROUTES, ALLOW_DEBUG_HOSTS (production: leave DEBUG* unset or false; ALLOW_DEBUG_HOSTS restricts _debug/diag if used).
- **Billing:** Stripe webhook secret for /api/v1/billing/webhook.
- **Build:** NODE_ENV, NEXT_PUBLIC_* as needed.

---

## 5. Failures Recorded

None. All run commands succeeded.

---

## 6. Logs

- **Build:** reports/release-audit/build-validation.log
- **Tests:** reports/release-audit/test-validation.log (tee from `bun run test`)

---

## 7. iOS / Android

- **iOS:** Xcode projects; not built in this audit (no mac build run). Structure present: AiStroykaWorker, WorkerLite.
- **Android:** No android directory in repo; scripts reference mobile smoke.

---

## 8. Severity and Blockers

- **Blockers:** None from build/test.
- **Non-blocker:** E2E and staging/prod smoke not run in this audit (CONFIG-DEPENDENT / REQUIRES LIVE ENV).
