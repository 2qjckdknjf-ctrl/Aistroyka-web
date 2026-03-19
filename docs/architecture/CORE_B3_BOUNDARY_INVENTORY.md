# B3 — Boundary inventory — AISTROYKA

**Date:** 2026-03-18  
**Scope:** packages/api-client, root `lib/`, WorkerLite naming.

---

## 1. `packages/api-client`

| Field | Value |
|-------|-------|
| Current state | Private package (`@aistroyka/api-client`) with `src/client.ts` (not inspected here), depends on `@aistroyka/contracts`. |
| Workspace wiring | Root `package.json` workspaces: `apps/web`, `packages/contracts`, `packages/contracts-openapi` **only** — `packages/api-client` is **not** in workspaces (build order, scripts) but does appear in `package-lock.json` and docs. |
| In-repo imports | `grep @aistroyka/api-client` → **only** in `packages/api-client/README.md` and architecture/docs; **no imports** from `apps/web` or root code. |
| Scripts/tests | No `scripts` in its `package.json`; no direct CI scripts referencing it. |
| Docs | Several docs describe it as the typed TS client and part of the SDK story (`REPORT-PHASE3-ENTERPRISE`, `ADR/018-openapi-sdk-pipeline.md`, `MOBILE-INTEGRATION-GUIDE.md`, `SYSTEM_REPOSITORY_MAP.md`, etc.). |
| Risk of cleanup | Removing the package would break the documented SDK story and any external tooling relying on this path, even though the web app does not consume it. |
| Recommended action | Treat as **documented but non-consumed SDK artifact**: keep the package, but make clear in docs that it is not wired into the web build and is intended for external consumers / future SDK consolidation. |
| Required now? | Clarify docs + repo map; no deletion in B3 (per constraints). |

---

## 2. Root `lib/` vs `apps/web/lib`

| Field | Value |
|-------|-------|
| Root `lib/` contents | `env.ts`, `storage.ts`, `rpc.ts`, `app-url.ts`, `types.ts`, `supabase/*` files. |
| apps/web/lib overlap | Very similar/parallel files exist under `apps/web/lib` (`env.ts` equivalent via `config`, `supabase/*`, `storage.ts`, `rpc.ts`, `app-url.ts`). |
| In-repo imports of root `lib` | `grep 'from \"lib/'` and `from '../lib'` etc → **no active imports** pointing at root `lib` from `apps/web` or other workspaces. All Supabase/storage/RPC imports use `@/lib/*` (app-local). |
| In-repo imports of apps/web/lib | `apps/web` consistently uses `@/lib/...` pointing into `apps/web/lib`. |
| Role today | Root `lib/` is effectively a **shadow copy** of early shared helpers, now superseded by `apps/web/lib`. It is not part of the web build and not referenced by packages. |
| Risk of cleanup | Deleting root `lib/` could break only if some unseen tooling references it by path (IDE snippets, unpublished scripts). In-repo code and package manifests show no usage. |
| Recommended action | Mark root `lib/` as **legacy duplicate** in docs; prefer `apps/web/lib` for product code. Actual deletion can be a follow-up once confirmed with owners (outside B3 constraints). |
| Required now? | Clarify boundary and update repo maps; keep files but treat as non-canonical. |

---

## 3. WorkerLite naming tails

| Field | Value |
|-------|-------|
| Search results | `grep 'WorkerLite\\|Worker Lite\\|worker-lite'` hits **only** in docs and AGENTS.md; no TS/Swift/Kotlin product code in this repo currently references WorkerLite symbols (iOS sources are archived / out-of-scope). |
| Types of references | Historical reports (`REPORT-PHASE7-*`), mobile rebuild docs (`mobile-rebuild/*`), worker-lite subdir docs, rename mapping tables, release blockers describing the incomplete rename, AGENTS.md preference bullet. |
| Active code identifiers | None in `apps/web/*`, `packages/*` TS; mobile code artifacts themselves are absent or archived (described in docs). |
| Product-facing names | Docs already state that WorkerLite is a legacy name and AiStroykaWorker is the primary product identity; bundle IDs and background session IDs may preserve `POTA.WorkerLite` / `workerlite` per docs. |
| Risk of cleanup | Aggressively stripping WorkerLite from docs could remove useful historical and operational context (e.g. buildability audits, rename checklists) and conflict with AGENTS.md guidance which already treats WorkerLite as deprecated but still referenced. |
| Recommended action | Keep WorkerLite docs as **historical/operational**; ensure they consistently frame WorkerLite as legacy / not primary. No code changes required in this repo for B3. |
| Required now? | No rename of runtime identifiers; only clarify in B3 summary that WorkerLite is doc-only and deprecated as a primary name. |\n*** End Patch
