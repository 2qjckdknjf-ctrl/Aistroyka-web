# LIQUID_GLASS_UI_INVENTORY — AISTROYKA.AI

**Phase:** LG-0 (planning only)  
**Date:** 2026-06-18  
**Scope:** Repository UI surface inventory for Liquid Glass redesign planning  
**Out of scope:** Backend, API, migrations, mobile runtime, Cloudflare/Supabase config

> **Historical note (post LG-1 / LG-1.5):** Section 1’s “exploratory spike in `components/public/liquid-glass/`” described the **pre-reconciliation working tree**. Spike was deleted; canonical implementation lives at `components/design/liquid-glass/`. See `LIQUID_GLASS_SPIKE_RECONCILIATION.md` and `LG_FINAL_NO_TAIL_CANONICAL_AUDIT.md`.

---

## 1. Executive inventory summary

AISTROYKA web UI lives in `apps/web` (Next.js App Router, next-intl, Tailwind, CSS design tokens). The product spans **public marketing**, **auth**, **dashboard/manager operations**, **admin/owner consoles**, **stakeholder/client portal surfaces**, and **billing/subscribe** flows.

Styling architecture is **token-first** (`app/design-tokens.css` → Tailwind `aistroyka-*` aliases → component utility classes in `globals.css`). There is **no dedicated glass design system** in `lib/design/` yet.

**Important LG-0 finding:** An **exploratory Liquid Glass spike** exists in the current working tree (uncommitted) under `components/public/liquid-glass/`, `styles/liquid-glass.css`, and modified public layout/home/header. This spike is **not** the approved LG-1 foundation and must be **audited, consolidated, or reverted** before formal implementation begins.

**Skill location:** Installed at user level `~/.cursor/skills/liquid-glass-app-site/` (not yet vendored into repo `.cursor/skills/`).

---

## 2. Route groups and layouts

| Layout | Path | Role |
|--------|------|------|
| Root | `app/layout.tsx` | Fonts, metadata, global providers |
| Locale | `app/[locale]/layout.tsx` | i18n wrapper |
| Public | `app/[locale]/(public)/layout.tsx` | Marketing header/footer, JSON-LD |
| Auth | `app/[locale]/(auth)/layout.tsx` | Login/register/telegram |
| Dashboard | `app/[locale]/(dashboard)/layout.tsx` | `DashboardShell`, onboarding gate |
| Admin | `app/[locale]/(dashboard)/admin/layout.tsx` | Admin sub-shell |
| Owner | `app/[locale]/(owner)/layout.tsx` | Platform owner console |

---

## 3. Public marketing pages (24 routes)

All under `app/[locale]/(public)/`:

| Route | File | Notes |
|-------|------|-------|
| `/` | `page.tsx` + `PublicHomeContent.tsx` | Main landing; spike-modified |
| `/platform` | `platform/page.tsx` | Product overview |
| `/solutions` | `solutions/page.tsx` | Vertical solutions |
| `/features` | `features/page.tsx` | Feature grid |
| `/pricing` | `pricing/page.tsx` | Plans teaser |
| `/enterprise` | `enterprise/page.tsx` | Enterprise pitch |
| `/mobile` | `mobile/page.tsx` | iOS/Android promo |
| `/copilot` | `copilot/page.tsx` + `CopilotMockUI.tsx` | AI copilot marketing |
| `/ai-construction-control` | `ai-construction-control/page.tsx` | AI control narrative |
| `/ai-demo` | `ai-demo/page.tsx` + `AiDemoSimulator.tsx` | Interactive demo |
| `/projects-showcase` | `projects-showcase/page.tsx` | Visual showcase |
| `/workflows` | `workflows/page.tsx` | Workflow story |
| `/integrations` | `integrations/page.tsx` | Integration catalog |
| `/api` | `api/page.tsx` | API marketing |
| `/security` | `security/page.tsx` | Trust/security |
| `/cases` | `cases/page.tsx` | Case studies index |
| `/cases/[slug]` | `cases/[slug]/page.tsx` | Case detail |
| `/docs` | `docs/page.tsx` | Docs index |
| `/docs/[slug]` | `docs/[slug]/page.tsx` | Doc article |
| `/about` | `about/page.tsx` | Company |
| `/contact` | `contact/page.tsx` + `ContactForm.tsx` | Lead form |
| `/faq` | `faq/page.tsx` | FAQ |
| `/partners` | `partners/page.tsx` | Partners |
| `/implementation` | `implementation/page.tsx` | Implementation |
| `/privacy` | `privacy/page.tsx` | Legal |
| `/terms` | `terms/page.tsx` | Legal |

