# LIQUID_GLASS_REDESIGN_AUDIT — AISTROYKA.AI

**Phase:** LG-0  
**Date:** 2026-06-18  
**Purpose:** Design diagnosis before Liquid Glass implementation

---

## 1. What already works visually

| Strength | Evidence |
|----------|----------|
| **Coherent dark brand** | `design-tokens.css`: navy `#040a18`, construction yellow `#F5C518`, neural ambient gradients |
| **Token discipline** | Tailwind `aistroyka-*` mapping; `check:design` script for raw colors |
| **iOS-scale typography** | Font size tokens mirror Apple scale; readable hierarchy in dashboard |
| **Operational seriousness** | DashboardShell is dense but professional; intelligence panels communicate trust |
| **Public IA is complete** | 24 marketing routes cover platform, AI, mobile, enterprise, security |
| **Accessibility baseline** | Focus rings on interactive elements; `sr-only` labels in header; touch min 44px |
| **Motion restraint in product** | Dashboard avoids decorative animation; `motion-reduce` on buttons |
| **Customer surface separation exists** | `/dashboard/projects/[id]/client/*` routes isolated from manager views |
| **Brand assets** | Helmet/wordmark SVGs; Logo component with wordmark/icon variants |

---

## 2. What is inconsistent

| Issue | Where | Impact |
|-------|-------|--------|
| Dual token namespaces | Public pages mix `--aistroyka-*` and legacy `--bg-main` / `--text-muted` | Visual drift between sections |
| Marketing vs dashboard voice | Public: uppercase hero; dashboard: operational labels | Brand feels like two products |
| Card patterns | `.card`, `.card-elevated`, inline bordered divs, `Panel` with blur | No single surface primitive |
| Header treatment | Public: sticky bar; dashboard: solid sidebar | No unified navigation material |
| Exploratory glass spike | `components/public/liquid-glass/` vs planned `components/design/` | Architecture debt before LG-1 |
| Blur without refraction | `Panel`, `PublicHeader` (pre-spike), auth cards | Reads as 2020 glassmorphism, not Liquid Glass |
| Section rhythm on home | Alternating flat `bg-main` / `bg-card` bands | Lacks depth narrative; feels template-like |

---

## 3. What is too flat / basic

| Surface | Gap |
|---------|-----|
| Public inner pages (`/features`, `/faq`, `/docs`) | Text + bordered cards; no product metaphor |
| Auth login/register | Functional card; no premium “operational cockpit” entry |
| Dashboard shell | Solid sidebar; no adaptive navigation material |
| Marketing hero (pre-redesign) | Gradient orbs only; no signature “site visibility” moment |
| Mobile promo page | Likely static; missed opportunity for device mock in glass |
| Subscribe flow | Billing UI separate from brand elevation |

**Verdict:** Public marketing is the flattest layer relative to product ambition. Dashboard is appropriately flat for data density but shell could gain **light** material depth without touching tables.

---

## 4. Where Liquid Glass is appropriate

Per skill layer hierarchy (content → navigation glass → overlay):

| Surface | Glass role | Material variant |
|---------|------------|-------------------|
| Public global nav | Floating capsule; densifies on scroll | Regular → Prominent |
| Public hero accent | One signature floating panel (site preview / AI lens) | Accent + single `float` |
| Feature cards (3–5 max per viewport) | Interactive capability tiles | Regular + glow on hover |
| Final CTA band | Prominent panel | Prominent |
| Auth card container | Single glass login panel over ambient field | Soft |
| Dashboard top bar (future) | Optional thin glass strip | Soft |
| Modal / popover shells | Overlay navigation | Prominent |
| Mobile promo device frame | Clear over media mock | Clear + dim plate |
| iOS 27 intensity control | User-adjustable tint density | System preference + slider |

**AISTROYKA-specific fit:** Glass supports metaphor of **transparent construction control** — navigation and “lens” moments only.

---

## 5. Where Liquid Glass is dangerous

| Surface | Why dangerous |
|---------|---------------|
| **Data tables** (`Table`, reports lists, leads admin) | Readability, scroll performance, resize reflow cost |
| **Copilot chat transcript** | Long text on glass = illegible + GPU waste |
| **Approval queues with status chips** | Operational scanning needs solid contrast |
| **Owner console** | Dense JSON/debug views; glass undermines trust |
| **Client/owner commercial views** | Risk of “hiding” or aestheticizing financial/commercial artifacts; roadmap isolation |
| **Forms with many inputs** | Glass behind inputs reduces affordance |
| **Billing / pricing tables** | Numbers must be unambiguous |
| **PDF/document viewers** | Content layer must stay opaque |
| **Alert feeds with severity color** | Semantic color must not compete with refraction |
| **Nested modals + sidebar + header all glass** | “Glass on glass” anti-pattern |

---

## 6. Accessibility risks

