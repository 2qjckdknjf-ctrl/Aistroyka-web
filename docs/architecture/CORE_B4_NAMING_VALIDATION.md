# B4 — Naming validation — Aistroyka

**Date:** 2026-03-16

---

## Commands / searches run

```bash
# After edits: phase header drift
rg -l "AISTROYKA\.AI" docs

# Release matrix: Manager row must not cite Worker app paths
rg "Manager app.*AiStroykaWorker" docs/release-audit

# Stale map artifact removed from docs
rg "engine/Aistroyk" docs
```

**Results:**

| Search | Result |
|--------|--------|
| `AISTROYKA.AI` in docs | **No matches** (normalized in Phase 2/5 reports). |
| Manager row / AiStroykaWorker conflation | **No matches**. |
| `engine/Aistroyk` in `SYSTEM_REPOSITORY_MAP.md` | **Removed** (B4); map matches current root. |
| `engine/Aistroyk` elsewhere in `docs/` (e.g. `docs/status/*`, enterprise plans) | **Many matches** — historical or external snapshot paths; **not** present at repo root today. See `CORE_B5_REPO_TRUTH_VALIDATION.md`. |

Additional spot checks:

- `AGENTS.md` — Aistroyka, AiStroykaWorker/Manager, WorkerLite legacy.  
- `docs/SYSTEM_REPOSITORY_MAP.md` — current tree, api-client = optional SDK.  
- `packages/api-client/package.json` — description present.

---

## Typecheck / build

- **Not run** for B4: changes are markdown, two design comments, ADR, `package.json` description only.  
- Prior environment issues (e.g. `@swc/core` native bindings on some hosts) are **unrelated** to B4.

---

## Pass / fail

| Check | Result |
|-------|--------|
| Authoritative map matches repo layout | **PASS** |
| Release audit mobile naming | **PASS** |
| Misleading api-client = web runtime on touched paths | **PASS** |
| Full repo purge of Worker Lite / AISTROYKA caps | **Not attempted** |

---

## Unrelated blockers

- None for B4 doc-only scope.

---

## Final consistency status

Authoritative surfaces (AGENTS, SYSTEM_REPOSITORY_MAP, B4 doc set, release matrix mobile section, api-client metadata) align with `CORE_B4_CANONICAL_NAMING.md`.