**Adjacent public-adjacent routes (outside `(public)` group):**

| Route | File | Notes |
|-------|------|-------|
| `/subscribe` | `[locale]/subscribe/page.tsx` | Billing/plan selection |
| `/share/proof/[token]` | `[locale]/share/proof/[token]/page.tsx` | Proof pack (customer-facing) |
| `/invite/accept` | `[locale]/invite/accept/page.tsx` | Team invite |

---

## 4. Auth pages

| Route | File | Components |
|-------|------|------------|
| `/login` | `(auth)/login/page.tsx` | `Input`, `Button`, `AuthProviderButtons` |
| `/register` | `(auth)/register/page.tsx` | Same pattern |
| `/telegram` | `(auth)/telegram/page.tsx` | Telegram auth callback |
| `/telegram/start` | `(auth)/telegram/start/page.tsx` | Telegram start |

Auth uses centered card on `bg-aistroyka-bg-primary`, brand logo image, minimal decoration.

---

## 5. Dashboard and manager surfaces (~69 pages)

### 5.1 Shell and navigation

- **`components/DashboardShell.tsx`** — Sidebar (fixed `bg-aistroyka-surface`), top bar, date filter, locale switcher, onboarding banners, AI guide panel.
- **`components/Nav.tsx`**, **`components/NavLogout.tsx`**
- **`components/dashboard-nav.utils.ts`**

### 5.2 Core dashboard routes

| Area | Example routes |
|------|----------------|
| Overview | `/dashboard` |
| Projects | `/dashboard/projects`, `/dashboard/projects/[id]/*` |
| Tasks | `/dashboard/tasks`, `/dashboard/tasks/[id]` |
| Reports | `/dashboard/reports`, `/dashboard/daily-reports/*` |
| Workers | `/dashboard/workers/*` |
| Contractors | `/dashboard/contractors/*` |
| Approvals | `/dashboard/approvals` |
| Alerts | `/dashboard/alerts` |
| AI | `/dashboard/ai`, `/dashboard/ai/[id]` |
| Devices | `/dashboard/devices` |
| Governance | `/dashboard/governance/*` |
| Support | `/dashboard/support` |
| Help | `/dashboard/help` |
| Settings | `/dashboard/settings/auth` |
| Workload | `/dashboard/workload` |
| Notifications | `/dashboard/notifications` |
| Billing | `/billing`, `/billing/return`, `/billing/cancel` |
| Team | `/team` |
| Portfolio | `/portfolio` |
| Legacy projects | `/projects/*` |

### 5.3 Project detail sub-surfaces (manager)

Under `/dashboard/projects/[id]/`:

- Owner view, defects, discussions, change orders, service requests, handover pack
- **Client/stakeholder sub-routes** under `.../client/*` (defects, discussions, change orders, service requests)

### 5.4 Intelligence / AI UI components

| Component | Path |
|-----------|------|
| `ProjectHealthPanel` | `components/intelligence/` |
| `AlertFeed`, `RiskList`, `RecommendationList` | |
| `CopilotSummaryPanel`, `IntelligenceCard` | |
| `ManagerActionView`, `EvidenceCoverageCard` | |
| `CopilotChatPanel` | `lib/features/ai/components/` |

### 5.5 Approvals, documents, onboarding

