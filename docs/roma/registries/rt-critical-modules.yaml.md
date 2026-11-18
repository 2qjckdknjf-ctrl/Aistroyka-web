# RT-Critical Module Registry (Draft)

**Registry ID:** `roma.registry.rt_critical`  
**Version:** `0.1`  
**Date:** 2026-07-03  
**Status:** Draft — steward review required before enforcement  
**Schema consumer:** `risk_manifest.schema.md` (`registry_ref`)  
**Format:** Human-readable registry; YAML block below is canonical draft content.

---

## Purpose

Authoritative list of **RT-Critical** modules for AISTROYKA — drives risk scoring, test depth, and skip/block policy in ROMA Intelligence.

---

## Registry metadata

| Field | Value |
|-------|-------|
| `registry_version` | `0.1` |
| `effective_date` | 2026-07-03 |
| `review_cadence` | Quarterly + on major architecture change |
| `steward` | `platform-qa-architecture` (placeholder) |

---

## Module entries

### RTCRIT-AUTH

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-AUTH` |
| `name` | Authentication & session |
| `steward` | `web-platform` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | All users blocked if broken; pilot cannot start |
| `security_exposure` | High — credential surfaces, OAuth, magic links |
| `required_test_depth` | `T1` minimum; `T2` on auth provider changes |
| `release_blocking_policy` | `UNKNOWN_ON_SKIP` — skip → domain UNKNOWN, blocks Production Ready |
| `linked_subsystems` | WEB, BCK, SEC |
| `subject_refs` | `apps/web/app/[locale]/(public)/login`, `api:auth/*`, Supabase Auth |

---

### RTCRIT-TENANT-ISOLATION

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-TENANT-ISOLATION` |
| `name` | Tenant isolation (RLS boundary) |
| `steward` | `platform-security` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Cross-tenant leak = existential trust failure |
| `security_exposure` | R0 class |
| `required_test_depth` | `T2` on DB/API tenant paths |
| `release_blocking_policy` | `BLOCK_ON_SKIP` |
| `linked_subsystems` | DB, BCK, SEC, AI |
| `subject_refs` | `tenant_id` RLS policies, cross-tenant negative probes |

---

### RTCRIT-RBAC

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-RBAC` |
| `name` | Role-based access control |
| `steward` | `platform-security` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Wrong role access → data leak or blocked ops |
| `security_exposure` | High — dashboard/admin/portal/owner routes |
| `required_test_depth` | `T2` role matrix on RBAC changes |
| `release_blocking_policy` | `BLOCK_ON_SKIP` on council path |
| `linked_subsystems` | WEB, SEC, DB |
| `subject_refs` | `/dashboard`, `/admin`, `/portal`, `/owner`, `can_manage_project_membership` |

---

### RTCRIT-WORKER-REPORT

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-WORKER-REPORT` |
| `name` | Worker report flow (field → manager) |
| `steward` | `mobile-platform` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Core pilot journey J3 — daily operations |
| `security_exposure` | Medium — worker API, media attachments |
| `required_test_depth` | `T2` when worker/report/sync touched |
| `release_blocking_policy` | `UNKNOWN_ON_SKIP` |
| `linked_subsystems` | WEB, BCK, IOS, AND, DB |
| `subject_refs` | `FLOW-J3`, `POST /api/v1/reports`, Worker app report screens |

---

### RTCRIT-MEDIA-UPLOAD

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-MEDIA-UPLOAD` |
| `name` | Media upload (photos, attachments) |
| `steward` | `web-platform` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Field evidence capture for reports and defects |
| `security_exposure` | High — storage, signed URLs, tenant scoping |
| `required_test_depth` | `T1` smoke; `T2` on storage policy changes |
| `release_blocking_policy` | `UNKNOWN_ON_SKIP` |
| `linked_subsystems` | BCK, WEB, IOS, AND |
| `subject_refs` | Storage buckets, upload API routes, mobile camera flows |

---

### RTCRIT-MANAGER-APPROVALS

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-MANAGER-APPROVALS` |
| `name` | Manager review & approvals |
| `steward` | `web-platform` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Manager sign-off on reports, defects, changes |
| `security_exposure` | Medium — approval state transitions |
| `required_test_depth` | `T2` on approval workflow changes |
| `release_blocking_policy` | `UNKNOWN_ON_SKIP` |
| `linked_subsystems` | WEB, BCK, IOS-Manager |
| `subject_refs` | Manager dashboard approval UI, approval API mutations |

---

### RTCRIT-DOCUMENTS

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-DOCUMENTS` |
| `name` | Documents / acts / contracts |
| `steward` | `product-ops` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Legal/commercial artifacts; customer-facing trust |
| `security_exposure` | High — document visibility by role |
| `required_test_depth` | `T2` on document generation/sharing |
| `release_blocking_policy` | `BLOCK_ON_SKIP` on stakeholder-visible paths |
| `linked_subsystems` | WEB, BCK, SEC, portal |
| `subject_refs` | Estimates, change orders, proof packs, share tokens |

---

### RTCRIT-FINANCE-ISOLATION

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-FINANCE-ISOLATION` |
| `name` | Budgets / internal costs (customer denylist) |
| `steward` | `platform-security` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Mega-roadmap invariant — customer must not see internal finance |
| `security_exposure` | R0 class on leak |
| `required_test_depth` | `T1` stakeholder probe minimum on prod promotion path |
| `release_blocking_policy` | `BLOCK_ON_SKIP` |
| `linked_subsystems` | SEC, WEB, portal |
| `subject_refs` | Internal cost nodes, `budget` graph nodes, stakeholder portal — G-001 |

---

### RTCRIT-AI-COPILOT

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-AI-COPILOT` |
| `name` | AI Copilot (stream + governance) |
| `steward` | `ai-platform` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Differentiated product capability; pilot demos |
| `security_exposure` | High — prompt leakage, tenant memory, LIVE vs FALLBACK |
| `required_test_depth` | `T1` classify LIVE; `T2` on AI route changes |
| `release_blocking_policy` | `UNKNOWN_ON_SKIP` — AI_READY cannot be YES if skipped |
| `linked_subsystems` | AI, BCK, SEC, WEB |
| `subject_refs` | Copilot SSE, `analyze-image`, `require-live` gate |

---

### RTCRIT-SYSTEM-HEALTH

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-SYSTEM-HEALTH` |
| `name` | System health routes |
| `steward` | `platform-ops` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Deploy proof, observability, incident detection |
| `security_exposure` | Low direct; high operational |
| `required_test_depth` | `T0` every deploy — `buildStamp` match |
| `release_blocking_policy` | `BLOCK_ON_SKIP` on T0 |
| `linked_subsystems` | BCK, OBS, REL |
| `subject_refs` | `GET /api/v1/health`, `buildStamp.sha7` |

---

### RTCRIT-RELEASE-WORKFLOW

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-RELEASE-WORKFLOW` |
| `name` | Release workflows & council gates |
| `steward` | `release-council` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Controls what ships to staging/production |
| `security_exposure` | Medium — CI/CD integrity |
| `required_test_depth` | `T0` CI smoke; `T2` pre-council |
| `release_blocking_policy` | `BLOCK_ON_SKIP` on council T2 |
| `linked_subsystems` | REL, OBS, Core |
| `subject_refs` | `RELEASE_VERDICT.json`, Deploy Cloudflare workflows |

---

### RTCRIT-MOBILE-WORKER

| Field | Value |
|-------|-------|
| `module_id` | `RTCRIT-MOBILE-WORKER` |
| `name` | Mobile worker apps (iOS primary; Android deferred P3) |
| `steward` | `mobile-platform` |
| `risk_tier` | `RT-Critical` |
| `business_impact` | Field worker primary surface for pilot |
| `security_exposure` | Medium — sync, lite client allow-list |
| `required_test_depth` | `T1` IOS UITest on `ios/` changes; AND → UNKNOWN acceptable per P3 |
| `release_blocking_policy` | `UNKNOWN_ON_SKIP` for AND; IOS skip → cap Pilot Ready |
| `linked_subsystems` | IOS, AND, BCK |
| `subject_refs` | `ai.aistroyka.worker`, sync bootstrap, `x-client: ios_lite` |

---

## YAML draft (machine-oriented)

```yaml
registry_version: "0.1"
effective_date: "2026-07-03"
steward: platform-qa-architecture
modules:
  - module_id: RTCRIT-AUTH
    steward: web-platform
    risk_tier: RT-Critical
    business_impact: critical
    security_exposure: high
    required_test_depth: T1
    release_blocking_policy: UNKNOWN_ON_SKIP
    linked_subsystems: [WEB, BCK, SEC]
  - module_id: RTCRIT-TENANT-ISOLATION
    steward: platform-security
    risk_tier: RT-Critical
    business_impact: critical
    security_exposure: r0
    required_test_depth: T2
    release_blocking_policy: BLOCK_ON_SKIP
    linked_subsystems: [DB, BCK, SEC, AI]
  - module_id: RTCRIT-RBAC
    steward: platform-security
    risk_tier: RT-Critical
    business_impact: critical
    security_exposure: high
    required_test_depth: T2
    release_blocking_policy: BLOCK_ON_SKIP
    linked_subsystems: [WEB, SEC, DB]
  - module_id: RTCRIT-WORKER-REPORT
    steward: mobile-platform
    risk_tier: RT-Critical
    business_impact: critical
    security_exposure: medium
    required_test_depth: T2
    release_blocking_policy: UNKNOWN_ON_SKIP
    linked_subsystems: [WEB, BCK, IOS, AND, DB]
  - module_id: RTCRIT-MEDIA-UPLOAD
    steward: web-platform
    risk_tier: RT-Critical
    business_impact: high
    security_exposure: high
    required_test_depth: T1
    release_blocking_policy: UNKNOWN_ON_SKIP
    linked_subsystems: [BCK, WEB, IOS, AND]
  - module_id: RTCRIT-MANAGER-APPROVALS
    steward: web-platform
    risk_tier: RT-Critical
    business_impact: high
    security_exposure: medium
    required_test_depth: T2
    release_blocking_policy: UNKNOWN_ON_SKIP
    linked_subsystems: [WEB, BCK, IOS]
  - module_id: RTCRIT-DOCUMENTS
    steward: product-ops
    risk_tier: RT-Critical
    business_impact: critical
    security_exposure: high
    required_test_depth: T2
    release_blocking_policy: BLOCK_ON_SKIP
    linked_subsystems: [WEB, BCK, SEC]
  - module_id: RTCRIT-FINANCE-ISOLATION
    steward: platform-security
    risk_tier: RT-Critical
    business_impact: critical
    security_exposure: r0
    required_test_depth: T1
    release_blocking_policy: BLOCK_ON_SKIP
    linked_subsystems: [SEC, WEB]
  - module_id: RTCRIT-AI-COPILOT
    steward: ai-platform
    risk_tier: RT-Critical
    business_impact: high
    security_exposure: high
    required_test_depth: T1
    release_blocking_policy: UNKNOWN_ON_SKIP
    linked_subsystems: [AI, BCK, SEC, WEB]
  - module_id: RTCRIT-SYSTEM-HEALTH
    steward: platform-ops
    risk_tier: RT-Critical
    business_impact: critical
    security_exposure: low
    required_test_depth: T0
    release_blocking_policy: BLOCK_ON_SKIP
    linked_subsystems: [BCK, OBS, REL]
  - module_id: RTCRIT-RELEASE-WORKFLOW
    steward: release-council
    risk_tier: RT-Critical
    business_impact: critical
    security_exposure: medium
    required_test_depth: T0
    release_blocking_policy: BLOCK_ON_SKIP
    linked_subsystems: [REL, OBS, CORE]
  - module_id: RTCRIT-MOBILE-WORKER
    steward: mobile-platform
    risk_tier: RT-Critical
    business_impact: critical
    security_exposure: medium
    required_test_depth: T1
    release_blocking_policy: UNKNOWN_ON_SKIP
    linked_subsystems: [IOS, AND, BCK]
```

---

## Validation rules

| Rule | Description |
|------|-------------|
| REG-V01 | All `module_id` prefixed `RTCRIT-` |
| REG-V02 | `release_blocking_policy` ∈ `BLOCK_ON_SKIP`, `UNKNOWN_ON_SKIP` |
| REG-V03 | Finance module must reference G-001 in steward review |
| REG-V04 | Risk manifest must cite `registry_ref` matching this version |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-07-03 | Initial draft registry |
