# LG-2B.3 Copilot Architecture Boundary Audit

**Date:** 2026-06-18  
**Phase:** LG-2B.3 — Copilot boundary audit (Part A)  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Prerequisite:** LG-2B.2 (`d0deb140`)

---

## 1. What does `/copilot` currently say?

| Element | Current copy (EN) | Issue |
|---------|-------------------|-------|
| Hero | “AI Copilot for construction operations” + generic decision-speed subtitle | Overlaps homepage/platform; not manager-assistant specific |
| CTAs | **Request demo** + Explore platform | **P2:** legacy “Request demo” — not canonical `public.cta.*` |
| Capabilities | 7 bullet items (summarize, risks, evidence, plan vs actual, actions, blocked tasks, exec summaries) | Partial overlap with ai-control + platform AI card |
| Patterns | 5 interaction bullets (status questions, alerts, summaries, photo analysis, decisions) | Duplicates capabilities; vague |
| Mock UI | Full fake chat + project summary + risks + actions | **P2:** dense mock; forbidden in LG-2B.3 spec |
| Human-in-the-loop | Single closing card | Good concept; needs expansion into trust/guardrails section |

**Verdict:** Page does not uniquely own “AI assistant workflow”; carries legacy demo CTA and chat mock.

---

## 2. What does `/ai-construction-control` currently say?

| Section | Focus |
|---------|-------|
| What AI analyzes | Photo progress, completeness, deviations |
| Photo workflows | Before/after, time-series, automatic analysis |
| Deviation & risk | Detection with severity and suggested actions |
| Manager insights | Recommendations prioritized by impact |
| Human-in-the-loop | Humans decide; AI supports |

**Owner:** Vision / risk / evidence **analysis mechanics** — what the AI engine inspects on photos and field data.

**Not owner:** Conversational assistant, report Q&A, follow-up tracking, learning loops.

---

## 3. What does homepage AI hero say?

| Element | Focus |
|---------|-------|
| Hero h1 | “AI construction control” |
| Subtitle | Operational lens — projects, field reports, risks, schedules |
| AI section | Photo-based analysis, deviation detection, manager insights, human-in-the-loop |
| Hero lens | Live site mock (Tower B, progress, risk, reports) |

**Owner:** Outcome teaser — **AI construction control** as product promise.

---

## 4. What does platform AI card say?

| Key | Copy |
|-----|------|
| `capConstructionAi` | Construction AI — photo and field data analysis, deviations, risks, human-in-the-loop |
| Platform timeline step AI | Analysis highlights deviations, risks, missing evidence |

**Owner:** AI as **one capability area** inside the product stack map.

---

## 5. Where is content duplicated?

| Duplication | Pages involved | Severity |
|-------------|----------------|----------|
| “Summarize reports / detect risks / missing evidence” | copilot caps, ai-control, platform AI, homepage AI section | **P2** on copilot until rewritten |
| “Human-in-the-loop” | copilot, ai-control, homepage, platform | Acceptable if copilot frames **assistant + review**, not photo analysis |
| “Manager insights / recommendations” | ai-control, homepage, copilot hero | **P2** — copilot must pivot to **ask/answer workflow** |
| Photo analysis depth | copilot pat4, ai-control entire page | copilot must **link conceptually**, not re-explain photo pipelines |
| Fake Block A / 72% / weather | copilot mock UI, homepage hero lens | **P2** — remove from copilot |
| Request Demo | copilot `ctaDemo`, homepage `finalCtaButton`, nav `requestDemo` | **P2** on copilot page body — fix in 2B.3 |

---

## 6. Where is messaging vague?

- Copilot hero targets “project managers, contractors, and owners” — too broad; **managers** are primary audience for assistant workflow.
- Capabilities list reads like ai-control feature dump without assistant framing.
- Patterns section repeats capabilities without “how you interact with Copilot.”
- Mock UI implies live conversational product without guardrail context.
- No tenant-awareness, explainability, or “no blind automation” on page today.

---

## 7. Where does “Request Demo” still appear?

| Location | Key / usage | In LG-2B.3 scope? |
|----------|-------------|-------------------|
| `/copilot` page | `public.copilot.ctaDemo` | **YES — must remove** |
| Homepage | `public.home.finalCtaButton`, `ctaDemo` | No (homepage out of scope) |
| Public nav | `public.nav.requestDemo` | No (shell out of scope) |
| Enterprise / other pages | various | No |

**Copilot page fix:** Use `PublicCTASection` + `public.cta.*` only.

---

## 8. What should `/copilot` uniquely own?

**Canonical question:** “What does the AISTROYKA AI Copilot do for managers?”

**Owns:**

- Ask project questions in natural language
- Summarize daily reports for review
- Surface risks and schedule pressure from project context
- Explain missing evidence and blocked follow-ups
- Prepare decision-ready answers (not autonomous actions)
- Human review before acting
- Product learning from reviewed corrections — **as concept only**, no Gold Memory / Expert Review internals

**Does NOT own:**

- Platform capability map → `/platform`
- Field reporting workflow → `/mobile`
- AI construction control outcome teaser → homepage
- Photo/vision analysis pipeline detail → `/ai-construction-control`
- Pricing, contact form, company mission

---

## Boundary matrix (post-2B.3 target)

| Page | Owns |
|------|------|
| Homepage | AI construction control **outcome** |
| Platform | Product **capability map** (AI as one card) |
| Mobile | **Field execution** workflow |
| AI Construction Control | **Vision/risk/evidence analysis** mechanics |
| **Copilot** | **AI assistant / intelligence workflow** for managers |

---

## Gold Memory / Expert Review mention policy

If referenced in copy:

- Frame as “reviewed corrections can improve future guidance when enabled”
- No claim that all tenants have live training loops
- No internal queue names, schema, or staging flags

---

## Audit verdict

# COPILOT BOUNDARY READY

Boundary is clear. Current `/copilot` page violates it (demo CTA, mock chat, capability dump). **LG-2B.3 Part B** may proceed to rewrite page within defined ownership.

**P1 blockers:** none (boundary definition complete)  
**P2 to fix in Part B:** copilot page demo CTA, mock UI, duplicated capability framing
