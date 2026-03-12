# AI Data Flywheel

**Phase 12 — AI Platformization**  
**Anonymization pipeline, model training loops, industry benchmarking, continuous learning.**

---

## Anonymization pipeline

- **Purpose:** Enable use of tenant data for industry-level benchmarking and optional model improvement without exposing tenant or user identity. All such use must be privacy-safe and contractually allowed.
- **Scope:** Only data that is explicitly eligible (e.g. opted-in or covered by DPA). Typically: aggregated stats (e.g. completion rates, delay rates), anonymized counts, or synthetic features. No raw PII; no raw photos or report text unless de-identified and aggregated.
- **Pipeline:** (1) **Extract:** From our DB, export only fields allowed for flywheel (e.g. project type, task counts, completion %, risk level counts, report frequency). No tenant_id, user_id, or free text in export. (2) **Anonymize:** Strip IDs; aggregate to region/segment if needed; optional k-anonymity or noise. (3) **Store:** In separate, access-controlled store (e.g. analytics warehouse) with no link back to tenant. (4) **Audit:** Log what was extracted and when; retention per policy.
- **Tenant control:** Opt-in or explicit DPA clause; tenant can opt out. No flywheel use for opted-out tenants.
- **Value:** Industry benchmarks; better default models; no privacy or tenant trust breach.

---

## Model training loops

- **Concept:** Use flywheel data (anonymized) to retrain or fine-tune models (e.g. stage classifier, risk calibration, delay predictor) so product improves over time. No training on raw tenant data in product; training only in isolated pipeline with anonymized or synthetic data.
- **Inputs:** Anonymized aggregates; optional labeled outcomes (e.g. “delayed” vs “on time” from aggregated stats). No per-tenant identification in training set.
- **Process:** (1) Export from anonymization pipeline. (2) Training job (offline; not in app). (3) Evaluate on holdout; compare to current model. (4) If better and approved, deploy new model/weights to product. (5) Version model; rollback if regressions.
- **Governance:** Training only on consented/anonymized data; no cross-tenant re-identification; model cards and changelog. Prefer explainable models; avoid training on sensitive attributes (e.g. demographics).
- **Value:** Better accuracy over time; industry-aligned defaults; competitive moat without compromising privacy.

---

## Industry benchmarking

- **Concept:** Compare tenant (anonymized) metrics to industry norms: e.g. “Your completion rate is in top 20%”; “Delay rate vs segment average.” Only with anonymized flywheel data and tenant opt-in.
- **Metrics:** Completion rate, report frequency, delay rate, risk-level distribution, etc. All aggregate; no project or user names.
- **Output:** In-product: “Your portfolio vs industry” (anonymous segment). Or in partner/analytics report. No identification of other tenants.
- **Value:** Motivation and context; “how am I doing” without exposing others; supports premium or analytics offerings.
- **Tenant-safe:** Tenant sees only own data and own benchmark position; industry curve is from anonymized pool.

---

## Continuous learning

- **Concept:** Over time, new data enters the flywheel (anonymized); models and benchmarks are periodically updated. Feedback loop: product usage → anonymized stats → training/benchmarks → improved product.
- **Cadence:** Anonymization export on schedule (e.g. weekly); training or benchmark refresh monthly or quarterly. No real-time learning in product; no learning from single-tenant data in isolation (to avoid memorization).
- **Explainability:** Document what data is used, how it is anonymized, and what models/benchmarks are updated. No secret sauce that violates privacy.
- **Value:** Platform gets smarter; tenants benefit from industry learning; privacy preserved.

---

## Implementation principles

- **Privacy-safe only:** No re-identification; no raw PII or raw content in flywheel unless de-identified and aggregated. Legal and DPA review before production.
- **Tenant consent and opt-out:** Clear terms; opt-out means no data used for flywheel; no degradation of core product for opt-out.
- **No core domain rewrite:** Flywheel is a separate pipeline and store; product reads models and benchmarks but does not write training data from app code. Core domain unchanged.
- **Value and trust:** Transparency (docs, model cards); continuous learning as differentiator only when done ethically and legally.
