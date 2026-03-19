# B3 — Boundary alignment summary — AISTROYKA

**Date:** 2026-03-18

---

## 1. Docs updated

- **Env governance:**  
  - `docs/architecture/CORE_B2_2_ENV_GOVERNANCE_AUDIT.md` — now describes the truthful env rule (canonical `lib/config` + allowed exceptions) and no longer claims exclusive `process.env` usage.  
  - `docs/release-hardening/ENVIRONMENT_READINESS.md` — softened “no ad-hoc process.env” to “prefer `@/lib/config`; only limited categories may read `process.env` directly; new business logic should use helpers.”  
  - `docs/release-audit/02_ARCHITECTURE_AUDIT.md` — updated config bullet to reflect B2.2 env governance.\n- **Architecture drift:**  
  - `docs/architecture/CORE_B1_ARCHITECTURE_DRIFT_AUDIT.md` — DRIFT-004 now marked as partially closed (severity lowered; wording updated to point at B2.2 audit) and table entry for `lib/config` updated to describe its real role.\n- **Boundaries and SDK/Lib roles (B3):**  
  - `docs/architecture/CORE_B3_BOUNDARY_INVENTORY.md` — inventories `packages/api-client`, root `lib/`, and WorkerLite naming with evidence and recommended actions.  
  - `docs/architecture/CORE_B3_API_CLIENT_DECISION.md` — records api-client as **PARTIAL** (SDK-only, not used by app) and kept.  
  - `docs/architecture/CORE_B3_LIB_BOUNDARY_DECISION.md` — documents `apps/web/lib` as canonical and root `lib/` as legacy duplicate.  
  - `docs/architecture/CORE_B3_WORKER_NAMING_CLEANUP.md` — clarifies that WorkerLite is a doc-only legacy name with no current code references.

---

## 2. Old misleading statements removed

- Removed or reworded strict claims such as:\n  - “No file outside lib/config should use process.env for app config.”\n  - “No raw process.env for app config outside lib/config.”\n- Replaced with language that:\n  - Describes `lib/config` as canonical **declaration/validation** for env;  
  - Explicitly lists exception categories;  
  - Emphasizes that new feature code should route env access through helpers rather than adding new ad-hoc reads.

---

## 3. Remaining doc tails

- Docs that reference `packages/api-client` continue to do so, now with the understanding (from B3 docs) that it is **SDK-focused**, not part of the app build.  
- WorkerLite docs remain as historical/operational context, with AGENTS.md already steering new work away from WorkerLite as a primary name.  
- Future phases (B4+) may further slim or archive legacy docs, but for B3 the primary requirement — **truthful, non-contradictory boundaries** — is met.\n*** End Patch
