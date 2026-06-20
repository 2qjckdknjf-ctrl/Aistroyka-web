# Web Liquid Glass Migration — Audit

**Branch:** `feature/unified-product-design-certification`  
**Date:** 2026-06-18  
**Scope:** Pending `apps/web/**` Liquid Glass migration (147 files)  
**Verdict:** **PASS** — no P0/P1/P2 blockers; safe to commit as isolated changeset

---

## Step 0 — Scope classification

| Class | Contents | Action |
|-------|----------|--------|
| **A. Web Liquid Glass migration** | 147 files under `apps/web/**` (140 modified + 7 new) | Commit |
| **B. Web validation/docs** | This audit + migration/no-tail reports (created during audit) | Commit |
| **C. Unrelated RBAC docs** | `docs/architecture/RBAC_*.md` (3 untracked) | **Leave unstaged** |
| **D. Forbidden** | `AGENTS.md`, `ios/**`, `android/**`, `.env*`, build artifacts | **Not present in dirty scope** |

---

## 1. Scope inventory

### Public pages (~30 files)

Marketing routes under `app/[locale]/(public)/**`: home, about, pricing, platform, features, cases, docs, FAQ, contact, enterprise, integrations, security, mobile, copilot, AI demo, workflows, partners, legal (privacy/terms), etc.

New public glass helpers:

- `PublicGlassContentPage`, `PublicGlassShells`, `PublicRevealGlassCard`, `CountUpText`
- Existing public sections updated to use `GlassSurface` / reveal cards instead of solid `bg-aistroyka-surface*` panels

### Dashboard (~38 files)

- `DashboardShell` — sidebar/header chrome uses `surface-glass-chrome` / `surface-glass-raised` (no hero motion)
- Project cockpit, portfolio, team, billing, support, onboarding surfaces
- Client portal sections (estimates, defects, service requests, activity) — customer-safe commercial surfaces only

### Admin (~15 files)

- AI overview/runtime, expert review, training consent, requests, security
- Governance (calibration, threshold history, audit timeline), trust timeline, billing pilot
- `AdminTable` — glass header row only; body rows remain solid hover (dense-data safe)

### Owner / stakeholder (~2 files)

- `(owner)/layout.tsx` — chrome glass header
- `owner-console-client.tsx` — surface utility migration

### Auth (~3 files)

- Auth layout ambient field; telegram start/callback — input/button glass utilities

### Shared UI primitives (~20 files)

| Primitive | Change |
|-----------|--------|
| `Button` | Primary/secondary route through `GlassButton` |
| `Card`, `Panel`, `StatCard` | Wrap `GlassSurface` |
| `Modal`, `Toast`, `Alert`, `DropdownMenu` | Popover/chrome glass utilities |
| `DateRangePicker`, `Collapsible` | Segmented control / card glass |
| `Nav`, `DashboardShell` | Chrome + locale toggle glass |

### CSS / tokens

- `app/globals.css` — `surface-glass*`, `input-field*`, legacy `.btn-primary/.btn-secondary` glass styling
- `styles/liquid-glass.css` — reduced-motion, reduced-transparency, forced-colors fallbacks
- `lib/ui-tokens.ts` — token class strings aligned to LG utilities

### Codemod / root wiring

- `scripts/apply-glass-surfaces.mjs` — one-shot class replacement (documented internal)
- `app/layout.tsx` — global `AppGlassRoot` (single SVG refraction filter mount)

### Audit artifact mirrors (~10 files)

`apps/web/audit_*` directories contain snapshot copies synced with production paths; codemod explicitly skips `audit_*` on future runs.

---

## 2. Design correctness

