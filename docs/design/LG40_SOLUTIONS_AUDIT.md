# LG-4.0 Solutions — Audit

**Route:** `/[locale]/solutions`  
**File:** `apps/web/app/[locale]/(public)/solutions/page.tsx`

---

## 1. Current state

| Attribute | Assessment |
|-----------|------------|
| Architecture | Pre–LG-2B: single column, 5 stacked `.card` blocks |
| LG compliance | ❌ No shared public components |
| CTA compliance | ❌ **No CTAs** — conversion dead end |
| Glass compliance | 0 nodes |
| i18n | Keys present EN/RU/ES/IT; **`metaDescription` used as visible body** |
| Duplication | **High** vs Home roles, Contact who, Features personas |

---

## 2. Ownership

**Unique question:** “Who is AISTROYKA for by role and organization type?”

**Should NOT own:** capability catalog (Features), field workflow (Mobile), conversion (Contact), pricing, enterprise readiness.

---

## 3. Duplication map

| Solutions content | Peer overlap | Classification |
|-------------------|--------------|----------------|
| forDeveloper / GC / contractor / PM / field | Home `rolesTitle` + role cards; Contact `who*` section | **REWRITE** — consolidate persona framing |
| forGeneralContractorDesc multi-project | Platform, Enterprise rollout | **MERGE** link-out |
| forFieldTeamsDesc | Mobile page entire narrative | **MERGE** → `/mobile` |
| forProjectManagerDesc | Features + Copilot | **MERGE** link-out |

**Route verdict:** **REWRITE** (valid ownership, wrong execution) — not REMOVE (persona lens is unfilled elsewhere as dedicated page).

---

## 4. CTA audit

| Canonical | Present |
|-----------|---------|
| Launch pilot | ❌ |
| Contact us | ❌ |
| Get presentation | ❌ |
| Request Demo / Book Demo / Contact Sales | ✅ Absent |

---

## 5. IA recommendation (do not implement)

| Element | Recommendation |
|---------|----------------|
| Hero | `PublicPageHero` compact — “Built for your role” |
| Sections | `PublicFeatureGrid` 2-col — persona cards with link-outs (Mobile, Copilot, Enterprise, Contact) |
| Related | Platform, Features, Contact, FAQ |
| CTA | `PublicCTASection` floating — canonical trio |
| Glass | 1 highlight persona card + floating CTA = 3 with nav |

---

## 6. Risks

| ID | Risk | Severity |
|----|------|----------|
| S-01 | No conversion path | P1 |
| S-02 | Duplicates Home/Contact without adding depth | P1 |
| S-03 | Orphan page — nav-only discovery | P2 |
| S-04 | metaDescription as body | P2 |
