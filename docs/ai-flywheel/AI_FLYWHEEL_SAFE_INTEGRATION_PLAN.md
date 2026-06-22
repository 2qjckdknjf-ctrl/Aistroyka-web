# AI Flywheel Safe Integration Plan

**Date:** 2026-06-17  
**Phase:** Foundation only — no training, shadow, or rollout

---

## B1. Integration principle

- **Additive only:** New column, new internal tables, new lib module under `lib/platform/ai-flywheel/`, new scripts under `scripts/ai/`
- **Feature-flagged:** All risky capabilities gated by env flags defaulting to `false`
- **No production behavior change:** Copilot, vision, intelligence paths unchanged when flags are off
- **No model training in this phase:** Dry-run export counts only; no JSONL to production stores

---

## B2. Ownership boundaries

| Layer | Responsibility |
|-------|----------------|
| **Web app (`apps/web`)** | Feature flags, consent helper, capture helpers, finance guard, PII scrub lib, dry-run script entry via lib |
| **AI jobs** | No flywheel job handlers in this sprint |
| **Scripts (`scripts/ai/`)** | CLI wrappers: scrub, verifier, export dry-run — ops/dev use only |
| **Supabase** | Schema: `tenants.ai_training_consent`, `ai_preference_pairs`, `ai_expert_reviews`; deny-all RLS |
| **R2 / queues** | Not used in foundation sprint |
| **Cloudflare Workers** | No new bindings; existing app serves all routes |

---

## B3. Data boundaries

| Boundary | Contents | Flywheel access |
|----------|----------|-----------------|
| **Tenant data** | Reports, media, chat, projects | Blocked unless `ai_training_consent = true` AND scrubbed |
| **Owner-safe data** | Customer estimates, approved commercial changes | Allowed for owner-audience examples after finance guard |
| **Internal finance data** | Margins, cost items, budget pressure | Internal-audience labels only; blocked from owner-audience export |
| **Expert review data** | Verdicts, corrections | Service-role only; never tenant/owner visible in this phase |
| **Training candidate data** | Preference pairs, scrubbed text | Service-role only; no export until future phase with full pipeline |

---

## B4. API boundary

- **Future public/internal product endpoints:** `/api/v1/*` only
- **This sprint:** No new API routes (helpers are library-only)
- **No new `/api` legacy endpoints**
- **No breaking response shape changes** to existing AI routes

---

## B5. Security boundary

- **Training/internal tables:** Service-role only (deny-all RLS)
- **No tenant role reads** on `ai_preference_pairs`, `ai_expert_reviews`
- **No owner/customer access** to flywheel tables
- **No raw private prompt logging** — scrub before any export; audit consent changes with metadata only
- **Consent default deny:** `trainingConsentFilter()` is single shared export gate

---

## B6. Rollout boundary

| Capability | This sprint | Future phase |
|------------|-------------|--------------|
| Foundation schema + helpers | Yes | — |
| Consent UI | Doc only | Admin settings |
| Feedback capture | Helper only (flag off) | UI + wiring |
| Expert review queue | Table + helper | Mobile/Telegram UX |
| Dataset export | Dry-run only | Real JSONL with full audit |
| Shadow mode | Flag exists, default off | Separate sprint |
| Student model | Not implemented | Separate sprint |
| LoRA/DPO training | Not implemented | Separate sprint |

---

## Integration map

```
┌─────────────────────────────────────────────────────────────┐
│ Production AI paths (UNCHANGED)                              │
│  copilot / vision / intelligence / action-plan               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (no import when flags off)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ lib/platform/ai-flywheel/                                    │
│  flags.ts → consent.ts → pii-scrub → finance-guard           │
│  feedback-capture.ts → expert-review.ts                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ scripts/ai/ (ops/dev)                                        │
│  scrub.ts | scrub-verifier.ts | export-dataset-dry-run.ts    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase (service role only for flywheel tables)             │
│  tenants.ai_training_consent                                 │
│  ai_preference_pairs | ai_expert_reviews                     │
└─────────────────────────────────────────────────────────────┘
```
