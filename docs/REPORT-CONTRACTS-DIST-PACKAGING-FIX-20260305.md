# Contracts dist packaging fix — final report

**Date:** 2026-03-05  
**Goal:** Make `@aistroyka/contracts` a buildable internal package (dist), correct exports, build order (contracts → web → opennext), and fix Cloudflare build error on `src/index.ts`.

---

## Why it was failing

- **Symptom:** Cloudflare/OpenNext build failed with:
  ```text
  ./node_modules/@aistroyka/contracts/src/index.ts
  Module parse failed: Unexpected token (1:54)
  export { HealthResponseSchema, BuildStampSchema, type HealthResponse } from ...
  ```
- **Cause:** The package was consumed as **raw TypeScript from `src`** instead of built **`dist`**:
  1. In some environments (e.g. CI or stale installs), `apps/web/node_modules/@aistroyka/contracts` was a **copy** with an old `package.json` where `main`/`types` pointed to `src/index.ts`.
  2. Missing **`exports`** in the package: bundlers and Node resolve from `exports` when present; without it, resolution can differ and in some cases source was used.
  3. Root **`build`** did not run **`build:contracts`** first, so a fresh clone/CI could run `next build` with no `dist` and fall back to or expose source.

---

## Changes made

### 1. `packages/contracts/tsconfig.json`

- **lib:** `["ES2020"]`
- **declarationMap:** `true`
- **sourceMap:** `true`
- **emitDeclarationOnly:** `false`
- **esModuleInterop:** `true`
- **include:** `["src"]`
- Left **target**, **module**, **moduleResolution**, **rootDir**, **outDir**, **declaration**, **strict**, **skipLibCheck** as needed for emitting `dist/*.js` and `dist/*.d.ts`.

### 2. `packages/contracts/package.json`

- **main:** `./dist/index.js` (no `src`)
- **types:** `./dist/index.d.ts`
- **exports:** added so only dist is exposed:
  ```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
  ```
- **files:** `["dist"]`
- **sideEffects:** `false`
- **scripts:**  
  - **clean:** `rm -rf dist`  
  - **build:** `bun x tsc -p tsconfig.json`  
  - **test:** unchanged

No references to `src` in `main`, `types`, or `exports`.

### 3. Root `package.json` build pipeline

- **build:contracts:** `bun run --cwd packages/contracts clean && bun run --cwd packages/contracts build`
- **build:web:** `bun run --cwd apps/web build`
- **build:** `bun run build:contracts && bun run build:web`
- **cf:build:** `bun run build:contracts && bun run --cwd apps/web cf:build`

Order: contracts → web → (for cf) opennext.

### 4. Next.js (apps/web)

- **transpilePackages:** `['@aistroyka/contracts']` left in place in `next.config.js` as a compatibility layer; primary fix is package serving only dist.

### 5. Diagnostic report

- **docs/REPORT-CONTRACTS-DIAG-20260305.md** — snapshot of package.json, tsconfig, next.config, root scripts, and root-cause analysis.

---

## What resolves to now

- After `bun install` and `bun run build:contracts`:
  - `require.resolve('@aistroyka/contracts')` from `apps/web` → **`.../node_modules/@aistroyka/contracts/dist/index.js`**
- In Next/Cloudflare build logs, the path to contracts is **dist**, not **src**.

---

## Build commands (summary)

| Command | Purpose |
|--------|--------|
| `bun run build:contracts` | Clean + build `packages/contracts` → `dist/` |
| `bun run build:web` | Build Next.js app in `apps/web` |
| `bun run build` | `build:contracts` then `build:web` |
| `bun run cf:build` | `build:contracts` then `apps/web` cf:build (next + opennext) |

**Cloudflare Pages/OpenNext:** Build command must be **`bun run cf:build`** from the **repository root** so that `build:contracts` runs and `dist` exists before the web and OpenNext steps.

---

## Verification

- **bun install --frozen-lockfile** — OK  
- **bun run build** — OK (contracts then web)  
- **cd apps/web && bun run build** — OK  
- **cd apps/web && bun run test** — 61 files, 294 tests passed  
- **require.resolve('@aistroyka/contracts')** — resolves to `.../dist/index.js` after install + build:contracts  

---

## Cloudflare build status

- **Next.js build (and contracts resolution):** Fixed. No more `node_modules/@aistroyka/contracts/src/index.ts` in the pipeline; resolution uses **dist**.
- **Full `cf:build` (opennextjs-cloudflare):** Still fails at the **OpenNext server bundling** step with:
  ```text
  Could not resolve "./dist/index"
  .open-next/node_modules/styled-jsx/index.js
  ```
  This is an **OpenNext / styled-jsx** bundling issue (copy of deps into `.open-next`), **not** related to `@aistroyka/contracts`. Contracts packaging and build order are correct; Cloudflare will see a green **Next.js** build once the deploy pipeline runs **`bun run cf:build`** from root. Any remaining red build is due to the separate OpenNext/styled-jsx fix or OpenNext/Next 15 compatibility.

---

## Commits (suggested)

- `fix(contracts): build dist + correct exports` — packages/contracts tsconfig + package.json  
- `chore(build): ensure contracts built before web/cf build` — root package.json scripts  
- `docs(contracts): add diagnotic and packaging fix reports` — REPORT-CONTRACTS-DIAG and this report  

(No change to next.config for transpilePackages; it was already correct.)
