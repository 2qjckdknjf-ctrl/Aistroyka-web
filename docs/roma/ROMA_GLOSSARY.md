# ROMA — Glossary

**Document ID:** ROMA-GLOS-001  
**Version:** 1.0  
**Date:** 2026-07-03

---

## A

**Adapter (Legacy)**  
Transitional component mapping existing AISTROYKA QA assets (Vitest, Playwright, shell smokes) into ROMA subsystem contracts without full rewrite.

**AISTROYKA**  
AI-powered construction trust and control platform; ROMA's subject system.

**Assurance Tier (T0–T3)**  
Execution depth profile from smoke (T0) to chaos (T3). See `ROMA_EXECUTION_MODEL.md`.

**Artifact Bundle**  
All raw evidence for a `run_id`: logs, screenshots, traces, XML, JSON.

---

## B

**Blast Radius**  
Scope of users/tenants/data affected by a finding. Used in risk scoring.

**Build Stamp**  
Deploy proof from `GET /api/v1/health` → `buildStamp.sha7` (first 7 chars of deployed commit SHA).

---

## C

**Chaos Scenario**  
Staging-only fault injection defined in ROMA Chaos catalog.

**CONDITIONAL GO**  
Release readiness state: ship allowed with documented P1 mitigations and council approval.

**Control Plane**  
ROMA layer that orchestrates validation without serving end users.

**Council Brief**  
Human-readable release summary (Level 6 reporting). See `ROMA_REPORTING_MODEL.md`.

**Coverage Debt**  
Inventory items persistently untested across N runs; tracked by ROMA Learning.

**Credential Profile**  
Named bundle referencing secret store keys for a persona (e.g., `pilot_owner`).

**Customer Finance Isolation**  
Product rule: stakeholders/customers never see internal contractor financial state. ROMA invariant.

---

## D

**Data Plane**  
AISTROYKA product runtime serving users (web, mobile, API, DB).

**Domain Verdict**  
YES/NO/UNKNOWN for a release question (e.g., `AI_READY`). See Domain Verdict Board.

**Discovery**  
Inventory sync identifying routes, APIs, roles, screens from repo + runtime — never invented.

---

## E

**Environment Descriptor**  
Structured declaration of target env: URLs, mutation policy, chaos allowance, build stamp.

**Evidence Confidence**  
0–1 scalar: how strongly artifacts support a finding (used in risk score).

---

## F

**Fail-Closed**  
Ambiguous outcomes become UNKNOWN, never PASS/YES.

**Finding Record**  
Normalized Level 1 report entity with stable `finding_id`.

**Fixture Tenant**  
Staging tenant scoped for ROMA mutations; tagged `roma-fixture-*`.

**Flake**  
Non-deterministic test outcome; quarantined via ROMA Learning.

---

## G

**GO**  
Release readiness: all blocking gates satisfied.

**Gap Finding**  
`status: gap` — functionality or test coverage missing; documents absence without fake pass.

---

## I

**Inventory Hash**  
Checksum of route/API inventory snapshot; ensures coverage comparability across runs.

**Inventory Sync**  
CORE operation refreshing system inventory before execution.

---

## L

**Layer B (iOS)**  
Live iOS E2E against staging with real backend; distinct from simulator UITest smoke.

**Lite Client**  
Mobile API profile using `x-client: ios_lite|android_lite|ios_worker|android_worker` with allow-list middleware.

**LIVE (AI)**  
AI response from real provider without fallback headers (`X-AI-Fallback-Reason` absent per policy).

---

## M

**Manifest**  
Ordered list of work units a subsystem executes for a given tier/run.

---

## N

**NO-GO**  
Release blocked: R0 present, critical domain NO, or PQS below floor.

---

## O

**UNKNOWN**  
Insufficient evidence to claim YES or NO. Honest third state — not approval.

---

## P

**Persona**  
Acting user class: guest, owner, manager, worker, stakeholder, platform_owner, etc.

**PQS (Project Quality Score)**  
Weighted 0–100 composite from domain verdicts. See `ROMA_REPORTING_MODEL.md`.

**Profile**  
See Credential Profile.

---

## R

**RBAC**  
Role-based access control: tenant policy (`owner/admin/member/viewer/stakeholder`) + enterprise authz layer.

**Risk Class (R0–R4)**  
Existential (R0) through latent debt (R4). See `ROMA_ARCHITECTURE.md` §13.

**ROMA**  
**R**eliable **O**perations & **M**ulti-surface **A**ssurance — permanent QA platform for AISTROYKA.

**Run ID**  
Global execution identifier: `roma-{YYYYMMDD}-{sha7}-{seq}`.

**Run**  
Single orchestrated ROMA execution from inventory through Learning ingest.

---

## S

**Slice**  
Verdict subdivision within a subsystem (e.g., `WEB-public`, `IOS-LayerB`).

**Skip Reason**  
Documented cause for non-execution → drives UNKNOWN downstream.

**Subsystem**  
Bounded validation domain (WEB, IOS, BCK, …) implementing Core contract.

**Subsystem Steward**  
Owner accountable for manifest accuracy of one subsystem.

---

## T

**Tenant Isolation**  
Operational boundary: `tenant_id` + RLS; QA must not cross-contaminate fixtures.

**Tier**  
See Assurance Tier.

---

## U

**UNKNOWN Penalty**  
Default 0.3 multiplier for PQS when domain verdict is UNKNOWN.

---

## V

**Verdict**  
YES, NO, or UNKNOWN at domain or subsystem level.

**Vitest Layer**  
Unit test stratum feeding BCK/DB subsystems; not synonymous with ROMA E2E.

---

## W

**Worst-Slice-Wins**  
Default subsystem verdict rule: any NO slice → subsystem NO.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial glossary |
