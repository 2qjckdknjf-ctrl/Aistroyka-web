# 04 — Recommended Liquid Glass Ship Plan

**Date:** 2026-06-28  
**Base main:** `d54278c680162cf8af598466fda1d72dc9c733dc`

---

## Principle

**No broad merge.** Ship LG as a sequence of small, reviewable, web-only slices
re-applied on fresh `main`, each via a normal protected PR (non-author APPROVED +
CI PASS), with deploy only after merge + validation + buildStamp/marker proof.

## Recommended source

`origin/release/web-pilot-rc` (web-only LG; no API/auth/middleware/mobile/flywheel).
Cherry-pick file-by-file onto a fresh branch from `main`. Do **not** merge the
branch; do **not** carry its stale `package.json` tooling reverts.

---

## Slice 1 (recommended first — minimal foundation + public shell)

Goal: introduce the LG design system and apply it to the **public shell + home
hero only**, with no behavioral/backend change.

**Allowed files (allowlist):**

- `apps/web/components/design/liquid-glass/**` (new components)
- `apps/web/components/design/index.ts` (new)
- `apps/web/styles/liquid-glass.css` (new)
- `apps/web/app/globals.css` (careful merge — additive only)
- `apps/web/components/public/PublicLiquidGlassRoot.tsx` (new)
- `apps/web/components/public/PublicAmbientField.tsx` (new)
- `apps/web/components/public/PublicHeroLens.tsx`, `PublicHeroCTA.tsx`,
  `PublicHeroMetrics.tsx` (new)
- `apps/web/components/public/PublicHeader.tsx`, `PublicFooter.tsx`,
  `apps/web/components/public/index.ts` (modified)
- `apps/web/app/[locale]/(public)/layout.tsx` (shell wrap)
- `apps/web/app/[locale]/(public)/PublicHomeContent.tsx` (home hero only)
- `apps/web/app/layout.tsx` (only if required for root glass root; prefer minimal)
- i18n: **only** the specific visible-copy keys the home hero needs, added to
  `en/ru/es/it` and reconciled against current main keys (run `i18n:check` +
  `I18N_CHECK_ALL=1`).

**Forbidden in slice 1:**

- any `apps/web/app/api/**`, `middleware.ts`, `lib/supabase/**`,
  `lib/platform-owner/**`
- mobile (`ios/**`, `android/**`)
- `.github/workflows/**`, `scripts/**` (except none needed), env, migrations
- `package.json` / lockfile tooling reverts
- broad page-by-page redesign (defer to later slices)

## Subsequent slices (each its own PR)

- Slice 2: public marketing pages (features, pricing, platform, …) one batch
- Slice 3: remaining public pages (about, faq, contact, security, …)
- Slice 4 (optional, separate decision): dashboard/auth glass surfaces — higher
  risk, review independently; **not** part of the public-site pilot.

---

## Validation required (every slice, before merge)

```
bun install --frozen-lockfile
bun run lint
bun run build:contracts
bun run i18n:check
I18N_CHECK_ALL=1 bun run i18n:check
bun run test -- --run        # expect 1546/1546 unless legitimately changed
bun run build
bun run cf:build
```

## PR review path

- Branch from latest `main`
- Open PR → base `main`
- Non-author APPROVED review via `GITHUB_REVIEWER_TOKEN` (reviewer `6262265-cpu`)
- CI `check` PASS
- Protected merge (no self-approve, no bypass)

## Deploy timing

- **Only after merge + green validation.**
- Then run the **separate** controlled deploy operator (staging → smoke → prod).
- **Post-deploy proof required:** `/api/v1/health` `buildStamp.sha7` == new main
  short SHA **and** `https://aistroyka.ai/en` LG marker count **> 0**.
- Do not claim LG live until both proofs pass.
