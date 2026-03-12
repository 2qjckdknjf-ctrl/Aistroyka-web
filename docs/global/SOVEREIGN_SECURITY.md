# Sovereign Security Stack

**Phase 14 — Global Infrastructure & Sovereign Clouds**  
**Customer-managed keys, HSM, zero-trust networking, private networking, security zoning, air-gapped backups.**

---

## Customer-managed encryption keys (CMK)

- **Concept:** Tenant or deployment can supply **their own encryption keys** for data at rest (DB and/or object storage). We use their key (or key reference) for encryption/decryption; we do not hold the key material. Supports “you don’t hold our keys” and some government requirements.
- **Implementation:** (1) **Key provider:** Customer brings key via KMS (e.g. AWS KMS, Azure Key Vault, HSM). (2) **Integration:** Our storage or DB layer calls customer’s KMS for encrypt/decrypt, or we store only a reference and customer’s sidecar performs crypto. (3) **Scope:** Per tenant (SaaS with CMK) or per deployment (dedicated/on-prem). (4) **Fallback:** Default = platform-managed keys; CMK is optional and tier/contract-based.
- **Value:** Required for some regulated and government deals; strengthens trust.
- **Constraint:** Key availability: if customer key is unavailable, we cannot decrypt. Document SLA and recovery; prefer envelope encryption so only data encryption keys are customer-managed if needed.

---

## HSM usage

- **Concept:** **Hardware Security Module** for key generation, storage, and crypto operations. Used when policy or regulation requires keys in HSM (e.g. government, high assurance). Can be platform HSM (we use HSM in our cloud) or customer HSM (customer brings HSM or HSM-backed KMS).
- **Platform HSM:** Supabase or provider may support HSM-backed keys per region; document “EU deployment uses HSM in EU.” Or we integrate with Cloud KMS/HSM (e.g. Google Cloud HSM, AWS CloudHSM) for key operations in sovereign deployments.
- **Customer HSM:** For on-prem or government, customer may require keys only in their HSM. Integration: our app or a proxy calls customer HSM (or HSM-backed API) for encrypt/decrypt; no key export. Requires network and protocol support (e.g. PKCS#11, KMIP).
- **Value:** Meets “keys in HSM” and “no key export” requirements; enables government and high-assurance deployments.

---

## Zero-trust networking

- **Concept:** **Zero-trust:** no implicit trust by network location; every request is authenticated and authorized; least privilege. Already aligned with RLS and tenant isolation (ENTERPRISE_ZERO_TRUST_PLAN). For sovereign and government, extend to network layer.
- **Implementation:** (1) **Identity:** Every API and admin call authenticated (JWT, API key, mTLS for service-to-service if needed). (2) **Authorization:** RLS and app checks; no “internal only” bypass for tenant data. (3) **Network:** In dedicated or on-prem, segment services; no single flat VLAN. (4) **Devices:** For on-prem, optional device attestation or MDM for admin access. Document in security posture (Phase 13).
- **Value:** Reduces reliance on “trusted network”; required for zero-trust and government frameworks.

---

## Private networking

- **Concept:** **No public internet** for data path between app and DB/storage in sovereign or government deployments. Use private link, VPC peering, or private network so traffic does not traverse public internet.
- **Implementation:** (1) **Dedicated cloud tenant:** Supabase (or equivalent) in customer VPC or private link; Workers or app in same VPC or connected via private link. (2) **On-prem:** App and DB in customer network; no egress to internet for data. (3) **Control plane:** If control plane is shared, only metadata (tenant id, feature flags) over encrypted channel; no tenant payload. Document “data path is private” in architecture diagram and DPA.
- **Value:** Meets “no public internet” and “private cloud” requirements; government and high-security customers.

---

## Security zoning

- **Concept:** **Zones:** Segment infrastructure into zones by sensitivity and trust. Example: (1) **Public zone:** Edge, CDN, public API; no tenant data at rest. (2) **App zone:** Workers or app servers; stateless or short-lived cache; no persistent tenant data. (3) **Data zone:** DB and object storage; access only from app zone and backup; no direct internet. (4) **Management zone:** Secrets, CI/CD, admin; restricted access. For government, add **air-gapped zone** (see below).
- **Implementation:** Network segmentation (VPC, firewall rules); IAM and least privilege per zone; logging and monitoring at zone boundaries. Document zones in architecture; enforce in deployment (e.g. Terraform, policy).
- **Value:** Limits blast radius; supports compliance and audit; aligns with zero-trust.

---

## Air-gapped backups

- **Concept:** **Air-gapped:** Backup copy is not continuously connected to production; reduces risk of ransomware or compromise propagating to backups. For government or high assurance, backup may be written to offline or out-of-band storage (e.g. tape, removable media, or backup vault with no network path from production).
- **Implementation:** (1) **Logical air-gap:** Backup to separate account/region with no direct network path from primary; restore only via controlled process. (2) **Physical air-gap:** Backup copy to media that is disconnected; stored in secure location. (3) **Retention:** Per policy; document RPO and who can restore. (4) **Encryption:** Backups encrypted; keys in HSM or separate key store.
- **Value:** Required for some government and critical infrastructure; improves resilience against ransomware.
- **Scope:** Optional per deployment mode (e.g. government private cloud); not required for standard SaaS.

---

## Implementation principles

- **No domain model rewrite:** Security stack is infrastructure, network, and key management; core application schema unchanged.
- **Security-first:** CMK, HSM, zero-trust, private networking, and zoning are designed in from the start for sovereign and government modes.
- **Compliance by design:** Each control maps to regulatory or certification expectations (REGIONAL_COMPLIANCE).
- **Support multiple deployment modes:** Default SaaS may use platform keys and public endpoints; dedicated and government modes enable CMK, HSM, private networking, and air-gapped backup per contract.
