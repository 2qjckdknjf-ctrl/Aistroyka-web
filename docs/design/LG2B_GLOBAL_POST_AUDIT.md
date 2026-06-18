# LG-2B Global Post-Audit

**Date:** 2026-06-18  
**Follows:** `LG2B_GLOBAL_CLOSURE_AUDIT.md`  
**Branch:** `design/liquid-glass-public-shell-lg2a`

---

## A. Global findings

1. **LG-2B first-wave pages (Platform → Contact)** were implemented consistently: `PublicPageHero` (`split-visual`, `ctas={false}`), shared grids/timelines/proof, `PublicCTASection` floating with `public.cta.*`, expanded i18n in EN/RU/ES/IT.

2. **Homepage was the only scoped P1 blocker:** the lower final band still used a single "Request Demo" button despite LG-2A hero already exposing the canonical three-tier CTA stack.

3. **Navigation is aligned:** `PublicHeader` exposes Contact us (secondary), Cabinet, Login — no Request Demo in the chrome.

4. **Glass budgets hold** on all seven pages; homepage stays at the LG-2A cap of six nodes. Final CTA uses solid `band` variant deliberately.

5. **Content ownership** is clean on dedicated pages; homepage retains teaser overlap (P3, phase-2 dedupe).

6. **Phase-2 routes** (`/pricing`, `/workflows`, `/enterprise`) still carry legacy demo CTAs — outside LG-2B mandate but logged as tails.

---

## B. Fixes applied (this pass)

| Change | Rationale |
|--------|-----------|
| `PublicHomeContent.tsx` — hero labels from `public.cta` | Eliminate duplicate CTA i18n (P2) |
| `PublicHomeContent.tsx` — final section → `PublicCTASection variant="band"` | Canonical three-tier CTAs; no extra glass node (P1) |
| `messages/{en,ru,es,it}.json` — rewrite `finalCtaSubtitle`, `pricingTeaserSubtitle` | Remove demo sales language (P1/P2) |
| `messages/{en,ru,es,it}.json` — remove dead home CTA keys | `ctaLaunchPilot`, `ctaContact`, `ctaPresentation`, `ctaDemo`, `finalCtaButton` |

**Uncommitted prior work included:** LG-2B.6 Contact redesign (`contact/page.tsx`, `ContactConversionVisual.tsx`, expanded `public.contact.*`).

---

## C. Remaining risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `/pricing` `bookDemo`, `/workflows` `requestDemo`, `/enterprise` `ctaDemo` | P3 | Phase-2 CTA migration per `LG2B_CTA_ARCHITECTURE.md` |
| Homepage lower-section content overlap with Platform/Mobile/Copilot | P3 | Phase-2 homepage dedupe per `LG2B_CONTENT_DEDUP_AUDIT.md` |
| `public.nav.requestDemo` key orphaned from header | P3 | Remove or rewire when `/workflows` refactored |
| LG-2B.6 + global fixes not yet committed | Process | User commit when ready |
| `LG2B_GLASS_GOVERNANCE.md` per-page targets vs implemented counts | Doc drift | Reconcile in phase-2 doc pass (counts still ≤ global max) |

No P1/P2 risks remain on the **LG-2B mandated page set**.

---

## D. Validation

Executed from repo root (`PATH="$HOME/.bun/bin:/usr/bin:/bin"`):

| Command | Result |
|---------|--------|
| `bun run --cwd apps/web check:design` | ✅ PASS |
| `bun run lint` | ✅ PASS |
| `cd apps/web && bun ../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` | ✅ PASS |
| `bun run i18n:check` | ✅ PASS |
| `I18N_CHECK_ALL=1 bun run i18n:check` | ✅ PASS (2921 leaf keys) |
| `bun run build` | ✅ PASS |
| `bun run cf:build` | ✅ PASS |

---

## E. Verdict

### **LG-2B FULLY CLOSED**

**Rationale:** All seven marketing pages plus home hero/final CTA conform to canonical CTA architecture, glass budgets, i18n parity, and accessibility checks. P1/P2 issues on scoped surfaces are fixed and validation is green. Phase-2 demo CTAs and homepage dedupe are documented tails — not blockers for LG-2B wave closure.

**Next (out of scope here):** Commit LG-2B.6 + global closure fixes; begin phase-2 route refactors only after explicit roadmap authorization.
