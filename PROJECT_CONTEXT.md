# PROJECT_CONTEXT — AISTROYKA

> Master, **safe-to-share** context for any Cursor agent (desktop or cloud). Contains **no secrets**.
> If anything here conflicts with reality you observe, trust the live code/runtime and update this file.
> Last reviewed: 2026-06-30.

## 1. Project

- **Name:** AISTROYKA.
- **Purpose:** construction-management platform — web app + iOS + Android, with an AI/Copilot layer, serving contractors and (separately) customers/owners/stakeholders.
- **Authoritative roadmap:** `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md`. Work sequentially by roadmap phases.

## 2. Non-negotiable rules (read before any work)

1. **Customer-finance boundary:** customers/owners/stakeholders must NEVER see internal contractor financial state (costs, margin, profitability, internal budgets, cost overruns, subcontractor costs, internal AI finance risks). They may only see designed customer-facing commercial artifacts (estimates, approved proposals/changes, configured payment schedules, customer-dependent decisions).
2. **No secrets** committed or printed; never `git add .`.
3. **No destructive git** (force push, reset --hard, history rewrite); never push directly to `main` — use the protected PR path.
4. **No destructive DB** commands; no production deploy without explicit approval + the CI chain.
5. **No faking success** — no fake builds/metrics; back claims with evidence (`buildStamp`, smoke output, CI runs).
6. **Don't delete** files/branches without explicit necessity and the gated archival flow.
7. **Additive billing/account layer is gated** — keep production billing behavior identical; do not flip `ENTITLEMENT_RESOLUTION_SOURCE` to account-first until shadow/staging/production gates pass.

## 3. Tech stack

- **Web:** Next.js 15 (App Router), React 19, TypeScript, Tailwind, next-intl (en/ru/es/it). Lives in `apps/web`.
- **Runtime/deploy:** OpenNext → **Cloudflare Workers**. Vercel is preview/secondary only.
- **DB/Auth:** Supabase (Postgres + Auth + RLS). Migrations in `apps/web/supabase/migrations/`.
- **AI/Copilot:** in `apps/web` only (no repo Python backend). Live gate: `bash scripts/smoke/ai_live_provider.sh --require-live`.
- **iOS:** `ios/` — AiStroykaManager + AiStroykaWorker + Shared (SPM), Xcode projects with UITest targets. Primary mobile contour.
- **Android:** `android/` — Manager + Worker Compose scaffolds + shared (thinner than iOS).
- **Monorepo:** Bun 1.2.15 workspaces (`apps/web`, `packages/contracts`); shared libs in `packages/`.

## 4. Main surfaces

| Surface | Path / location | Notes |
|---|---|---|
| Public site + dashboard | `apps/web/app/[locale]/(public)` / `(dashboard)` | RBAC: `/dashboard` contractor ops, `/admin` company admin, `/owner` platform owner (metadata-only), `/portal` stakeholder portal. |
| API | `apps/web/app/api/` | `/api/v1/*` canonical. Don't change tenant/auth logic without necessity. |
| Supabase | `apps/web/supabase/` | Active project ref `vthfrxehrursfloevnlp` (eu-central-1). |
| Cloudflare | `apps/web/wrangler*.toml`, `apps/cloudflare-com-redirect` | Production runtime + `.com→.ai` redirect. |
| AI/Copilot | `apps/web` (AI routes/libs) | Architecture truth: `docs/ai/AUDIT_AI_RUNTIME_ARCHITECTURE_TRUTH.md`. |

## 5. Canonical branches

- `main` = production truth (protected; non-author approval + CI required).
- `release/*` = release candidates (`release/web-pilot-rc`, `release/mobile-pilot-rc`).
- New work: `ops/* | feature/* | fix/* | audit/*` — see `docs/ops/GIT_BRANCH_OPERATING_AUDIT.md`.

## 6. Deployment model

- Production chain: merge `main` → **Deploy Cloudflare (Staging)** → verify staging → **Deploy Cloudflare (Production)** via `workflow_run`.
- Verify deploy: `GET /api/v1/health` → `buildStamp.sha7` = first 7 chars of deployed SHA.
- Domains: prod `aistroyka.ai` / `www.aistroyka.ai`; staging `staging.aistroyka.ai`; `.com` = 301 redirect-only.
- PR gate: `.github/workflows/ci-check.yml`.

## 7. Database model summary

- `tenants` = operational RLS isolation boundary. Additive `accounts` layer above tenants (platform/contractor/client; project modes contractor-led/client-led).
- Billing: `account_subscriptions` (account source of truth) + dual-written `billing_customers`/`entitlements` (with `account_id`; `tenant_id` stays Stripe webhook anchor). Resolver `resolveEffectiveEntitlements` with `ENTITLEMENT_RESOLUTION_SOURCE` = legacy/shadow/account (drift in `entitlement_resolution_drift`).
- Stakeholders are NOT `account_members`; platform-owner client-data access via audited `platform_break_glass_grants`.
- RBAC/account/billing design docs under `docs/architecture/`.

## 8. Validation commands (safe, no secrets, no deploy)

```bash
bun install --frozen-lockfile
bun run i18n:check
bun run lint
bunx --cwd apps/web tsc --noEmit
bun run test
bun run cf:build            # needs NEXT_PUBLIC_* env; never run parallel with bun run build
```
Full reference: `docs/ops/VALIDATION_CHECKLIST.md`.

## 9. Current known status

See live `STATUS.md` (root) — single source of "what's happening right now".

## 10. Current risks

- **Branch/worktree sprawl** (194 local / 142 remote branches, 38 worktrees) — biggest obstacle to safe cloud-agent work. Mitigation: always trust `STATUS.md` for the active branch, never guess.
- Supabase CLI not installed locally (DB CLI ops blocked; MCP alternative exists).
- Migration repo↔remote timestamp skew (reconcile before CLI push/diff).

## 11. How a cloud agent should start work

1. Read this file, then `STATUS.md`, then the latest `docs/handoff/*`.
2. Read `docs/ops/CLOUD_AGENT_WORKFLOW.md` and follow it exactly.
3. Work only inside a scoped branch from `origin/main`; open a `docs/tasks/*` file from the template.
4. Run validation (`docs/ops/VALIDATION_CHECKLIST.md`); never deploy or apply DB migrations without explicit approval.
5. Write a `docs/handoff/*` file and update `STATUS.md` before ending.
