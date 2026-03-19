# B3 — WorkerLite naming cleanup — AISTROYKA

**Date:** 2026-03-18

---

## 1. Findings

- **Search:** `grep 'WorkerLite\\|Worker Lite\\|worker-lite'` across repo.  
- **Locations:**  
  - `AGENTS.md` — preference bullet: “do not use WorkerLite as primary product name.”  
  - `docs/mobile-rebuild/*`, `docs/worker-lite/*`, `docs/REPORT-PHASE7-*`, `docs/IOS_RENAME_MAPPING_TABLE.md`, `docs/mobile-rebuild-phase2/*`, `docs/REPORT-PHASE7-0-WORKER-LITE.md`, multiple mobile/migration reports.  
  - `docs/release-audit/11_RELEASE_BLOCKERS.md` — cites iOS Worker Lite rename blockers.  
  - Various reports describing background uploads, bundle IDs (`POTA.WorkerLite`), and URLSession identifiers.\n- **No active code identifiers:**  
  - No `apps/web/*` TS/TSX files reference WorkerLite.  
  - iOS/Android source trees involved are either absent or archived; current repo state only contains docs about them.

---

## 2. Classification

- **Active code identifier:** None (in this repo’s current checked-in product code).  
- **Product-facing name:** Present **only in docs**, consistently framed as **legacy** (“Worker Lite pilot”, “WorkerLite as deprecated primary name”, etc.).  
- **Doc-only tail:** Yes — most references are in audits, migration reports, and rename mapping tables.  
- **Historical/archive reference:** Yes — worker-lite-specific docs are explicitly part of the historical record and mobile rebuild planning.

---

## 3. Changes in B3

- Left **all WorkerLite references in docs** intact, because they:  
  - Provide historical and operational context (e.g. buildability, rename audits).  
  - Already frame WorkerLite as **deprecated** / non-primary (see `AGENTS.md` and mobile-rebuild docs).  
- No runtime identifiers, bundle IDs, or config keys were renamed in this repo, to avoid breaking external build setups that may still rely on them (outside the current workspace).

---

## 4. Future cleanup notes (deferred)

- If/when the mobile repos are fully re-homed and WorkerLite is no longer present in any active Xcode/Android project, we can:  
  - Mark worker-lite docs more explicitly as **archive** (“legacy iOS Worker Lite”) while still keeping them for reference.  
  - Optionally add a short forward pointer from those docs to the finalized AiStroykaWorker structure.\n- For now, **WorkerLite** remains a **doc-only legacy name** with no code-level references in this repo.

---

## 5. Summary

- **Changed references:** None in code; docs already describe WorkerLite as legacy and deprecated as primary product name.  
- **Kept references:** All docs under `docs/worker-lite/`, `docs/mobile-*`, and related reports, plus `AGENTS.md` preference.  
- **Why remaining tails exist:** They encode historical architecture and operational knowledge and do not mislead current code work (web and env governance paths are clearly AiStroyka*-centric).\n*** End Patch
