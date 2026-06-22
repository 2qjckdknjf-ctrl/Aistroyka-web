# LG-4.0 Legacy Public Routes — Inventory

**Date:** 2026-06-18  
**Phase:** LG-4.0 — Audit only  
**Branch:** `design/liquid-glass-public-shell-lg2a`  
**Prerequisite:** LG-3.3 Pricing + LG-3.4 Enterprise committed (`108c7941`)

---

## Scope

Audit targets (8 routes):

| Route | File | Nav | Sitemap |
|-------|------|-----|---------|
| `/solutions` | `solutions/page.tsx` | Header + Footer | ✅ |
| `/workflows` | `workflows/page.tsx` | Header + Footer | ✅ |
| `/integrations` | `integrations/page.tsx` | Header + Footer | ✅ |
| `/implementation` | `implementation/page.tsx` | Footer only | ✅ |
| `/security` | `security/page.tsx` | Header + Footer | ✅ |
| `/api` | `api/page.tsx` | Header + Footer | ✅ |
| `/ai-demo` | `ai-demo/page.tsx` + `AiDemoSimulator.tsx` | Header + Footer | ✅ |

---

## Canonical baseline (LG-1.x – LG-3.4)

Modernized pages use:

- `PublicPageHero`, `PublicFeatureGrid`, `PublicTimelineSection`, `PublicProofSection`, `PublicCTASection`
- `public.cta.*` trio (Launch pilot / Contact us / Get presentation)
- Glass budget ≤ 3 nodes (GlassNav + 1 highlight + floating CTA)
- Full i18n — no hardcoded English section headings
- Distinct page ownership per architecture matrix

---

## Legacy cluster summary

| Route | Shell | LG components | Canonical CTA trio | Glass | Hardcoded EN | Footer CTA |
|-------|-------|---------------|-------------------|-------|--------------|------------|
| Solutions | Legacy | ❌ | ❌ none | 0 | ❌ meta as body | ❌ |
| Workflows | Legacy | ❌ | ⚠️ Contact only | 0 | ❌ | ❌ |
| Integrations | Legacy | ❌ | ❌ custom CTAs | 0 | ✅ h2 | ❌ |
| Implementation | Legacy | ❌ | ❌ custom CTAs | 0 | ✅ h2 | ❌ |
| Security | Legacy | ❌ | ❌ none | 0 | ❌ meta as body | ❌ |
| API | Legacy | ❌ | ❌ custom CTAs | 0 | ✅ code block | ❌ |
| AI Demo | Legacy + client | ❌ | ⚠️ Try demo only | 0 | ❌ | ❌ |

---

## Inbound links from canonical pages

| Legacy route | Canonical inbound |
|--------------|-------------------|
| `/integrations` | Features (tile + cross-link) |
| `/api` | Features (tile) |
| `/ai-demo` | AI Construction Control (related strip) |
| `/security` | Enterprise (secDataHandling tile) |
| `/implementation` | Enterprise (rollChangeManagement tile) |
| `/solutions` | Nav only |
| `/workflows` | Nav only |

---

## i18n namespaces (leaf key counts, EN)

| Namespace | ~Keys | Quality notes |
|-----------|-------|---------------|
| `public.solutions` | 11 | Persona titles + Desc; meta reused as body |
| `public.workflows` | 14 | Examples aspirational; no Desc on benefits |
| `public.integrations` | 18 | Status labels; non-canonical CTAs |
| `public.implementation` | 12 | Phase names only; hardcoded "Phases" |
| `public.security` | 11 | Body keys present; no hero structure |
| `public.api` | 18 | DX bullets; mock code in TSX |
| `public.aiDemo` | ~25+ | Simulator strings; product demo CTA |

---

## Cross-cutting findings

1. **All 7 routes** are pre–LG-2B legacy shells.
2. **None** use `PublicCTASection` floating canonical trio.
3. **Five routes** have non-canonical or missing conversion CTAs.
4. **Four routes** contain hardcoded English in TSX.
5. **Features + Enterprise** already link to Integrations, API, Security, Implementation, AI Demo — legacy quality creates **P1 trust gap** on canonical outbound links.

---

## Per-route audit documents

| Route | Document |
|-------|----------|
| Solutions | `LG40_SOLUTIONS_AUDIT.md` |
| Workflows | `LG40_WORKFLOWS_AUDIT.md` |
| Integrations | `LG40_INTEGRATIONS_AUDIT.md` |
| Implementation | `LG40_IMPLEMENTATION_AUDIT.md` |
| Security | `LG40_SECURITY_AUDIT.md` |
| API | `LG40_API_AUDIT.md` |
| AI Demo | `LG40_AI_DEMO_AUDIT.md` |

Supporting: `LG40_OWNERSHIP_MATRIX.md`, `LG40_PHASE_PLAN.md`, `LG40_GLOBAL_AUDIT.md`
