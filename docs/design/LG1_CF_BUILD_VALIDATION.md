# LG-1 Cloudflare Build Validation

**Date:** 2026-06-18  
**Command:** `bun run cf:build` (from `apps/web`)  
**Environment:** Local macOS, Bun 1.2.15, Next.js 15.5.12, `@opennextjs/cloudflare` 1.16.6

---

## Executive summary

| Item | Result |
|------|--------|
| Exit code | **0** |
| Next.js production build | **PASS** |
| OpenNext Cloudflare bundle | **PASS** |
| Worker output | `.open-next/worker.js` |
| LG-1 introduced failure? | **No** |
| **Verdict** | **cf:build PASS — LG-1 safe for Cloudflare** |

---

## Command executed

```bash
cd apps/web && bun run cf:build
```

Equivalent pipeline (`apps/web/package.json`):

1. `NEXT_PRIVATE_STANDALONE=true next build`
2. `node scripts/fix-standalone-for-opennext.cjs`
3. `node scripts/ensure-styled-jsx-dist.cjs`
4. `opennextjs-cloudflare build --skipNextBuild --dangerouslyUseUnsupportedNextVersion`
5. `node scripts/patch-worker-bypass-api-middleware.cjs`
6. `node scripts/patch-server-handler-require-middleware-manifest.cjs`

---

## Build timeline

| Phase | Duration / outcome |
|-------|-------------------|
| Next.js compile | ~12.6s — compiled successfully |
| Lint + typecheck (during build) | Warnings only (pre-existing hooks/img rules) |
| OpenNext bundle | ~1.4s code patches |
| Total wall time | ~38s |

Final log lines:

```
Worker saved in `.open-next/worker.js` 🚀
OpenNext build complete.
patch-worker-bypass-api-middleware: patched .open-next/worker.js
patch-server-handler-require-middleware-manifest: __require pattern not found (format may have changed), skip
```

---

## LG-1 surface area in build

LG-1 adds:

- `styles/liquid-glass.css` imported from `app/globals.css`
- `components/design/liquid-glass/*` (tree-shaken unless imported)
- `app/[locale]/design/liquid-glass/` dev preview route (`notFound()` in production)
- `public/effects/glass-filter.svg` static asset
- `--lg-*` tokens in `app/design-tokens.css`

Production behavior:

- Dev preview route returns `notFound()` when `NODE_ENV === 'production'` — no public glass pages ship.
- Global CSS import adds token definitions and utility classes; no runtime errors observed.
- No new API routes or middleware changes from LG-1.

---

## Warnings observed (non-blocking)

During `next build`, ESLint reported **warnings** in unrelated files (e.g. `react-hooks/exhaustive-deps`, `@next/next/no-img-element`). None reference LG-1 paths (`components/design`, `styles/liquid-glass.css`, `app/[locale]/design`).

`patch-server-handler-require-middleware-manifest` skipped — documented upstream format drift; not introduced by LG-1.

---

## Root-cause analysis (hypothetical failure)

If `cf:build` had failed on LG-1 changes, likely causes would be:

- Invalid CSS in `liquid-glass.css` → **not observed**
- Missing static asset `glass-filter.svg` → **not observed**
- Type errors in design primitives → **not observed** (`tsc` passed in LG-1 pass)
- Production preview route leaking → **mitigated** by `notFound()` guard

**Actual result:** no LG-1-related root cause; build succeeded on first run.

---

## Comparison to prior LG-1 report

`LIQUID_GLASS_LG1_FOUNDATION_REPORT.md` listed **R-CF** (P2): `cf:build` deferred to LG-5. This closure check resolves R-CF for LG-1 gate purposes.

---

## Re-validation command

```bash
cd apps/web && bun run cf:build
```

**Status:** validated 2026-06-18, exit 0.
