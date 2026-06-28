# 03 — Candidate Branch Diffs

**Date:** 2026-06-28  
**Base main:** `d54278c680162cf8af598466fda1d72dc9c733dc`

---

## A. `origin/release/web-pilot-rc` (tip `9d6a7812`) — SAFE_CANDIDATE (re-slice source)

**Diff vs main:** 269 files, +21,413 / −2,568. behind/ahead = **81 / 23**.

**Area breakdown:**

| Area | Files |
|------|-------|
| `apps/web` | 185 |
| `docs/design` | 81 |
| `scripts/lg4x-add-breadcrumbs.mjs` | 1 |
| `packages/contracts` | 1 |
| `package.json` (root) | 1 |

**Dangerous-area scan (apps/web):**

| Area | Touched? |
|------|----------|
| `apps/web/app/api/**` | **No** |
| `apps/web/middleware.ts` | **No** |
| `apps/web/lib/supabase/**` (auth/session) | **No** |
| `apps/web/lib/platform-owner/**` (RBAC/owner) | **No** |
| `apps/web/messages/**` (i18n) | **Yes — 4 files** (en/es/it/ru) |
| `apps/web/package.json` + root + contracts `package.json` | **Yes — STALE tooling reverts** |

**Stale signal (blocker for as-is merge):** the `package.json` diffs revert
current main tooling. Examples:

```diff
-    "lint": "eslint app components lib middleware.ts --quiet",
+    "lint": "bun ../../node_modules/eslint/bin/eslint.js app components lib middleware.ts --quiet",
-    "i18n:check": "node ../../scripts/i18n/check-messages.js",
+    "i18n:check": "bun ../../scripts/i18n/check-messages.js",
-    "test": "vitest run --maxWorkers=1",
+    "test": "bun ../../node_modules/vitest/vitest.mjs run --maxWorkers=1",
```

Current main uses the `node`/`eslint`/`vitest` forms; the branch would regress
them. **These package.json changes must be excluded** from any re-slice.

**LG payload present (new files, safe additions):**

- `apps/web/components/design/liquid-glass/` — `LiquidGlass`, `LiquidGlassFilter`,
  `AppGlassRoot`, `GlassPanel`, `GlassSurface`, `GlassButton`, `GlassLink`,
  `GlassNav`, `GlassHeroCard`, `GlassIntensityControl`, `index.ts`
- `apps/web/components/design/index.ts`
- `apps/web/styles/liquid-glass.css`
- `apps/web/components/public/` — new `PublicAmbientField`, `PublicHeroLens`,
  `PublicHeroCTA`, `PublicHeroMetrics`, `PublicGlassShells`,
  `PublicLiquidGlassRoot`, `PublicPageHero`, `PublicProofSection`,
  `PublicTimelineSection`, `PublicCTASection`, `PublicFeatureCard/Grid`,
  `PublicRevealGlassCard`, `PublicRelatedLinksSection`, `PublicJsonLd`,
  `CountUpText`, `PublicGlassContentPage` (+ modified `PublicHeader`,
  `PublicFooter`, `index.ts`)
- Modified shells: `app/[locale]/(public)/layout.tsx`,
  `app/[locale]/(public)/PublicHomeContent.tsx`, `app/layout.tsx`,
  `app/globals.css`

**Verdict:** cleanest source. Can be cherry-picked **per slice** onto fresh main,
**excluding** the stale `package.json` reverts and reconciling i18n keys.

---

## B. `origin/design/liquid-glass-public-shell-lg2a` (tip `68be705a`, PR #108) — MANUAL_REVIEW_REQUIRED

**Diff vs main:** 349 files, +32,882 / −2,060. behind/ahead = **86 / 38**.

| Area | Files |
|------|-------|
| `apps/web` | 164 |
| `docs/design` | 98 |
| `docs/ai-flywheel` | 72 |
| `scripts/ai` | 5 |
| `ios/AiStroykaManager` | 5 |
| `ios/Shared` | 2 |

**Dangerous areas:** bundles **ai-flywheel** docs/scripts and **iOS** changes into
an LG branch. PR #108 is open but mixes concerns. Not a clean LG-only slice.

---

## C. `feature/unified-product-design-certification` (tip `38e0d705`, local only) — DO_NOT_BROAD_MERGE

**Diff vs main:** 721 files, +54,989 / −5,342. behind/ahead = **86 / 50**.

| Area | Files (top) |
|------|-------------|
| `apps/web` | 281 |
| `docs/design` | 101 |
| `docs/ai-flywheel` | 72 |
| `docs/mobile-lg` | 54 |
| `android/*` | 90 |
| `ios/*` | 86 |
| `scripts/{ai,smoke}` | 9 |
| `docs/architecture` | 4 |
| `maestro/flows` | 2 |

**Dangerous areas:** web + iOS + Android + ai-flywheel + smoke scripts +
architecture in one branch. Exists only locally. **Never broad-merge.**

---

## Cross-candidate conclusion

- All three are **80+ commits behind main** → none is mergeable as-is; all need
  fresh re-application.
- Only `release/web-pilot-rc` is **web-only and free of API/auth/middleware/mobile/
  flywheel** → it is the correct **source** for cherry-picking minimal LG slices.
- The first slice must drop the stale `package.json` tooling reverts and reconcile
  the 4 i18n bundles against current main keys.
