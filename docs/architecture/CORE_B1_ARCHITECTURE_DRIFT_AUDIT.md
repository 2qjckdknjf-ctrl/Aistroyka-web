# B1 — Architecture inventory & drift audit — AISTROYKA

**Date:** 2026-03-18  
**Method:** Repo inspection + targeted search (no refactors).  
**Prior doc:** `docs/ARCHITECTURE_STATE_ANALYSIS.md` (layer model); this audit extends with **package/workflow/API surface** drift.

---

## A. Current architecture map

### Top-level modules

| Module | What it actually owns |
|--------|------------------------|
| **`apps/web`** | Entire Next.js app: App Router UI (`app/[locale]`, `app/(public)`), **111+** API route handlers under `app/api`, `lib/*` (domain, platform, config, supabase, features), middleware, Cloudflare/OpenNext build. **Canonical product codebase.** |
| **`packages/contracts`** | Zod schemas / shared types consumed by API routes (`@aistroyka/contracts`). **Canonical API contract for validated handlers.** |
| **`packages/contracts-openapi`** | Listed in root `workspaces` in `package.json`. **No TypeScript import of `@aistroyka/contracts-openapi` found under repo** (grep: only package metadata). |
| **`packages/api-client`** | Standalone package with `file:../contracts`; **not** listed in root `workspaces`. **No app dependency** on `@aistroyka/api-client` found. |
| **`scripts/`** (root) | Release/smoke/validation: e.g. `scripts/smoke/pilot_launch.sh`, `scripts/release/*`, `scripts/validate-release-env.mjs`. **CI-facing scripts live here.** |
| **`android/`**, **`ios/`** | Mobile apps (out of scope for deep audit; not modified). |
| **`docs/`** | Large doc surface; `docs/ARCHITECTURE_STATE_ANALYSIS.md` describes intended layers. |

### Inside `apps/web/lib` (simplified)

| Area | Role |
|------|------|
| **`lib/config`** | Canonical env **declaration/validation**; direct `process.env` elsewhere allowed only in limited cases per `index.ts` (B2.2). |
| **`lib/domain/*`** | Domain services + repositories (projects, tasks, reports, upload-session, etc.). |
| **`lib/platform/*`** | Jobs, AI providers, billing, push, idempotency, flags, etc. |
| **`lib/supabase/*`** | Clients, middleware session, RPC helpers. |
| **`lib/features/*`**, **`lib/ai-brain/*`**, **`lib/engine/*`**, **`lib/cockpit/*`**, **`lib/intelligence/*`** | Feature/UI-adjacent and analytics/intelligence; overlaps with domain naming. |
| **`lib/api/*`** | Lite allow-list, cron auth, RPC catalog, error shapes. |
| **`audit_*` trees** | `audit_web_p1_artifacts`, `audit_web_p2_artifacts`, `audit_admin_ai_artifacts` — **excluded from `tsconfig.json`** (`exclude: audit_*`) but remain on disk. |

---

## B. Drift findings

### DRIFT-001 — `packages/api-client` is disconnected from the monorepo

| Field | Content |
|-------|---------|
| **Severity** | medium |
| **Evidence** | Root `package.json` workspaces = `apps/web`, `packages/contracts`, `packages/contracts-openapi` only. `packages/api-client/package.json` exists; grep for `@aistroyka/api-client` in `apps/web` and root deps: **no matches**. |
| **Why drift** | Duplicate/extra package with no declared workspace membership and no consumer → ambiguous ownership (“official client SDK?” vs dead). |
| **Safest correction** | **docs-only first:** mark as experimental/archive OR **code move:** add to workspaces + consume from web OR **delete** after explicit decision. |
| **Type** | boundary rule + optional delete/move |

---

### DRIFT-002 — `packages/contracts-openapi` is workspace-only on paper

| Field | Content |
|-------|---------|
| **Severity** | medium |
| **Evidence** | In workspaces; grep `@aistroyka/contracts-openapi` in `.ts/.tsx`: **no imports** outside package lockfiles. |
| **Why drift** | Competing “contract” artifact vs `@aistroyka/contracts` actually used everywhere. |
| **Safest correction** | **docs-only:** document generation pipeline OR wire into CI/docs OR remove from workspaces if unused. |
| **Type** | docs-only / boundary rule |

---

### DRIFT-003 — Dual public HTTP API surface (`/api/...` vs `/api/v1/...`)

| Field | Content |
|-------|---------|
| **Severity** | high |
| **Evidence** | `app/api/v1/projects/route.ts` re-exports `GET, POST` from `@/app/api/projects/route`. `app/api/projects/[id]/route.ts` documents “Prefer GET /api/v1/projects/[id]” and sets `Link` successor header. Clients mix paths: e.g. `lib/projects/useProject.ts` → `/api/projects/${id}`; dashboard code → `/api/v1/projects`. |
| **Why drift** | Two canonical URLs for same capability; increases client confusion, cache, and deprecation risk. |
| **Safest correction** | **docs-only short term:** API versioning policy; **code move:** migrate clients to `/api/v1` then deprecate legacy routes. |
| **Type** | docs-only → rename/boundary over time |

---

### DRIFT-004 — Env governance wording vs scattered `process.env` (partially closed in B2.2)