| Component | Path |
|-----------|------|
| `ReportApprovalCard`, histories | `components/approvals/` |
| `OnboardingWizard`, `OnboardingGate` | `components/onboarding/` |
| Plan-fit screens | `components/onboarding/plan-fit/` |
| `StakeholderActivityBlock`, timeline blocks | `components/projects/` |

### 5.6 Portal (stakeholder)

| Route | File |
|-------|------|
| `/portal` | `dashboard/portal/page.tsx` |
| `/portal/projects` | `dashboard/portal/projects/page.tsx` |

### 5.7 Admin surfaces

| Route | Area |
|-------|------|
| `/admin` | Admin home |
| `/admin/push`, `/admin/jobs` | Ops |
| `/admin/leads/*` | CRM leads |
| `/admin/ai/*` | AI admin, expert review, training consent, security, requests |
| `/admin/operator` | Operator smoke |
| `/admin/trust`, `/admin/system`, `/admin/governance` | Platform |
| `/admin/billing-pilot` | Billing pilot |

### 5.8 Owner console

| Route | File |
|-------|------|
| `/owner` | `(owner)/owner/page.tsx` + `owner-console-client.tsx` |

Dense operational UI; not marketing-grade.

---

## 6. Reusable UI components

### 6.1 Public

| Component | Path | Status |
|-----------|------|--------|
| `PublicHeader` | `components/public/PublicHeader.tsx` | Spike: glass nav |
| `PublicFooter` | `components/public/PublicFooter.tsx` | Classic footer |
| `LiquidGlass` | `components/public/liquid-glass/LiquidGlass.tsx` | **Exploratory spike** |
| `LiquidGlassFilter` | `components/public/liquid-glass/LiquidGlassFilter.tsx` | **Exploratory spike** |
| `PublicAmbientBackground` | `components/public/PublicAmbientBackground.tsx` | **Exploratory spike** |
| `GlassIntensityControl` | `components/public/GlassIntensityControl.tsx` | **Exploratory spike** |
| `HeroSitePreview` | `components/public/HeroSitePreview.tsx` | **Exploratory spike** |

### 6.2 Design system primitives (`components/ui/`)

`Button`, `Input`, `Card`, `Panel`, `Modal`, `Table`, `TablePagination`, `StatCard`, `Tabs`, `Chip`, `Badge`, `Alert`, `DropdownMenu`, `Toast`, `DateRangePicker`, `AIInsightCard`, `Icon`

**Note:** `Panel.tsx` already uses `backdrop-blur-sm` — early glassmorphism, not Liquid Glass architecture.

### 6.3 Brand

| Asset | Path |
|-------|------|
| Logo component | `components/brand/Logo.tsx` |
| SVG wordmark, helmet, icons | `public/brand/*.svg` |
| PNG logos (runtime) | Referenced as `/brand/aistroyka-logo.png` in schema |

---

## 7. Design system files

| File | Purpose |
|------|---------|
| `app/design-tokens.css` | **Canonical CSS variables** (colors, type, spacing, radius, motion, shadows) |
| `app/globals.css` | Tailwind layers; `.btn-primary`, `.card`, `.public-*` utilities |
| `tailwind.config.ts` | Maps tokens to Tailwind theme |
| `lib/design/colors.ts` | TS token mirror |
| `lib/design/typography.ts` | Type scale |
| `lib/design/spacing.ts` | Spacing scale |
| `lib/design/radius.ts` | Radius scale |
| `lib/design/shadows.ts` | Elevation |
| `lib/design/design-tokens.ts` | Aggregated export |
| `scripts/check-raw-colors.mjs` | Design lint (`bun run check:design`) |

**Missing (planned in LG-1, not present as canonical):**

- `lib/design/liquid-glass.ts`
- `components/design/LiquidGlass.tsx` (canonical location)
- `public/effects/glass-filter.svg`

**Exploratory (spike, non-canonical path):**

