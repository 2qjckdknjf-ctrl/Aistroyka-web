# B5 — Repo truth validation — Aistroyka

**Date:** 2026-03-16  
**Method:** Directory checks + cross-check vs root `package.json` + spot paths.

---

## A. Env governance

- **`apps/web/lib/config/index.ts`** exists and documents B2.2 model.  
- **Truth:** Many `process.env` reads remain outside `lib/config` per B2.2 inventory — **documented**, not hidden.  
- **Contradiction:** None between code comments and B2.2 audit.

---

## B. Boundary truth

| Topic | Repo truth | Doc truth |
|-------|------------|-----------|
| **api-client** | Not in root `workspaces`; `grep` in `apps/web/**/*.ts` → **0** imports of `@aistroyka/api-client`. | B3/B4/SYSTEM_REPOSITORY_MAP say optional SDK, not web runtime. **Align.** |
| **Root `lib/`** | Directory **exists** at repo root (`lib/`). | B3: legacy duplicate, not canonical for web app. **Align.** |
| **WorkerLite** | No `ios/WorkerLite` tree in repo. | B3/B4: legacy/archival. **Align.** |

---

## C. Naming truth

- **Canonical** per B4: Aistroyka, AiStroykaManager, AiStroykaWorker.  
- **AGENTS.md** matches.  
- Archive docs still use Worker Lite / AISTROYKA — **expected**, not treated as active product policy in authoritative docs.

---

## D. Repo structure vs SYSTEM_REPOSITORY_MAP

| Map claim | Actual repo (spot check) |
|-----------|---------------------------|
| `apps/web/` primary app | **Yes.** |
| `packages/api-client`, contracts, contracts-openapi | **Yes.** |
| `android/`, `ios/` | **Yes.** |
| Root `lib/` | **Yes** (legacy). |
| No root `app/` duplicate | **Yes** — no `app/` at root. |
| No root `engine/Aistroyk/` | **Yes** — path **absent**. |

**Gap:** Multiple **non-map** docs (`docs/status/TECHNICAL_DOSSIER.md`, `ENTERPRISE_*`, `INFRASTRUCTURE_STATE.md`, `AI_SIGNATURE_*`, etc.) still describe **`engine/Aistroyk/`** as if current. That path is **not** in this tree (migrations live under **`apps/web/supabase/migrations/`**).  

**Classification:** **Stale historical / fork snapshot documentation** — not authoritative for current monorepo layout. **Does not block** Closure Sprint close; tracked as **P1 doc hygiene** (update or archive banners).

---

## E. Summary

| Area | Align? |
|------|--------|
| Env model vs B2.2 | Yes |
| api-client / root lib | Yes |
| WorkerLite vs tree | Yes |
| SYSTEM_REPOSITORY_MAP vs disk | Yes |
| Status/enterprise docs vs disk | **Partial** — engine paths stale |
