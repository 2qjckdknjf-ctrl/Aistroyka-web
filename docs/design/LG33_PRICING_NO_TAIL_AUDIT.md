# LG-3.3 Pricing — No-Tail Audit

**Date:** 2026-06-18 (final)  
**Route:** `/[locale]/pricing`  
**Authority:** Design Governance + Public Website Closure Lead

---

## Mandated surface tail scan

| Check | Status |
|-------|--------|
| Legacy 4-tier plan cards (Starter/Pro/Business/Enterprise) | ✅ Removed |
| `metaDescription` as visible body | ✅ Removed |
| Fake list / per-seat pricing | ✅ Absent |
| Request Demo / Book Demo / Schedule Demo | ✅ Absent |
| Footer `PublicCTASection` floating | ✅ Present |
| Enterprise capability grid on Pricing | ✅ Absent — link-out only |
| Platform stack / AI pipeline on Pricing | ✅ Absent — related links only |
| Glass budget ≤ 3 incl. nav | ✅ 3 nodes |
| Single h1 | ✅ via `PublicPageHero` |
| i18n 4-locale parity | ✅ 3098 leaf keys full tree |
| Dead legacy pricing tier keys | ✅ Removed |
| Home pricing teaser pilot-first | ✅ Aligned |
| build + cf:build | ✅ PASS |

---

## Cross-page link closure

| Tail | Status |
|------|--------|
| Pricing → Platform | ✅ Related card |
| Pricing → Features | ✅ Related card |
| Pricing → Contact | ✅ Related card + CTAs |
| Pricing → Enterprise | ✅ Engagement card + related |
| Home → Pricing | ✅ Teaser section unchanged route |
| Enterprise page legacy shell | 📋 Future phase — not LG-3.3 |
| Integrations legacy page | 📋 Future phase |

---

## CTA tail scan

| Item | Classification |
|------|----------------|
| Launch pilot / Contact us / Get presentation | **KEEP** — canonical |
| Hero inline CTAs on Pricing | **KEEP** absent (`ctas={false}`) |
| `requestQuote` per tier | **REMOVED** |
| Request Demo | **KEEP** absent |

---

## Demo-language tail scan

| Surface | Sales demo language |
|---------|---------------------|
| `/pricing` | None |
| `public.pricing.*` | None |
| Pricing metadata | None |
| Modernized public pages (grep) | None |
| `/ai-demo` product mock | **Out of scope** — interactive product demo, not sales funnel |

---

## i18n tail scan

| Key group | Status |
|-----------|--------|
| `public.pricing.*` (~67 keys) | **KEEP** — canonical commercial IA |
| Removed tier keys | **REMOVED** — starter/pro/business/enterprise/*Desc/requestQuote |
| `public.home.pricingTeaser*` | **UPDATED** — 4 locales |
| Hardcoded English on Pricing page | **NONE** |
| `includedCopilotDesc` tier wording | **FIXED** EN/RU |

---

## Glass tail scan

| Node | Count |
|------|-------|
| GlassNav | 1 |
| Pilot engagement highlight | 1 |
| Pricing floating CTA | 1 |

---

## Validation results (2026-06-18)

| Command | Exit |
|---------|------|
| `bun run check:design` | 0 |
| `bun run lint` | 0 |
| `tsc --noEmit` (apps/web) | 0 |
| `bun run i18n:check` | 0 |
| `I18N_CHECK_ALL=1 bun run i18n:check` | 0 (3098 leaf keys) |
| `bun run build` | 0 |
| `bun run cf:build` | 0 |

---

## Remaining risks

| ID | Risk | Severity | Blocks closure? |
|----|------|----------|-----------------|
| R-01 | `/enterprise` page still legacy shell | P3 | No — Pricing links out; no duplication |
| R-02 | `/integrations` legacy page | P3 | No — documented future phase |
| R-03 | Dashboard `subscriptionOnboarding` plan names (Starter/Business/Enterprise) | P3 | No — private subscribe flow, not public pricing |
| R-04 | `public.nav.aiDemo` label | P3 | No — product interactive mock, not sales demo |

**No P0/P1/P2 issues.**

---

## Final verdict

# LG-3.3 CLOSED

Pricing owns commercial engagement models without fake tiers, demo sales language, or enterprise capability duplication. Validation suite green. Ready for commit when approved (not committed per user instruction).