- `styles/liquid-glass.css`
- `components/public/liquid-glass/*`

---

## 8. Styling architecture

```
design-tokens.css (:root --aistroyka-*)
        ↓
tailwind.config.ts (aistroyka-* utilities)
        ↓
globals.css (@layer components: btn-primary, card, input-field)
        ↓
Page components (inline Tailwind + legacy --bg-main aliases)
```

**Legacy aliases** still used on some public pages: `--bg-main`, `--bg-card`, `--text-muted`, `--radius-main` (defined in `globals.css` `:root`).

**i18n:** `messages/{en,ru,es,it}.json` — public copy under `public.*`.

**Fonts:** Loaded in root layout (`--font-heading`, `--font-body`).

---

## 9. Brand assets

| Asset | Usage |
|-------|-------|
| Construction yellow `#F5C518` | Primary accent, CTA gradient, AI signal |
| Deep navy `#040a18` | Primary background |
| Neural blues | Ambient gradients (`--aistroyka-neural-core/accent`) |
| Hard-hat logo / wordmark | Header, auth, sidebar |

Brand tone today: **serious AI construction SaaS**, uppercase headings on marketing, operational density in dashboard.

---

## 10. Liquid Glass skill assets (reference only)

Installed skill: `~/.cursor/skills/liquid-glass-app-site/`

| Asset | Role |
|-------|------|
| `SKILL.md` | Workflow + checklist |
| `reference/01-design-principles.md` | Layer hierarchy, material variants |
| `reference/02-css-implementation.md` | 4-layer CSS + SVG displacement |
| `reference/03-animation-patterns.md` | Spring easing, materialization |
| `reference/04-concept-and-content.md` | Product metaphor, page structure |
| `templates/glass-component.css` | `.lg` class system |
| `templates/glass-filter.svg` | `feDisplacementMap` filters |
| `templates/landing-page-demo.html` | Fintech demo — **do not copy for AISTROYKA** |

Skill origin bias: **mobile app promo sites**. AISTROYKA requires adaptation for **B2B construction operations platform**, not App Store landing clone.

---

## 11. Risks before redesign

| Risk | Severity | Notes |
|------|----------|-------|
| Exploratory spike bypasses LG-1 | High | Uncommitted glass code may diverge from planned `components/design/` architecture |
| Skill ≠ product fit out of box | High | Demo is consumer fintech; AISTROYKA is operational B2B |
| Customer finance isolation | Critical | Client/owner surfaces must not gain decorative glass over internal financial state (roadmap rule) |
| Legacy CSS variable mix | Medium | `--bg-card` vs `--aistroyka-surface` inconsistency on public pages |
| `Panel` blur precedent | Medium | Dashboard may inherit wrong glass patterns |
| GPU / battery cost | Medium | Glass on data-heavy dashboard = performance regression |
| Safari/Firefox displacement gap | Medium | Chromium-only refraction; fallback must be designed |
| E2E / pilot tests | Medium | Public header testids (`cta.public.*`) must remain stable |
| Volta/ESLint env | Low | Local `bun run lint` failed (Volta); CI may still pass |
| i18n drift | Low | New UI strings require en/ru/es/it |
| OpenNext / cf:build | Medium | SVG filters + backdrop-filter must not break Worker bundle |

---

## 12. Validation snapshot (LG-0)

```text
git status: modified public layout/home/header/globals + untracked liquid-glass spike files
bun run lint: FAILED locally (Volta error exit 126) — environment toolchain issue, not product code verdict
```

---

## 13. Page count summary

| Surface | Approx. routes |
|---------|----------------|
| Public marketing | 24 |
| Auth | 4 |
| Dashboard/manager | ~69 |
| Admin | ~15 |
| Owner | 1 |
| Other (subscribe, invite, proof, smoke) | 4 |
| **Total page.tsx** | **~106** |

Liquid Glass redesign scope for LG-2–LG-4 should target **shells + hero moments + key cards**, not all 106 pages equally.
