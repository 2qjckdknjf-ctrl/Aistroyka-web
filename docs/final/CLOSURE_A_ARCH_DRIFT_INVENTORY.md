# Closure Sprint A — Architecture drift inventory

**Project:** Aistroyka monorepo  
**Scope:** Workstream B (+ Workstream D surface for documents)  
**Method:** Tree listing, path comparison, doc cross-references  
**Date:** 2026-03-23  

---

## 1. Root vs `apps/web` application boundary

| Artifact | Root repo | `apps/web` | Notes |
|----------|-----------|------------|--------|
| **Next.js app** | — | `apps/web/app`, `apps/web/next.config.*` | **Canonical** production app per CI (`cf:build` cwd `apps/web`) |
| **`middleware.ts`** | [`middleware.ts`](../../middleware.ts) — simple session + protected prefixes, **no i18n** | [`apps/web/middleware.ts`](../../apps/web/middleware.ts) — `next-intl`, security headers, lite allow-list, entry routing | **Active** = `apps/web` for deployed web. Root file is **legacy / unused** when build root is `apps/web` (see [`docs/redirect-loop-fix-report.md`](../redirect-loop-fix-report.md)). |
| **`lib/`** | 11 files: `env`, `storage`, `rpc`, `types`, `app-url`, `supabase/*` | Hundreds of modules: `domain/`, `platform/`, `tenant/`, etc. | Root `lib/` = **legacy shim**; app imports use `@/lib/...` resolved from `apps/web`. |
| **`components/`** | `Nav.tsx`, `NavLogout.tsx` | Full component tree under `apps/web/components` | Root components **orphaned** relative to App Router pages in `apps/web`. |

---

## 2. API surface shape

| Layer | Location | Comment |
|-------|----------|---------|
| **Versioned API** | `apps/web/app/api/v1/**` | Primary REST-style surface for product features |
| **Legacy / misc** | `apps/web/app/api/contact`, `invite`, etc. | Not under `/v1`; middleware and docs sometimes treat `/api/v1` specially (lite allow-list) |
| **Admin** | `apps/web/app/api/v1/admin/**` | Leads, ops, billing pilots, etc. |

**Drift risk:** New endpoints should default to **`/api/v1/...`** unless there is a deliberate public exception (e.g. contact).

---

## 3. Supabase client duplication

| Path | Role |
|------|------|
| `lib/supabase/*.ts` (root) | Legacy copies alongside root `lib` |
| `apps/web/lib/supabase/*.ts` | **Canonical** for server, admin, middleware used by routes |

**Remediation:** Do not add features to root `lib/supabase`; migrate consumers if any exist outside `apps/web` (none found via `@/lib` in `apps/web` — all app-local).

---

## 4. Package manager / scripts drift

| Observation | Detail |
|-------------|--------|
| **Declared** | `packageManager: bun@1.2.15` at root |
| **CI prod** | `bun install --frozen-lockfile`, `bun run cf:build` |
| **Vercel** | `vercel.json` uses **npm** for install/build from root |
| **Local parity** | Root `lint`/`test` use `npm run --prefix apps/web` (Phase 0 note) |

**Risk:** Developers or CI paths that mix bun/npm without reading scripts can see inconsistent lockfile behavior. **Mitigation:** Document preferred path in README / AGENTS (already partially there).

---

## 5. Documentation vs code (spot check)

| Topic | Doc signal | Code signal |
|-------|------------|-------------|
| Domain canonicalization | AGENTS.md: Vercel Domains only, not middleware | `apps/web/middleware.ts` comment aligns |
| Deploy target | Phase 0 audit: CF Actions = prod automation | `deploy-cloudflare-prod.yml` confirms |
| Vercel root directory | AGENTS.md: `apps/web` | `vercel.json` under `apps/web` with `cd ../..` |

No contradiction found in this spot check; remaining risk is **stale** docs outside `docs/final/` and `AGENTS.md`.

---

## 6. Workstream D — Documents / approvals (inventory, honest partial state)

**Backend (representative):**

- [`apps/web/lib/domain/documents/document.service.ts`](../../apps/web/lib/domain/documents/document.service.ts) — core document operations
- [`apps/web/lib/domain/documents/document.policy.ts`](../../apps/web/lib/domain/documents/document.policy.ts) — access rules
- [`apps/web/lib/domain/documents/document-decision.service.ts`](../../apps/web/lib/domain/documents/document-decision.service.ts) — owner decision path
- API: `documents/[documentId]/route.ts`, `approval-history`, `decision`

**UI (from app tree):**

- Dashboard: `approvals`, project `ProjectDocumentsPanel`, `DocumentApprovalHistory`, etc.

**Partial / in-flight (git snapshot context):**

- Migrations and routes for `document_decision`, manager notifications, project owner role suggest **active evolution** of the workflow. Treat **manager documents UX** as **usable but not frozen** until a dedicated QA pass signs off.

---

## 7. Канон импортов (`apps/web`)

| Правило | Детали |
|--------|--------|
| Алиас `@/*` | В `apps/web/tsconfig.json` указывает на **корень `apps/web`**, не на репозиторий. |
| Код продукта | Импорты вида `@/lib/...`, `@/components/...` — всегда из дерева **`apps/web`**. |
| Корневой `lib/` | Отдельное **legacy**-дерево; новые фичи веб-приложения сюда не кладём. |
| Относительные пути | В `apps/web` **не найдено** импортов вида `../../../lib/...` в сторону корневого `lib/` (проверка grep по `*.ts` / `*.tsx`). |

Указатель для контрибьюторов: [`lib/README.md`](../../lib/README.md).

---

## Verdict (inventory only)

Drift is **localized and explainable**: root `lib`/`middleware`/`components` are **legacy shadows** of the real app in `apps/web`. API **versioning** is inconsistent for a few public routes. **No giant unknown** — next step is **minimal remediation** (docs + optional archive), not rewrite.
