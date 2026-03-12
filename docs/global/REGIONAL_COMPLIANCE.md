# Regional Compliance Map

**Phase 14 — Global Infrastructure & Sovereign Clouds**  
**EU (GDPR), Middle East (PDPL), India (DPDP), SOC 2, ISO 27001, government standards.**

---

## EU (GDPR)

- **Scope:** Personal data of individuals in the EEA; processing by controller or processor. Construction data (reports, tasks, assignees, media) may contain personal data.
- **Requirements (summary):** Lawful basis; purpose limitation; data minimization; accuracy; storage limitation; security; accountability. Rights: access, rectification, erasure, portability, object, restrict. Transfer outside EEA: only with adequacy decision, SCCs, or other permitted mechanism.
- **Our mapping:** (1) **Residency:** Offer EU region (data_region = EU); storage and processing in EEA (e.g. EU West). (2) **Transfer:** No transfer of EU tenant data outside EEA for storage/processing unless mechanism (SCCs, adequacy). (3) **Subprocessors:** List in DPA; ensure SCCs or equivalent where subprocessor is outside EEA. (4) **Rights:** Support export (portability), deletion, access via product or process; document in privacy notice and DPA. (5) **DPA:** Standard DPA with Art. 28 clauses; record of processing.
- **Certifications:** SOC 2 and ISO 27001 support; no EU-specific cert required for GDPR; optional EU Cloud Code of Conduct or national schemes.
- **Value:** Enables EU sales and retention; reduces regulatory risk.

---

## Middle East (PDPL and local laws)

- **Scope:** Saudi PDPL, UAE data protection, and other Gulf/local laws. Personal data processed in or pertaining to those jurisdictions.
- **Requirements (summary):** Consent or lawful basis; purpose limitation; cross-border transfer restrictions (e.g. approved countries, adequacy, or contract); rights (access, correction, deletion); registration or notification where required.
- **Our mapping:** (1) **Residency:** Offer ME region (data_region = ME); storage in Middle East or approved location per local law. (2) **Transfer:** Restrict transfer per PDPL/local rules; document mechanism. (3) **Subprocessors:** Align with local requirements; DPA and list. (4) **Rights and process:** Support access, correction, deletion; document. (5) **Legal review:** Per-country counsel for launch in ME.
- **Value:** Enables Middle East expansion; government and enterprise in region.

---

## India (DPDP)

- **Scope:** Digital Personal Data Protection Act (DPDP) 2023; personal data processed in India or in connection with Indian users.
- **Requirements (summary):** Consent or legitimate use; purpose limitation; data minimization; storage limitation; security; rights (access, correction, erasure, grievance); cross-border transfer (to notified countries or with consent/contract); data fiduciary and processor obligations.
- **Our mapping:** (1) **Residency:** Offer India region (data_region = IN); storage in India (e.g. Mumbai). (2) **Transfer:** Transfer only to notified countries or with permitted mechanism per DPDP. (3) **Subprocessors:** Processor agreements; list and regions. (4) **Rights and grievance:** Process for access, correction, erasure; grievance contact. (5) **Consent and notice:** Align consent and privacy notice with DPDP.
- **Value:** Enables India market; supports local enterprises and government.

---

## SOC 2

- **Scope:** Service organization controls for security, availability, processing integrity, confidentiality, privacy (Trust Service Criteria). US and global enterprise expectation.
- **Our mapping:** (1) **Control environment:** Policies, RLS, access control, encryption, audit logs (see Phase 13, ENTERPRISE_ZERO_TRUST_PLAN). (2) **Scope:** SaaS offering; document system boundary and subservice organizations (Supabase, Cloudflare, AI providers, etc.). (3) **Report:** Type I (design); Type II (operating effectiveness). (4) **Region:** SOC 2 is not region-specific; one report can cover global SaaS; for regional deployments, scope may be per deployment or “all regions” per auditor.
- **Value:** Removes enterprise objection; required for many RFPs.

---

## ISO 27001

- **Scope:** Information security management system (ISMS). Global standard; often required for government and international enterprise.
- **Our mapping:** (1) **ISMS:** Risk assessment; policies (security, access, change, incident); controls from Annex A. (2) **Scope:** Platform and operations; may include multiple regions or per deployment. (3) **Certification:** Accredited body; surveillance and recertification. (4) **Region:** Certificate can cover global or specific scope; sovereign deployments may need scope extension.
- **Value:** International recognition; supports government and regulated tenders.

---

## Government standards

- **Scope:** National or sector-specific: e.g. US FedRAMP, UK NCSC Cloud Security Principles, India MeitY guidelines, or defense/classified requirements. Often include: residency, encryption (including HSM), private network, air-gapped or controlled connectivity, personnel clearance, audit.
- **Our mapping:** (1) **Deployment mode:** Government private cloud or on-prem (DEPLOYMENT_MODES); dedicated stack; no shared multi-tenant. (2) **Security stack:** Sovereign security (SOVEREIGN_SECURITY): CMK, HSM, zero-trust, private networking, zoning, air-gapped backup. (3) **Compliance:** Map each target framework (FedRAMP, NCSC, etc.) to our controls; gap analysis and roadmap. (4) **Certification:** Per framework (e.g. FedRAMP ATO); long lead time; pursue when pipeline justifies.
- **Value:** Unlocks government and defense sector; high barrier to entry for competitors.
- **Note:** Full FedRAMP or equivalent is a multi-year program; document “government readiness” and phased approach rather than claiming certification before achieved.

---

## Summary table (high level)

| Region / Framework | Residency | Transfer | Certifications / Evidence |
|--------------------|-----------|----------|----------------------------|
| EU (GDPR)          | EU region offered | Adequacy/SCCs only | DPA, subprocessor list, SOC 2/ISO support |
| Middle East (PDPL etc.) | ME region offered | Per local law | DPA, legal review |
| India (DPDP)       | IN region offered | Notified/mechanism | DPA, grievance process |
| SOC 2              | N/A       | N/A      | Type I/II report |
| ISO 27001           | N/A       | N/A      | Certificate, scope |
| Government         | Per contract | Restricted | FedRAMP / NCSC / etc. when achieved |

---

## Implementation principles

- **No domain model rewrite:** Compliance is policy, process, residency binding, and documentation; core schema unchanged.
- **Compliance by design:** Residency and deployment modes (DEPLOYMENT_MODES) enable region-specific compliance; security stack (SOVEREIGN_SECURITY) supports government.
- **Legal ownership:** Legal and compliance own mapping and DPA; engineering implements residency and controls that support each row.
