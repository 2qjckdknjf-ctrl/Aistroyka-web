# LG-1.5 Design Governance Closure

**Date:** 2026-06-18  
**Sprint:** LG-1.5 Technical Debt Closure  
**Command:** `bun run check:design` (from `apps/web`)

---

## Executive summary

| Item | Before LG-1.5 | After LG-1.5 |
|------|---------------|--------------|
| `check:design` exit code | **1** (4 violations) | **0** (PASS) |
| Files fixed | — | 4 |
| New tokens created | — | **None** (used existing semantics) |
| Repo-wide scan (`app/components/lib`) | 4 hits | **0 hits** |

**Verdict: design governance debt closed.**

---

## A1. Design-system rules

Governance is enforced by `apps/web/scripts/check-raw-colors.mjs`:

- Scans `apps/web/{app,components,lib}/**/*.{ts,tsx,js,jsx,css}`
- Forbids raw Tailwind palette utilities (`red-600`, `green-600`, `slate-*`, etc.)
- Requires Aistroyka semantic tokens (`text-aistroyka-error`, `text-aistroyka-success`, etc.)

Canonical semantic tokens already defined in `app/design-tokens.css`:

| Semantic | CSS variable | Tailwind class |
|----------|--------------|----------------|
| Error / danger | `--aistroyka-error` (#ff3b30) | `text-aistroyka-error` |
| Success | `--aistroyka-success` (#34c759) | `text-aistroyka-success` |

No new token was required.

---

## A2–A3. Violations fixed

| File | Before | After | Rule |
|------|--------|-------|------|
| `admin/ai/expert-review/AdminExpertReviewClient.tsx` | `text-red-600` | `text-aistroyka-error` | Raw `red-*` palette |
| `admin/ai/training-consent/AdminAiTrainingConsentClient.tsx` | `text-red-600` | `text-aistroyka-error` | Raw `red-*` palette |
| `lib/features/ai/components/CopilotOptionalFeedback.tsx` | `text-red-600` | `text-aistroyka-error` | Raw `red-*` palette |
| `components/help/HelpStartChecklist.tsx` | `text-green-600` | `text-aistroyka-success` | Raw `green-*` palette |

All four match existing patterns used across dashboard/auth (e.g. `CreateProjectForm.tsx`, `TeamPageClient.tsx`, `GetStartedPanel.tsx`).

---

## A4. Full-repository scan

### In-scope (`apps/web` app/components/lib)

```
grep raw palette pattern → 0 matches (post-fix)
bun run check:design → PASS
```

### Out-of-scope (documented, not LG-1.5 targets)

| Location | Raw colors | Action |
|----------|------------|--------|
| `archive/legacy-app/**` | Many `gray-*`, `red-*` | Archived legacy; not scanned by `check:design` |
| `archive/legacy-app-root/**` | `gray-*` | Archived legacy |

Archive trees are not part of active product surfaces and are excluded from the governance script by design (not under active `app/components/lib` product paths).

---

## A5. Script wiring fix (Volta-resistant)

`check:design` previously invoked `node scripts/check-raw-colors.mjs`, which failed with Volta exit 126 when `~/.volta/bin` precedes system paths (Volta intercepts `node` → x86 binary on arm64).

**Fix:** `apps/web/package.json`

```json
"check:design": "bun scripts/check-raw-colors.mjs"
```

Validated with `PATH="$HOME/.volta/bin:$HOME/.bun/bin:..."` → **PASS**.

---

## Acceptance

```bash
cd apps/web && bun run check:design
# check-raw-colors: no raw color classes found.
# exit 0
```

**LG-1.5 design governance: CLOSED.**
