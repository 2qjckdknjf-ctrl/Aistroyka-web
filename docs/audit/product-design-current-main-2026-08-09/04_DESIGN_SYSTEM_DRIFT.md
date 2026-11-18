# 04 — Design System Drift (current main `02baa6a`)

Compared against `docs/design-system/*`, `docs/DESIGN_SYSTEM.md`, and live screens in this audit. DesignPreview / Storybook-only states are **not** product evidence.

---

## 1. Token reality

| Namespace | Count / state | Evidence |
|-----------|---------------|----------|
| `--aistroyka-*` | ~117 definitions in `apps/web/app/design-tokens.css` | Canonical semantic layer |
| `--lg-*` | **0 root definitions**; ~31 references in `liquid-glass.css` / globals / public footer | LG CSS depends on undefined custom properties |
| Legacy aliases (`--ai-*`, `--bg-*`, …) | ~10, duplicated in `design-tokens.css` **and** `globals.css` | Transitional dual namespace still shipped |
| TS hex mirror | `apps/web/lib/design/colors.ts` | Drift risk vs CSS |

**Background split:** legacy `#0B0F19` vs `--aistroyka-bg-primary` `#040a18` — public/cabinet darks are related but not identical.

---

## 2. Liquid Glass usage

| Surface | Pattern |
|---------|---------|
| Public marketing | React LG primitives (`GlassNav`, `GlassLink`, `GlassSurface`, …) — **actual product** |
| Auth | Indirect via `card-elevated` / globals utilities |
| Cabinet / portal / admin | Mostly `--aistroyka-*` + Tailwind `aistroyka-*`; **no** GlassNav shell |
| Site-wide | `AppGlassRoot` SVG filters in root layout |

**Verdict:** Dual-skin product is intentional but incomplete: public LG vs operational cabinet. Wave C has not unified them.

**Do not count as product evidence:** `GlassIntensityControl` preview prop, `.lg-preview-field`, deprecated `PublicLiquidGlassRoot` (returns null), absent `/design/liquid-glass` route at this SHA, `ai-demo` mock as design certification.

---

## 3. Governance checks (this run)

| Check | Result |
|-------|--------|
| `bun run --cwd apps/web check:design` | **FAIL** — `components/dashboard/TaskChatPanel.tsx` uses `text-red-600` |
| Additional raw Tailwind | `HelpStartChecklist.tsx` `text-green-600` (sibling hotspot) |
| `bun run i18n:check` (activation/dashboard scopes) | **PASS** for ru/es/it vs en |
| Full-tree i18n / semantic quality | Not claimed |

---

## 4. Screen-level drift (from accepted screenshots)

| Observation | Surfaces | Severity |
|-------------|----------|----------|
| Public brand shell cohesive across locales | home/features/contact | Strength |
| Auth card is flat/dark, not full LG public shell | login/register | Dual-skin polish |
| Cabinet long sidebar + yellow accent consistent | dashboard/* | Strength / density risk |
| Welcome modal + onboarding stack + AI Guide FAB | cabinet | UX density vs design calm |
| Dual project tab systems | project detail | IA / component inconsistency |
| Client view reuses contractor chrome | portal client | Shell mismatch |
| Platform Forbidden page is bare white “Forbidden” | platform-admin | Error UX not on-brand |

---

## 5. Web ↔ iOS mapping

| Semantic | Web | iOS Manager/Worker | Match |
|----------|-----|--------------------|-------|
| Page bg | `#040a18` aistroyka | `#0B0F19` semantic files | Partial (legacy-aligned on iOS) |
| Accent | `#F5C518` | `Color.accentColor` / assets | Family OK |
| Success/warning/error | system-like hex | matching hex in Swift | Mostly yes |
| Info | `#007aff` | `#3b82f6` | No |
| Shared `BrandTokens` package | Documented historically | **Not present** at this SHA | Missing |

Worker onboarding screenshot confirms dark + yellow family consistency with web brand.

Android: deferred scaffold; MaterialTheme direct usage remains — inventory only.

---

## 6. Wave A / B / C score vs claims

| Wave | Doc claim | Current evidence verdict |
|------|-----------|--------------------------|
| A Web foundation | Complete | **PARTIAL** — tokens exist; legacy + missing `--lg-*` roots; `check:design` red |
| B Mobile foundation | Complete (`08-wave-b…`) | **STALE / overstated** — iOS/Android still have screen-level raw colors; no BrandTokens |
| C Feature migration | In progress (`09-wave-c…`) | **VERIFIED in progress** — helpers exist on some dashboard surfaces; P0/P1 backlog open; pilot screens not fully semantic-clean |

**Design stage for this audit:** **Wave C — feature migration in progress** (not Wave C complete).

---

## 7. Recommended design fixes (non-implementation)

1. Define or remove `--lg-*` root tokens; stop documenting them as living in `design-tokens.css` until true.
2. Deduplicate legacy aliases; pick one primary background.
3. Green `check:design` (TaskChatPanel / HelpStartChecklist).
4. One project navigation model before further Wave C polish.
5. Client portal shell separate from contractor `DashboardShell`.
6. Align iOS page background with `--aistroyka-bg-primary` or document intentional legacy match.