| Field | Content |
|-------|---------|
| **Severity** | was high → **medium** (rule aligned; scattered reads remain intentional where documented) |
| **Evidence** | Many `process.env` reads still live outside `lib/config` (middleware, providers, domain flags). **B2.2:** `lib/config/index.ts` now states the truthful model (canonical declaration + allowed exceptions + preference for new code). See `CORE_B2_2_ENV_GOVERNANCE_AUDIT.md`. |
| **Why it mattered** | Old comment claimed exclusive `lib/config` access, which was false. |
| **Remaining work** | Optional gradual funnel via `getServerConfig` / new helpers — not required for governance truthfulness. |
| **Type** | docs/comments (done); refactor optional |

---

### DRIFT-005 — `audit_*` artifact trees inside `apps/web`

| Field | Content |
|-------|---------|
| **Severity** | medium |
| **Evidence** | `apps/web/tsconfig.json` excludes `audit_*` and `audit_*/**` from compilation. Folders `audit_web_p1_artifacts`, `audit_web_p2_artifacts`, `audit_admin_ai_artifacts` exist under `apps/web`. |
| **Why drift** | Looks like product tree but is not part of the build; duplicates paths similar to real `app/` and `lib/`. |
| **Safest correction** | **docs-only:** label as archived snapshots OR **move** to `docs/` or `_archive/` OR **delete** after confirmation. |
| **Type** | docs-only / move / delete |

---

### DRIFT-006 — Competing smoke entrypoints

| Field | Content |
|-------|---------|
| **Severity** | low |
| **Evidence** | Root: `scripts/smoke/pilot_launch.sh` (used in CI per `docs/release/PHASE3_*`). `apps/web/package.json`: `smoke:staging`, `smoke:prod` → `./scripts/smoke-staging.sh`, `smoke-prod.sh` under `apps/web/scripts/`. Root `package.json`: `smoke:pilot` → root `pilot_launch.sh`. |
| **Why drift** | Operators must know which script is “truth” for gate vs local. |
| **Safest correction** | **docs-only:** single runbook pointer; optional **delete/merge** scripts later. |
| **Type** | docs-only |

---

### DRIFT-007 — Layer violations (routes / AI) already documented

| Field | Content |
|-------|---------|
| **Severity** | high (product quality) |
| **Evidence** | `docs/ARCHITECTURE_STATE_ANALYSIS.md` §3: `sync/bootstrap` direct DB in route; `ai/analyze-image` bypasses provider router + governance. |
| **Why drift** | Same codebase; duplicate documentation risk if ignored. |
| **Safest correction** | **boundary rule + code move** in B2+ (not B1). |
| **Type** | code move (future) |

---

### DRIFT-008 — Overlapping “intelligence” / naming in `lib`

| Field | Content |
|-------|---------|
| **Severity** | medium |
| **Evidence** | Coexistence of `lib/ai-brain/`, `lib/engine/`, `lib/intelligence/`, `lib/features/ai/`, `lib/platform/ai/` — all AI-related; boundaries not obvious from names alone. |
| **Why drift** | New contributors cannot tell which layer owns a change. |
| **Safest correction** | **docs-only:** ownership matrix; **rename/move** only after B2 plan. |
| **Type** | docs-only → rename later |

---

## C. Canonical ownership proposal

| Area | Source of truth |
|------|-----------------|
| **HTTP API contracts (schemas)** | `packages/contracts` + route handlers under `app/api/v1/*` (prefer v1 for new work). |
| **Business rules + persistence** | `lib/domain/*` + `lib/platform/*` (platform = cross-cutting infra). |
| **Auth/session** | `lib/supabase/*` + tenant helpers used by routes. |
| **Env contract documentation** | `docs/ENVIRONMENT-VARIABLES.md` + `lib/config/release-env.ts` + `scripts/validate-release-env.mjs`. |
| **CI release smoke** | `scripts/smoke/pilot_launch.sh` + `.github/workflows/pilot-smoke.yml`. |
| **Architecture layering narrative** | `docs/ARCHITECTURE_STATE_ANALYSIS.md` until superseded by this audit + B2. |

---

## D. No-action items (do not change in B1/B2 without explicit decision)

- **Do not delete** `packages/api-client` or `packages/contracts-openapi` until owners confirm no external consumers or planned SDK work.
- **Do not mass-migrate** `/api/projects` → `/api/v1/projects` without client inventory (mobile may depend on paths).
- **Do not remove** `audit_*` folders without confirming no reference in audits/legal retention.
- **Android/iOS** paths: inventory only; no moves.

---

## E. Validation notes

- **Unused `@aistroyka/api-client`:** verified via repo-wide grep in `*.ts,*.tsx,*.json` (no app imports).
- **Unused `@aistroyka/contracts-openapi` in app code:** verified via grep (no TS imports).
- **Dual API:** verified via `app/api/v1/projects/route.ts` re-export and client `fetch` paths.
- **process.env outside config:** file list from grep under `apps/web/lib/**/*.ts` (non-exhaustive count; sufficient to disprove strict rule).

**Uncertainty:** External repos or unpublished packages may depend on `api-client`; this audit only covers **this** repo.
