# B3 — Post-audit — AISTROYKA

**Date:** 2026-03-18

---

## 1. Drift closure status

### 1.1 `packages/api-client` drift

- **Status:** **PARTIAL**  
- **Reasoning:**  
  - Package remains present and documented as the TS SDK (`@aistroyka/api-client`).  
  - Not consumed by `apps/web` or other workspaces.  
  - B3 clarified its role as **SDK-side artifact**, not core app module; deletion is intentionally deferred.

### 1.2 Root `lib/` boundary drift

- **Status:** **PARTIAL**  
- **Reasoning:**  
  - Root `lib/` is now clearly documented as a **legacy duplicate** with no active app imports.  
  - `apps/web/lib` is explicitly canonical.  
  - Files in root `lib/` remain on disk for now to avoid surprising external tooling; potential future removal is documented.

### 1.3 WorkerLite naming tails

- **Status:** **FULL** (for this repo’s active product scope)  
- **Reasoning:**  
  - WorkerLite references exist only in docs and AGENTS.md; there are **no active code identifiers** in `apps/web` or packages.  
  - Docs already frame WorkerLite as a **legacy/archival** name, with AiStroykaWorker as primary.  
  - B3 confirms this and makes no conflicting claims.

### 1.4 Architecture boundary truthfulness

- **Status:** **PARTIAL → acceptable for next phase**  
- **Reasoning:**  
  - Env governance wording now matches reality (B2.2 + B3 updates).  
  - API surface (B2.1) has a clear canonical vs legacy story.  
  - SDK and root lib roles are clarified but not structurally removed.

---

## 2. Remaining items and priority

| Area | Status | Priority | Notes |
|------|--------|----------|-------|
| `packages/api-client` wiring | PARTIAL | P2 | Optional: add to workspaces or introduce clear publish pipeline if SDK becomes first-class. |
| Root `lib/` deletion/archive | PARTIAL | P2 | Safe to consider after confirming no external usage; currently non-canonical but harmless. |
| Env centralization beyond B2.2 | OPEN | P2 | Optional refactor to route more platform/domain env reads through config helpers. |

No P0/P1 boundary issues remain for the web app in this sprint.

---

## 3. B4 readiness decision

- **Is B3 closed enough to move to B4 naming normalization?** **YES**  
  - Obvious architecture-drift tails (API surface, env governance wording, unclear root lib/api-client roles, WorkerLite naming) are now:  
    - either explicitly clarified and documented, or  
    - intentionally scoped as lower-priority follow-ups with no direct impact on current web runtime.

---

## 4. Summary

- **What was cleaned:**  
  - Env governance rule alignment in code + docs.  
  - Canonical vs legacy boundaries for API, config, SDK/package, and lib structure.  
  - WorkerLite naming confirmed as doc-only legacy in this repo.  
- **What was kept:**  
  - `packages/api-client` and root `lib/` retained but clearly marked as non-canonical for the web app.  
  - WorkerLite docs preserved for historical/operational context.  
- **What remains open:**  
  - Deeper SDK/infrastructure decisions (api-client publishing, root lib removal) and optional env centralization — all P2 and suitable for future focused iterations.
