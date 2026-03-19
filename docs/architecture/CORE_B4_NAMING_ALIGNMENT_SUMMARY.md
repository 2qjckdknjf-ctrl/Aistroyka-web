# B4 — Naming alignment summary — Aistroyka

**Date:** 2026-03-16

---

## Docs changed (this pass)

| File | Change |
|------|--------|
| `docs/architecture/CORE_B4_*.md` | Inventory, canonical, mobile, package, this summary, validation, post-audit refreshed. |
| `docs/SYSTEM_REPOSITORY_MAP.md` | **SAFE:** Directory tree aligned to current repo (removed phantom `app/`, `engine/Aistroyk`); module table kept; §7 gaps updated. |
| `docs/release-audit/03_FEATURE_READINESS_MATRIX.md` | Manager vs worker rows fixed; AiStroykaManager / AiStroykaWorker canonical. |
| `docs/REPORT-PHASE2-SAAS-CORE.md`, `REPORT-PHASE5-SCALE-PLATFORM.md` | **Project:** Aistroyka (was AISTROYKA.AI). |
| `docs/ADR/014-project-membership-task-assignments.md` | “Worker Lite endpoints” → field-worker allow-listed API routes. |
| `docs/IOS_BUILD_WARNINGS_FIX_REPORT.md` | Legacy banner + title clarification. |
| `apps/web/lib/design/colors.ts`, `radius.ts` | Comment wording → Aistroyka design system. |
| `packages/api-client/package.json` | **description** for SDK / non-runtime truth. |

## Unchanged (already aligned)

- `AGENTS.md` — B4 naming block still points to `CORE_B4_CANONICAL_NAMING.md`.  
- `docs/release-hardening/ENVIRONMENT_READINESS.md` — B4 product note present.  
- `packages/api-client/README.md` — runtime disclaimer present.

---

## Canonical naming reinforced

- **Aistroyka** — product prose; **aistroyka.ai** — web origin.  
- **AiStroykaManager** / **AiStroykaWorker** — mobile.  
- **apps/web** — primary web codebase.

---

## Legacy downgraded

- **WorkerLite** — archival / historical in touched audit and iOS report.  
- **AISTROYKA.AI** — removed from two phase report headers.  
- **Stale repo map** — no longer implies duplicate root `app/` or `engine/Aistroyk`.

---

## Intentional exceptions

- Historical docs under `docs/worker-lite/`, phase-7 reports — Worker Lite titles retained as archive context.  
- npm `name` fields unchanged.  
- Compliance docs may still use “Aistroyka AI Platform”.
