# B4 — Naming inventory — Aistroyka

**Date:** 2026-03-16  
**Method:** Targeted grep across docs, metadata, comments, release matrices, ADRs; spot-check of `apps/web`, `packages/`, mobile paths.

---

## A. Product / platform naming

| Variant | Where found (examples) | Current role | Class | Recommended action | Safety |
|---------|-------------------------|--------------|-------|---------------------|--------|
| **Aistroyka** | `AGENTS.md`, i18n `messages/*.json`, public page titles, most user-facing copy | Written product name | **Canonical** | Prefer everywhere in new prose | SAFE |
| **Aistroyka AI Platform** | `docs/security/threat-model.md`, compliance-style titles | Formal doc title | Canonical variant | OK | SAFE |
| **AISTROYKA** | Repo folder, phase reports (`docs/mobile-rebuild/*`), closure docs, Supabase project label | Shorthand / historical headers | Repo / archive | Label as shorthand where needed; do not imply different product | SAFE (labels) |
| **AISTROYKA.AI** | `docs/REPORT-PHASE2-SAAS-CORE.md`, `REPORT-PHASE5-SCALE-PLATFORM.md` | Old report header | **Misleading vs canonical prose** | Normalize header to **Aistroyka** | SAFE |
| **AISTROYKA-WEB-CF-CHECK** | Root + `apps/web` `package.json` `name` | npm workspace id | **Not brand** | Document only; no rename without migration | DO NOT TOUCH NOW |
| **aistroyka.ai** | Env docs, wrangler, URLs | Production domain | Canonical | Keep | DO NOT TOUCH |
| **Aistroyka-web** | GitHub remote URLs in audit/closure docs | Remote repo name | External id | Keep in URLs | DO NOT TOUCH |
| **“AISTROYKA Design System”** (comment) | `apps/web/lib/design/colors.ts`, `radius.ts` | Dev comment | Mixed casing | Align comment to **Aistroyka** | SAFE |

---

## B. Worker naming

| Variant | Where | Role | Class | Action | Safety |
|---------|-------|------|-------|--------|--------|
| **AiStroykaWorker** | `ios/`, `android/`, AGENTS, shared contracts README | Current field-worker app | **Canonical** | Use in all new docs | SAFE |
| **AiStroyka Worker** | Display strings, schemes | User-visible | Canonical | OK | SAFE |
| **Worker Lite / WorkerLite** | `docs/worker-lite/*`, phase-7 reports, `IOS_RENAME_PRECHECK.md`, `IOS_BUILD_WARNINGS_FIX_REPORT.md`, ADR 014 phrase “Worker Lite endpoints” | Pilot / removed tree / history | **Legacy / historical** | Banner or reword; never imply current primary app | SAFE (docs) |
| **Worker app row conflated with Manager** | `docs/release-audit/03_FEATURE_READINESS_MATRIX.md` (was: Manager row cited Worker paths) | Audit table | **Misleading** | Fix evidence column to match app | SAFE |
| **worker-lite** (path) | `docs/worker-lite/` | Archive namespace | Historical | Keep; titles may say “legacy” | CAUTION |

---

## C. Manager naming

| Variant | Where | Role | Class | Action | Safety |
|---------|-------|------|-------|--------|--------|
| **AiStroykaManager** | ios/android paths, AGENTS | Current manager app | **Canonical** | Use in new docs | SAFE |
| **AiStroyka Manager** | Xcode, display | User-visible | Canonical | OK | SAFE |
| **ManagerLite** | Essentially absent as live product name | — | N/A | — | — |

---

## D. Web / dashboard naming

| Variant | Where | Role | Class | Action | Safety |
|---------|-------|------|-------|--------|--------|
| **apps/web** | Monorepo | Primary Next.js app | Canonical path | — | DO NOT TOUCH |
| **dashboard** | `(dashboard)/` routes | Authenticated UI | Canonical feature name | OK | SAFE |
| **cabinet** | Rare; RU market copy possible | Locale synonym | Acceptable in i18n | Per-locale only | CAUTION |
| **Phantom `app/`, `engine/Aistroyk` in map** | Was in `SYSTEM_REPOSITORY_MAP.md` §1, §7 | Stale tree | **Misleading** | Replace with current root layout | SAFE |

---

## E. Package / module naming

| Variant | Where | Role | Class | Action | Safety |
|---------|-------|------|-------|--------|--------|
| **@aistroyka/contracts** | Workspace | Shared types | Canonical internal | — | DO NOT TOUCH |
| **@aistroyka/contracts-openapi** | Workspace | OpenAPI build | Canonical | — | DO NOT TOUCH |
| **@aistroyka/api-client** | `packages/api-client` | Typed client package | Optional SDK; **not web runtime** | `description` + README truth | SAFE |
| **“SDK” vs “internal HTTP layer”** | Older docs | Wording | Misleading if conflated | Align to B4 package doc | SAFE |

---

## F. Summary

- **Largest safe wins:** stale repository map tree; release-audit mobile rows; phase-report headers **AISTROYKA.AI**; design-system comments.  
- **Do not rename without migration:** npm `name`, bundle IDs, env keys, Cloudflare worker names.  
- **Canonical mobile worker:** **AiStroykaWorker**; **WorkerLite** = historical / removed iOS tree only in archive docs.
