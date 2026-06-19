# LG-4.0 Phase Plan — Legacy Route Implementation Sequence

**Date:** 2026-06-18  
**Authority:** Lead Product Architect + Release Auditor

---

## Sequencing principles

1. **Canonical inbound first** — routes linked from LG-3.x pages before nav-only orphans.
2. **Trust/commercial risk** — honest status and CTAs before persona/automation pages.
3. **Shared i18n patterns** — each phase follows Pricing/Enterprise template.
4. **One route per phase** — atomic commits; validation gate each phase.

---

## Route scoring

| Route | Complexity | Risk | Priority | Phase |
|-------|------------|------|----------|-------|
| **Integrations** | MEDIUM | HIGH | **P1** | LG-4.1 |
| **Security** | MEDIUM | MEDIUM | **P1** | LG-4.2 |
| **Implementation** | MEDIUM | HIGH | **P1** | LG-4.3 |
| **AI Demo** | HIGH | MEDIUM | **P1** | LG-4.4 |
| **API** | MEDIUM | MEDIUM | **P2** | LG-4.5 |
| **Workflows** | MEDIUM | **HIGH** | **P2** | LG-4.6 |
| **Solutions** | LOW | MEDIUM | **P3** | LG-4.7 |

---

## Recommended execution order

### LG-4.1 — Integrations

**Why first:** Features catalog links here today (`integrations` tile + cross-link). Highest canonical outbound traffic.

**Deliverables:** Public shell IA; honest category status; canonical CTA; remove hardcoded h2; glass budget 3.

**Complexity:** MEDIUM | **Risk:** HIGH (status truth) | **Priority:** P1

---

### LG-4.2 — Security

**Why second:** Enterprise `secDataHandling` links here. Trust depth required for enterprise evaluations.

**Deliverables:** Hero + section grid; FAQ/Enterprise differentiation; canonical CTA; no meta-as-body.

**Complexity:** MEDIUM | **Risk:** MEDIUM | **Priority:** P1

---

### LG-4.3 — Implementation

**Why third:** Enterprise `rollChangeManagement` links here. Must disambiguate vs Contact/Pricing timelines.

**Deliverables:** Deployment timeline with Desc; boundary callouts; canonical CTA; i18n “Phases”.

**Complexity:** MEDIUM | **Risk:** HIGH (timeline overlap) | **Priority:** P1

---

### LG-4.4 — AI Demo (REPOSITION)

**Why fourth:** AI Control related strip links here. Client simulator — highest implementation complexity.

**Deliverables:** REPOSITION as mock satellite; shrink capability grid; canonical footer CTA; strengthen mock disclaimers; optional glass on simulator.

**Complexity:** HIGH | **Risk:** MEDIUM | **Priority:** P1

**Disposition:** **REPOSITION** — not REMOVE.

---

### LG-4.5 — API

**Why fifth:** Features `api` tile inbound. Depends on Integrations (LG-4.1) for cross-link coherence.

**Deliverables:** Developer IA; i18n mock examples; remove hardcoded code block EN; canonical CTA.

**Complexity:** MEDIUM | **Risk:** MEDIUM | **Priority:** P2

---

### LG-4.6 — Workflows

**Why sixth:** Nav-only; requires product truth audit on automation claims (P0 content risk).

**Deliverables:** Honest workflow scope; link Platform/Copilot/AI Control; canonical CTA; align Integrations `ctaWorkflow` removal.

**Complexity:** MEDIUM | **Risk:** HIGH | **Priority:** P2

---

### LG-4.7 — Solutions

**Why last:** Soft orphan; overlaps Home/Contact. Lowest incremental SEO/conversion lift after persona routes elsewhere stabilized.

**Deliverables:** Persona grid with link-outs; canonical CTA; or **decision gate** to MERGE into Contact if REWRITE adds no unique depth.

**Complexity:** LOW | **Risk:** MEDIUM | **Priority:** P3

---

## Optional consolidation (decision gate — not in LG-4.0 scope)

| Candidate | Option |
|-----------|--------|
| Solutions | MERGE into Contact `who` section + redirect `/solutions` |
| Workflows | MERGE into Platform operational loop if scope thin |

Document decision in LG-4.7 boundary audit before REMOVE.

---

## Per-phase validation gate

Each LG-4.x implementation must pass:

- `bun run check:design`
- `bun run lint`
- `tsc --noEmit`
- `bun run i18n:check` + `I18N_CHECK_ALL=1`
- `bun run build` + `bun run cf:build`
- Boundary + no-tail audit docs

---

## Estimated phase count

**7 implementation phases:** LG-4.1 through LG-4.7

No LG-4.8 required unless Partners route (`/partners`) added to scope later — **out of LG-4.0 audit**.
