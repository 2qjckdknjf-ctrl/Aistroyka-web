# Switching Costs Strategy

**Phase 13 — Strategic Moat & Category Leadership**  
**Digital project history, digital twin persistence, AI learning continuity, cross-project analytics, operational lock-in levers.**

---

## Digital project history

- **Concept:** **Long-lived, queryable history** of projects, tasks, reports, and media. Not just “current state”—full timeline: what was done, when, by whom, and what AI concluded. Export and API for “as-built” and audit. Phase 12 DIGITAL_TWIN: time-layered state.
- **Implementation:** (1) No deletion of core data (soft delete or retention policy only). (2) “State as of date” query or snapshot: project/tasks/reports as of D. (3) Audit log and optional change log for key entities. (4) Export: project history package (reports, media refs, analysis) for handover or archive.
- **Value:** Customer’s **digital record** lives in AISTROYKA. Switching means losing easy access to history or re-exporting; staying means one place for “what happened.” Operational lock-in through value, not coercion.
- **Ethics:** Clear retention and export; no hidden lock-in. Support data portability (export) while making “stay” the better experience.

---

## Digital twin persistence

- **Concept:** **Twin-ready data** (tasks, media, reports, optional BIM refs) with time dimension. Persisted and queryable; external twin or 4D/BIM tools consume via API. Phase 11 BIM_INTEGRATIONS, Phase 12 DIGITAL_TWIN. “Persistence” = we are the **system of record** for field state and progress over time.
- **Implementation:** (1) Optional bim_element_id / location on task and report. (2) Time-layered API: state as of date; progress timeline. (3) Event or feed for “what changed” (optional webhook). (4) No full BIM model in our DB; we link and expose. Partners build twin on top of our feed.
- **Value:** Once ERPs, BIM tools, or owners rely on our feed for “as-built” or progress, switching costs rise. We become the **source of truth** for field-to-office. Lock-in through ecosystem dependency.
- **Principle:** Increase value (twin, handover, compliance) so that leaving is costly in terms of lost capability, not by blocking export.

---

## AI learning continuity

- **Concept:** **Models and benchmarks improve** with usage (anonymized flywheel; Phase 12 AI_DATA_FLYWHEEL). Tenants who opt in get better defaults and “vs industry” over time. Switching to a competitor means losing (1) historical AI insights tied to their data and (2) participation in improving industry benchmarks.
- **Continuity:** (1) Per-tenant: their past analysis and copilot history stay in product; new vendor has no history. (2) Industry: benchmarks and indices improve with more data; staying = continued benefit from flywheel. (3) No lock-in by “secret model”; explainable and portable insights where possible.
- **Value:** Rational lock-in: “our AI gets better with your usage (anonymized)” and “your history is here.” Competitors cannot replicate industry benchmarks without equivalent data.
- **Ethics:** Opt-in for flywheel; no degradation for opt-out; transparent methodology.

---

## Cross-project analytics

- **Concept:** **Portfolio and cross-project views**: trends, benchmarks, delay rates, report cadence, risk distribution across many projects. In-product dashboards or export. Requires staying on platform to maintain continuity of analytics.
- **Implementation:** (1) Aggregations and dashboards (existing or Phase 12 copilot/analytics). (2) Optional: “Your portfolio vs industry” (anonymized benchmarks). (3) Export: CSV or API for period; but historical trends and benchmarks are best experienced in-product.
- **Value:** Manager and leadership rely on AISTROYKA for “how all projects are doing.” Switching loses unified view and benchmark continuity. Operational lock-in through analytics value.
- **Principle:** Deliver real value (insights, benchmarks); lock-in is a consequence of value, not of blocking export.

---

## Operational lock-in levers

- **Summary of levers:** (1) **Digital project history** — one place for full timeline and export. (2) **Digital twin persistence** — we are source of truth for field state; ecosystem consumes our feed. (3) **AI learning continuity** — better models and benchmarks with usage; history and “vs industry” in-product. (4) **Cross-project analytics** — portfolio view and benchmarks. (5) **Connected integrations** — ERP, BIM, documents connected to AISTROYKA; switching may require re-integrating elsewhere. (6) **Team and workflow** — roles, assignments, notifications, and habits are in AISTROYKA.
- **Use:** Increase **value and convenience** of staying; support **export and portability** so lock-in is ethical. Compete on “best place to run construction digital operations,” not on trapping data.
- **No dark patterns:** No intentional obstruction of export or cancellation. Clear terms and data portability; long-term dominance through superior value and ecosystem.

---

## Implementation principles

- **No core domain rewrite:** History and twin readiness are additive (queries, optional fields, export, API). Core entities unchanged.
- **Every initiative increases advantage:** Each lever (history, twin, AI continuity, analytics, integrations) raises the cost of leaving while raising the value of staying.
- **Scalable ecosystems:** Twin and integrations mean partners and ERPs depend on our feed; lock-in at ecosystem level.
- **Trust:** Transparent retention, export, and opt-in; no surprise lock-in. Trust sustains dominance.