| Check | Result |
|-------|--------|
| Dense tables/forms | **PASS** — `AdminTable` tbody uses hover solid; only thead uses `surface-glass-row`. Forms use `input-field-sm` (light tint, not hero blur). |
| Readable contrast | **PASS** — text tokens unchanged; forced-colors + reduced-transparency fallbacks in `liquid-glass.css`. |
| Blur performance | **PASS** — dashboard/admin avoid `tilt`, `glow`, `float` motion; mobile breakpoint reduces refraction URL complexity. |
| Solid cards where needed | **PASS** — empty states and table cells use muted glass or solid hover, not hero variants. |
| Glass placement | **PASS** — glass on chrome (nav, sidebar, popovers), cards, CTAs; not on every table cell. |
| Navigation chrome | **PASS** — `DashboardShell` sidebar + mobile drawer use `surface-glass-chrome`; links unchanged. |
| Animated effects | **PASS** — reveal/tilt/glow limited to public marketing components; dashboard grep clean. |

---

## 3. Architecture

| Check | Result |
|-------|--------|
| Shared primitives | **PASS** — canonical tree at `components/design/liquid-glass/` + `lib/design/liquid-glass.ts` |
| Duplicate implementations | **PASS** — `PublicLiquidGlassRoot` deprecated stub (returns null); single filter via `AppGlassRoot` |
| One-off styling | **ACCEPTABLE** — `surface-glass*` utility classes in `globals.css` for codemod targets; primitives for interactive components |
| Public → dashboard imports | **PASS** — no `@/components/public` imports under `(dashboard)`; auth layout only uses `PublicAmbientField` |
| Server/client boundaries | **PASS** — `AppGlassRoot` is server-safe (static SVG filter); interactive glass marked `"use client"` where needed |

---

## 4. Regression risk assessment

| Surface | Risk | Mitigation |
|---------|------|------------|
| Auth pages | Low | Input/button utilities only |
| Dashboard shell | Low | Chrome blur; nav structure preserved |
| Forms | Low | `input-field` / `input-field-sm` with focus rings intact |
| Buttons | Low | `Button` API unchanged; maps to `GlassButton` |
| Modals/dropdowns/toasts | Low | `surface-glass-popover` utility |
| Owner/stakeholder finance isolation | **None** — no internal cost/margin UI touched; client portal sections remain customer-commercial only |
| Mobile web responsive | Low | `@media (max-width: 480px)` blur simplification; safe-area padding on body |

---

## 5. Codemod safety (`apply-glass-surfaces.mjs`)

| Property | Value |
|----------|-------|
| Root | `apps/web` only |
| Skips | `node_modules`, `.next`, `.open-next`, `.wrangler`, `audit_*` |
| File types | `.tsx`, `.ts`, `.jsx`, `.js` (excludes self) |
| Nature | One-shot / internal — marked in file header |
| Risk | Low for re-run (idempotent-ish string replace); not invoked at build time |

---

## 6. Grep validation

| Check | Result |
|-------|--------|
| `btn-primary` / `btn-secondary` in TSX | **0 matches** (legacy CSS classes remain in `globals.css` only) |
| Heavy glass on dense table rows | **None** — only thead/header rows use `surface-glass-row` |
| Public components in dashboard | **0 imports** under `(dashboard)` |

---

## 7. Validation runs

| Command | Result |
|---------|--------|
| `bun run lint` | **PASS** |
| `bun x tsc --noEmit` (apps/web) | **PASS** |
| `bun run test` | **PASS** — 326 files, 1646 tests |
| `bun run build` | **PASS** |
| `bun run cf:build` | **PASS** |

---

## 8. Findings summary

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| — | — | No P0/P1/P2 issues | N/A |

**P3 (documented, non-blocking):**

- Legacy `.btn-primary/.btn-secondary` CSS retained for any stray markup; no production TSX usage
- `audit_*` snapshot dirs updated alongside migration (not build inputs)
- Form fields use light glass tint — monitor readability on low-contrast displays

---

## Final audit score

**94 / 100** — migration architecture sound, validations green, customer-finance boundaries preserved, no blocking defects.

**Recommendation:** **COMMIT** web migration as separate changeset; leave RBAC docs unstaged.
