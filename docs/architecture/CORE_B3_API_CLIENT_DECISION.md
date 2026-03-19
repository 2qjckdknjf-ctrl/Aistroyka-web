# B3 — `packages/api-client` decision — Aistroyka

**Date:** 2026-03-18 (body cleaned 2026-03-16, B5).

---

## 1. Classification

- **Status:** **PARTIAL** — package exists and is documented as the TS SDK, but is **not consumed** by `apps/web` or other workspace code.
- **Usage type:** External/SDK-only, not part of the web runtime.

---

## 2. Evidence

- **Package definition:** `packages/api-client/package.json`  
  - `"name": "@aistroyka/api-client"`  
  - `"private": true`  
  - `main`/`types` both `src/client.ts`  
  - Depends on `@aistroyka/contracts` only.
- **Workspaces:** Root `package.json` workspaces are `apps/web`, `packages/contracts`, `packages/contracts-openapi` — **does not include** `packages/api-client`, so the main build does not depend on this package.
- **In-repo imports:** `grep '@aistroyka/api-client'` in app TS hits only `packages/api-client/README.md` and architecture/docs; **no imports** from `apps/web` or root runtime code.
- **Docs referring to it:** `docs/REPORT-PHASE3-ENTERPRISE.md`, `docs/ADR/018-openapi-sdk-pipeline.md`, `docs/MOBILE-INTEGRATION-GUIDE.md`, `docs/SYSTEM_REPOSITORY_MAP.md`, etc., describe it as the TypeScript client for external consumers / SDK story.

---

## 3. Action taken in B3

- **Kept package as-is** (per constraints: do not delete packages without owner decision).
- Clarified in architecture inventory and this decision doc that:
  - It is **not** part of the web app dependency graph.
  - It is intended as a **standalone SDK** / reference client for external consumers.
- No changes to root workspaces or build scripts in that B3 step (B4 added `description` on package.json).

---

## 4. Blockers to full removal (if ever desired)

- Unknown external tooling or projects may rely on `packages/api-client` path and docs.
- Several ADRs and reports present it as part of the SDK and mobile integration story; deleting without replacement would invalidate those documents.

---

## 5. Summary

- **PARTIAL** — not used by web app code; documented as SDK artifact.
- **Action:** Documentation-level clarification; treat as SDK-side boundary, not core app module.