| Risk | Mitigation required in LG-1 |
|------|-------------------------------|
| Text contrast on glass < 4.5:1 | Tint plate under complex backgrounds; `--on-light` / `--on-dark` classes |
| `prefers-reduced-transparency` | Identity fallback: opaque surface tokens |
| `prefers-reduced-motion` | Disable float, sweep, spring overshoot; fade only |
| Keyboard focus on glass nav | Preserve visible focus ring outside sheen layer |
| Intensity slider | Accessible label, keyboard operable, persisted preference optional |
| Screen reader noise from SVG filters | `aria-hidden` on filter SVG; no semantic impact |
| Color-only status in hero preview | Pair with text labels (already in spike) |

---

## 7. Performance risks

| Risk | Source | Guardrail |
|------|--------|-----------|
| GPU compositing | Each `.lg` = backdrop-filter + optional displacement | Max 4–6 visible glass nodes |
| Filter recalculation | Animating width/height | Only `transform` / `opacity` |
| Mobile battery | feDisplacementMap on small screens | Disable displacement `@media (max-width: 480px)` per skill |
| Scroll jank | Sticky glass header + many refractors | Single nav glass; `contain: layout style paint` |
| OpenNext bundle | Inline SVG filters in layout | One global filter mount |
| Lighthouse CLS | Float animation on hero | Reserve layout space; `motion-reduce` off |

---

## 8. Product trust risks

| Risk | Mitigation |
|------|------------|
| Looks like crypto/fintech toy | Avoid liquid/money metaphors; use construction clarity language |
| Over-glassified = less serious | Keep dashboard data on solid surfaces |
| Mock metrics on home (`500+`, `12K+`) | Do not add glass that draws attention to unverified numbers; product review |
| AI demo simulators | Glass OK on chrome; simulator content stays solid |
| Customer sees internal ops aesthetic | Client routes keep calmer, document-forward UI |
| Decorative motion on incidents/alerts | No animation on alert severity surfaces |

---

## 9. Surface classification matrix

### A. HIGH PRIORITY REDESIGN

| Surface | Rationale |
|---------|-----------|
| Public home `/` | Primary brand entry; hero metaphor |
| Public layout shell | Nav + ambient + filter mount |
| `/mobile` | App promo; skill-native use case |
| `/copilot`, `/ai-construction-control` | AI differentiation story |
| `/platform` | Product story hub |
| Auth login/register shell | First product touch after marketing |
| `DashboardShell` header strip only | Manager cockpit entry (LG-4) |

### B. LIGHT POLISH ONLY

| Surface | Rationale |
|---------|-----------|
| `/features`, `/solutions`, `/enterprise` | Reuse `PublicPageHero` + section templates |
| `/pricing` | Solid plan cards; glass on CTA only |
| `/faq`, `/docs`, legal pages | Readability first |
| `/contact` | Form on solid card; glass on page header |
| Onboarding banners | Subtle elevation bump, not full glass |
| Intelligence summary cards | Optional soft tint; no displacement |
| Subscribe page | Brand-consistent header only |

### C. DO NOT GLASSIFY

| Surface | Rationale |
|---------|-----------|
| All `Table` / report lists / admin grids |
| `CopilotChatPanel` message area |
| Owner console |
| Admin ops (jobs, leads table, diagnostics) |
| Approvals queues |
| Client defect/change-order detail tables |
| Billing line items |
| `global-error.tsx` emergency UI |
| Proof pack document view |

### D. NEEDS PRODUCT REVIEW FIRST

| Surface | Question |
|---------|----------|
| `/dashboard/projects/[id]/client/*` | How much brand glass is appropriate for customer-facing commercial artifacts? |
| `/share/proof/[token]` | External stakeholder trust vs marketing polish |
| `/subscribe` | Does glass imply pricing transparency we can defend? |
| Home metrics block | Are displayed numbers approved for prominence? |
| Stakeholder portal `/portal` | Separate calmer design language? |
| Manager project overview | Which KPIs may appear in glass accent panels? |

---

## 10. Exploratory spike assessment (working tree)

**Files:** `styles/liquid-glass.css`, `components/public/liquid-glass/*`, modified `PublicHomeContent`, `PublicHeader`, `(public)/layout.tsx`

| Aspect | Spike status | LG-1 action |
|--------|--------------|-------------|
| 4-layer architecture | Implemented | Migrate to canonical paths |
| SVG filter | Implemented | Move to `public/effects/` or shared component |
| Intensity slider | Implemented | Wire to design tokens |
| Glass budget (4–6) | Partially respected after iteration | Enforce via lint/review |
| Location `components/public/` | Wrong layer for dashboard reuse | Relocate to `components/design/` |
| i18n | Partial (`public.glass`, `heroPreview`) | Complete in LG-2 |
| Tests | None added | Add visual/regression notes in LG-5 |

**Recommendation:** Treat spike as **reference implementation**, not production merge without LG-1 refactor.

---

## 11. Audit verdict

| Dimension | Status |
|-----------|--------|
| Brand foundation | Strong enough to extend |
| Skill fit | Good for public + shell; requires B2B adaptation |
| Technical readiness | Spike proves feasibility; architecture not finalized |
| Risk profile | Manageable if layer rules enforced |
| Blockers | Product review on client surfaces; spike consolidation |

**Ready for LG-1 planning:** YES  
**Ready for blind full-site glass rollout:** NO
