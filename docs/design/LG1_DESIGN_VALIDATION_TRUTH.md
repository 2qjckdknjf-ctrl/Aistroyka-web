# LG-1 Design Validation Truth

**Date:** 2026-06-18  
**Command:** `bun run check:design` (from `apps/web`)  
**Script:** `apps/web/scripts/check-raw-colors.mjs`

> **Supersession (LG-1.5):** Violations documented below were **fixed** in LG-1.5. Current state: `check:design` **PASS** — see `LG15_DESIGN_GOVERNANCE_CLOSURE.md` and `LG_FINAL_NO_TAIL_AUDIT.md`.

---

## Executive summary

| Item | Result |
|------|--------|
| Command exit code | **1** (fail) |
| Failing file count | **3** |
| LG-1 file contributions | **0** |
| **Verdict** | **A — Pre-existing only** |

LG-1 does not introduce any `check:design` violations. Failures are unrelated admin AI flywheel files that already exist on `HEAD`.

---

## What `check:design` enforces

The script walks `app/`, `components/`, and `lib/` under `apps/web`, scanning `*.ts`, `*.tsx`, `*.js`, `*.jsx`, and `*.css` (excluding `node_modules`, `.next`, `*.test.*`, `*.spec.*`, `docs/`).

Forbidden pattern (Tailwind raw palette classes):

```
(?:text|bg|border|ring|from|to|via|divide|placeholder|ring)-(slate|red|amber|emerald|gray|zinc|neutral|stone|orange|yellow|lime|green|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]+
```

Policy: use Aistroyka design tokens (`text-aistroyka-*`, `bg-aistroyka-*`, etc.), not raw Tailwind color scales.

---

## Exact failures (2026-06-18 run)

```
Raw Tailwind colors are not allowed. Use aistroyka tokens.

  app/[locale]/(dashboard)/admin/ai/expert-review/AdminExpertReviewClient.tsx: red-600
  app/[locale]/(dashboard)/admin/ai/training-consent/AdminAiTrainingConsentClient.tsx: red-600
  lib/features/ai/components/CopilotOptionalFeedback.tsx: red-600
```

| File | Class | Line | Rule |
|------|-------|------|------|
| `AdminExpertReviewClient.tsx` | `text-red-600` | 244 | Raw `red-*` Tailwind scale |
| `AdminAiTrainingConsentClient.tsx` | `text-red-600` | 94 | Raw `red-*` Tailwind scale |
| `CopilotOptionalFeedback.tsx` | `text-red-600` | 88 | Raw `red-*` Tailwind scale |

All three usages are error-state text (`{error}` paragraphs).

---

## Pre-LG-1 existence proof

| Evidence | Finding |
|----------|---------|
| `git show HEAD:...AdminExpertReviewClient.tsx \| grep red-600` | **Present** on committed `HEAD` |
| `git log -1 -- AdminExpertReviewClient.tsx` | `9baceb73` — `feat(ai-flywheel): Expert Review Queue MVP` |
| `git ls-files apps/web/components/design` | **Empty** — LG-1 design primitives are new/untracked, not in prior commits |
| LG-1 scope files vs `HEAD` | Only `app/design-tokens.css` and `app/globals.css` modified on branch; spike public pages reverted |

These failures predate LG-1 work. They originate from the AI flywheel admin MVP, not Liquid Glass foundation.

---

## LG-1 file audit

LG-1 deliverables scanned manually and via the same forbidden-pattern grep:

| Path | In `check:design` scope? | Raw color violations |
|------|--------------------------|----------------------|
| `components/design/liquid-glass/*` | Yes | **None** |
| `components/design/index.ts` | Yes | **None** |
| `lib/design/liquid-glass.ts` | Yes | **None** |
| `lib/design/design-tokens.ts` | Yes | **None** |
| `app/design-tokens.css` (`--lg-*` additions) | Yes | **None** |
| `app/globals.css` (`@import liquid-glass.css`) | Yes | **None** |
| `app/[locale]/design/liquid-glass/*` (dev preview) | Yes | **None** |
| `styles/liquid-glass.css` | **No** (outside walk dirs) | Uses CSS custom properties (`--lg-*`, `--aistroyka-*`) only |

LG-1 components use token-based classes (`text-aistroyka-body`, `bg-aistroyka-surface`, etc.) and CSS variables. No `red-600`, `slate-*`, or other forbidden Tailwind scales appear in LG-1 code.

---

## Verdict matrix

| Option | Definition | Applies? |
|--------|------------|----------|
| **A** | Pre-existing only | **YES** |
| B | Partially caused by LG-1 | No |
| C | Caused by LG-1 | No |

**Final verdict: A — Pre-existing only**

No LG-1 fix required. Replacing `red-600` in admin AI clients is out of LG-1 scope; track under AI flywheel / design-debt cleanup.

---

## Re-validation

After LG-1 file audit: **no fix applied** (verdict A). Re-run:

```bash
cd apps/web && bun run check:design
```

Still fails on the same 3 pre-existing files — expected and documented. LG-1 introduces zero new failures.
