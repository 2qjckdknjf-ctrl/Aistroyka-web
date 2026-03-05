# Contracts package diagnostic report

**Date:** 2026-03-05  
**Issue:** Cloudflare/OpenNext build fails with `Module parse failed: Unexpected token` on `@aistroyka/contracts/src/index.ts` — package consumed as raw TypeScript from `src` instead of built `dist`.

---

## 1. packages/contracts/package.json

| Field   | Current value                    | Notes |
|--------|-----------------------------------|-------|
| main   | `dist/index.js`                   | OK — points to dist |
| types  | `dist/index.d.ts`                 | OK |
| exports| *(absent)*                        | **Missing** — should explicitly map `.` to dist (types + default) |
| files  | `["dist"]`                        | OK |
| scripts.build | `tsc`                        | OK — add explicit `tsc -p tsconfig.json` and add `clean` |
| scripts.clean | *(absent)*                   | **Missing** — needed for clean build |
| sideEffects | *(absent)*                    | Optional — set `false` for tree-shaking |

**No reference to `src` in main/types** in current repo. If CI still resolves `src`, either (a) deployed branch has older package.json with `main: "src/index.ts"`, or (b) Next/transpilePackages or workspace resolution causes source to be pulled.

---

## 2. packages/contracts/tsconfig.json

| Option              | Current    | Template / target |
|---------------------|------------|--------------------|
| target              | ES2020     | ES2020 ✓ |
| lib                 | *(absent)* | Add `["ES2020"]` |
| module              | ESNext     | ESNext ✓ |
| moduleResolution    | bundler    | Bundler ✓ |
| rootDir             | src        | src ✓ |
| outDir              | dist       | dist ✓ |
| declaration         | true       | true ✓ |
| declarationMap      | *(absent)* | Add true |
| sourceMap           | *(absent)* | Add true |
| emitDeclarationOnly | *(absent)* | Add false |
| esModuleInterop     | *(absent)* | Add true |
| include             | src/**/*.ts| Use `["src"]` |

---

## 3. apps/web/package.json

- **Dependency:** `"@aistroyka/contracts": "file:../../packages/contracts"` — workspace link, correct.
- No direct reference to `src`; resolution follows package `main`/`exports`.

---

## 4. apps/web/next.config.js

- **transpilePackages:** `["@aistroyka/contracts"]` — present. Defensive; primary fix is package serving dist only.

---

## 5. Root package.json

| Script            | Current                                      | Issue |
|------------------|----------------------------------------------|-------|
| build            | `cd apps/web && bun run build`               | **Does not run build:contracts first** — web can run with stale/missing contracts dist |
| build:contracts  | `cd packages/contracts && bun run build`     | OK |
| cf:build         | `bun run build:contracts && cd apps/web && bun run cf:build` | OK — contracts built before cf:build |

**Finding:** Root `build` does not run `build:contracts`. If Cloudflare or any pipeline runs `bun run build` from root, contracts may not be built and `dist` may be missing.

---

## 6. References to src/index.ts

- Grep: no references to `contracts/src` or `@aistroyka/contracts.*src` in repo.
- package.json main/types already point to dist in current state.

---

## 7. Root cause (conclusion)

1. **CI/Cloudflare** may be running a branch where `packages/contracts` still had `main: "src/index.ts"`, or the Build command does not run from repo root (e.g. runs `cd apps/web && bun run cf:build`), so `build:contracts` is never executed and `dist` is missing; then Next/transpilePackages may end up compiling from source or resolution falls back in a way that exposes `src`.
2. **Missing `exports`** in package.json — some tools (Next, bundlers) use `exports` first; without it they might resolve differently.
3. **Root `build`** does not guarantee contracts are built before web.

---

## 8. Actions to take

- Add **exports** to packages/contracts (`.` → dist only).
- Align **tsconfig** with template (lib, declarationMap, sourceMap, esModuleInterop, include).
- Add **clean** script and use **build**: `bun x tsc -p tsconfig.json`.
- Root: add **build:web**, and **build** = `build:contracts && build:web`; keep **cf:build** = `build:contracts && apps/web cf:build`.
- Ensure Cloudflare Build command is **`bun run cf:build`** from repo root so that `build:contracts` runs.
- Verify after changes: `require.resolve('@aistroyka/contracts')` (or ESM equivalent) points to `dist/index.js`.
