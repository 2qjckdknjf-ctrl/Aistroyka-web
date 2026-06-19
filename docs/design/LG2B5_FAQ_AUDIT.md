# LG-2B.5 FAQ Page Audit

**Date:** 2026-06-18  
**Phase:** LG-2B.5 — `/faq` redesign  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Prerequisite:** LG-2B.4 (`6f4f2e5b`)

---

## 1. Page purpose (IA)

**Question answered:** “What objections stop a company from adopting AISTROYKA?”

**Canonical owner of:** adoption objections and practical clarification.

**Does NOT own:** capability map, mission essay, mobile/copilot workflows, contact form.

---

## 2. Ownership verification

| Page | Owns | FAQ avoids |
|------|------|------------|
| Homepage | AI outcome | ✅ |
| Platform | Capabilities | ✅ Points to platform for depth |
| Mobile | Field workflow | ✅ One-line + mobile page reference |
| Copilot | AI assistant workflow | ✅ One-line + copilot reference |
| About | Mission & trust philosophy | ✅ Trust FAQ is operational/legal tone |
| FAQ | Objections | ✅ |

---

## 3. Objection coverage

| Section | Questions | Topics |
|---------|-----------|--------|
| Core (6) | What is / who for / training / devices / reporting / AI for managers | Fit, devices, shallow pointers |
| Operational (6) | Implementation / active projects / approvals / internet / manager review / owner progress | Rollout, customer-finance-safe owner answer |
| Trust (4) | Data visibility / access / AI autonomy / human review | RBAC, no blind automation |

**Removed:** legacy pricing FAQ with “book a demo” — commercial questions via CTA.

---

## 4. Architecture decisions

| Decision | Rationale |
|----------|-----------|
| `PublicPageHero` `split-visual` | Concise hero + minimal FAQ visual |
| `FaqVisual` (local) | Topic map in single `GlassHeroCard` |
| `PublicFeatureCard` `variant="faq"` | Semantic `dl`/`dt`/`dd` per card |
| Three `PublicFeatureGrid` sections | Core / ops / trust — 2 columns for readable answers |
| `PublicCTASection` `floating` | Canonical CTA — no Request Demo |
| Glass budget **2** | Hero visual + CTA only — FAQ cards solid |

---

## 5. Glass node count

| Node | Component |
|------|-----------|
| 1 | `FaqVisual` → `GlassHeroCard` |
| 2 | CTA section → `GlassPanel` |

**Total:** 2 (within LG-2B.5 max 2)

---

## 6. Accessibility notes

- Single `h1` via `PublicPageHero`
- FAQ cards use `variant="faq"` → `dt`/`dd` inside `dl`
- No JS accordion — all answers visible (keyboard-friendly, no trap)
- Focus rings on CTA links via `PublicHeroCTA`
- Hero visual `aria-hidden="true"` (decorative)

---

## 7. Files touched

- `apps/web/app/[locale]/(public)/faq/page.tsx`
- `apps/web/app/[locale]/(public)/faq/FaqVisual.tsx` (new)
- `apps/web/messages/{en,ru,es,it}.json`

Legacy keys removed: `whatIs`, `whoIsFor`, `howAi`, `mobile`, `pricing` (+ `*A` answers).
