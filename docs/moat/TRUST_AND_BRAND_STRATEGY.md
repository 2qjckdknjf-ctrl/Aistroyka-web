# Trust & Brand Moat Strategy

**Phase 13 — Strategic Moat & Category Leadership**  
**Certifications roadmap, security posture, public SLA, uptime transparency, compliance programs, enterprise trust signals.**

---

## Certifications roadmap

- **Concept:** **External certifications** that enterprises and regulated sectors expect: SOC 2 (Type I, then Type II), ISO 27001, optional ISO 27701 (privacy), regional (e.g. GDPR readiness, local data residency). Roadmap = planned sequence and timeline; not all at once.
- **Prioritization:** (1) SOC 2 Type I: baseline for SaaS and US enterprise. (2) SOC 2 Type II: operational consistency. (3) ISO 27001: global enterprise and RFPs. (4) Privacy: ISO 27701 or equivalent where required. Document “Certifications” page with status (in progress, achieved, renewal date).
- **Value:** Removes objection in sales; required for many tenders; trust moat. Competitors without certs are at disadvantage in enterprise.
- **Communication:** Public “Security & Compliance” or “Trust” page: list certs, scope, and link to summary or audit availability (per cert rules).

---

## Security posture communication

- **Concept:** **Public security page** (e.g. trust.aistroyka.com or security section on site): what we do for security, compliance, and privacy. No confidential details; clear and honest.
- **Content:** (1) Data: encryption in transit and at rest; tenant isolation; no cross-tenant access. (2) Access: role-based access; audit logs; secure auth (Supabase, MFA where offered). (3) Infrastructure: hosting (e.g. Supabase/Cloudflare); redundancy and backup. (4) SDLC: secure development, dependency review, incident process. (5) Certifications: link to roadmap and achieved certs. (6) Contact: security@ for reports and questions.
- **Value:** Reduces fear and uncertainty; enterprise buyers and infosec can evaluate. Trust moat through transparency.
- **Update:** Review quarterly; update on certs and material changes.

---

## Public SLA

- **Concept:** **Published Service Level Agreement**: uptime target (e.g. 99.9%), excluded items (planned maintenance, customer-caused), measurement window, and remedy (e.g. credit) for breach. Tier-based if needed (e.g. Enterprise gets higher SLA).
- **Placement:** Legal or Trust page; linked from terms and sales. Version and effective date.
- **Measurement:** Uptime from monitoring (e.g. health checks); public status page can show current and historical. SLA and status page align.
- **Value:** Enterprise expectation; differentiator when competitors have no SLA. Trust and accountability.

---

## Uptime transparency

- **Concept:** **Public status page**: current status (operational, degraded, outage), recent incidents, planned maintenance. Historical uptime (e.g. 99.95% last 90 days). Optional: subscribe to status updates (email/SMS).
- **Tooling:** Status page product (e.g. Statuspage, Better Uptime) or custom; fed from same health checks used for SLA. No sensitive detail; customer-facing only.
- **Value:** Trust through transparency; fewer “is it down?” support tickets; shows we take reliability seriously.
- **Link:** From main site and Trust page; SLA references status for measurement.

---

## Compliance programs

- **Concept:** **Structured compliance** for regulated industries and regions: construction-specific (e.g. safety reporting), data protection (GDPR, local laws), industry (e.g. government contracts). Document “Compliance” or “Compliance & Legal” with scope and evidence (certs, DPA, retention).
- **Content:** (1) Data protection: DPA, retention, deletion, subprocessors. (2) Certifications: SOC 2, ISO. (3) Construction/regional: how we support permits, reporting, audit (Phase 11 GOVERNMENT_INTEGRATIONS). (4) Optional: compliance questionnaire (e.g. SIG, CAIQ) for enterprise.
- **Value:** Enterprise and public-sector deals; trust moat; reduces legal and procurement friction.
- **Governance:** Legal and security own; product and eng provide evidence. No core domain change.

---

## Enterprise trust signals

- **Summary:** (1) **Certifications** — SOC 2, ISO; roadmap and status. (2) **Security page** — what we do; contact. (3) **Public SLA** — uptime and remedy. (4) **Status page** — uptime transparency. (5) **Compliance** — DPA, retention, certs, questionnaire. (6) **Customer evidence** — case studies, logos (with permission); “Used by X companies.” (7) **Support** — SLA for response (Enterprise); clear escalation.
- **Placement:** Trust or Security section on main site; linked from footer, sales, and terms. Single “Trust Center” or split Security / Compliance / SLA.
- **Value:** Long-term defensibility: enterprises choose and stay with vendors they trust. Trust moat compounds with product and ecosystem moats.

---

## Implementation principles

- **No core domain rewrite:** Trust and brand are communication, process, and legal. Product may expose “Audit log” or “Export” that support compliance; no change to core domain logic.
- **Every initiative increases advantage:** Each cert and transparent practice raises the bar for competitors and increases enterprise willingness to adopt and retain.
- **Scalable:** Trust signals apply to all tenants and segments; enterprise tier can have enhanced SLA or questionnaire.
