# ROMA Adapter Model

**Document ID:** ROMA-OS-ADAPTER-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2C (design only)  
**Parent:** `ROMA_OS_ARCHITECTURE.md`, `ROMA_KERNEL.md`

---

## 1. Purpose

Defines **adapter types** that connect ROMA OS to projects and tools. The kernel depends on **adapter contracts only** — never concrete vendors or repositories.

**Hard rule:** ROMA OS Kernel → adapter interfaces → implementations. No shortcuts.

---

## 2. Adapter Types

### 2.1 Project Adapter

Maps a **specific product/repository** into kernel-neutral inventory and policy facts.

**First instance: AISTROYKA Project Adapter**

| Maps | Examples |
|------|----------|
| Code & routes | App Router pages, `apps/web/app/api/v1/*` |
| Roles & RBAC | dashboard, admin, portal, owner, stakeholder |
| Data boundaries | tenant RLS, finance denylist, accounts layer |
| Mobile apps | IOS-Manager/Worker, AND-Manager/Worker |
| AI surfaces | Copilot routes, vision endpoints |
| Business flows | FLOW-J3 worker report, pilot intake |
| Environment descriptors | staging.aistroyka.ai, buildStamp |
| Credential profile names | contractor_smoke, stakeholder_smoke (not values) |

**Contract:** `IProjectAdapter.sync_inventory() → inventory_snapshot`  
**Contract:** `IProjectAdapter.policy_constraints() → PolicyFlags[]`

Project Adapter **may** read repo files and live health endpoints; Kernel **must not**.

---

### 2.2 Tool Adapter

Maps **external execution and observability tools** to kernel execution and evidence contracts.

| Tool (examples) | Adapter role | QA app usage |
|-----------------|--------------|--------------|
| **Playwright** | Web slice execution | ROMA QA WEB |
| **Maestro** | Mobile flow execution | ROMA Mobile (future) |
| **Appium** | Android instrumented | ROMA Mobile (future) |
| **GitHub Actions** | Trigger + status events | ROMA DevOps |
| **Supabase** | DB probe, migration awareness | QA DB / Security |
| **Cloudflare** | Deploy target, health | ROMA DevOps |
| **Lighthouse** | Perf metrics | ROMA Performance |
| **axe** | A11y rules | ROMA QA A11Y |
| **LLM providers** | LIVE/FALLBACK probe | ROMA AI Audit |
| **XCTest / Gradle** | iOS/Android CI | ROMA QA Mobile |

**Contract:** `IToolAdapter.execute(slice) → raw_result`  
**Contract:** `IToolAdapter.capabilities() → ToolCapability[]`

Stage 3 QA adapters (WEB/BCK/SEC) are **Tool Adapter implementations** under the OS model.

---

### 2.3 Evidence Adapter

Normalizes tool outputs into **Evidence Service** artifacts.

| Evidence kind | Source examples |
|---------------|-----------------|
| Screenshots | Playwright PNG |
| Traces | Playwright zip |
| Logs | CI log, AI classify log |
| API responses | Redacted HAR/JSON |
| Build output | buildStamp, workflow run |
| Mobile artifacts | JUnit, XCTest XML |

**Contract:** `IEvidenceAdapter.normalize(raw) → evidence_index entry`  
**Contract:** Must satisfy `evidence_bundle.schema.md`

Evidence Adapters may be bundled with Tool Adapters but remain a distinct contract for testing and redaction policy.

---

## 3. Adapter Manifest

```yaml
adapter_id: aistroyka-project
adapter_type: project  # project | tool | evidence
contract_version: adapter_v1
tool_id: null  # or playwright, github-actions, ...
capabilities: [inventory_sync, policy_flags, finance_denylist]
dependencies: []
steward: platform-architecture
```

---

## 4. Registration Flow

```
Adapter manifest → Kernel IK-REGISTER-ADAPTER
  → Compatibility Service version check
  → Capability registry update
  → ACK | NACK with violations
```

---

## 5. Dependency Rules

| From | To | Allowed |
|------|-----|---------|
| Kernel | Adapter contract | ✅ |
| Application | Adapter contract (via service) | ✅ |
| Application | Tool SDK directly | ❌ (must use Tool Adapter) |
| Kernel | Playwright / Supabase / GH Actions | ❌ |
| Project Adapter | Product repo read | ✅ |
| Tool Adapter | External API | ✅ (scoped credentials outside kernel) |

---

## 6. AISTROYKA as First Project Adapter

Does not replace Stages 0–2B inventory design — **implements** it:

- `docs/roma/inventory/` (future) populated by adapter sync  
- RT-Critical registry refs AISTROYKA modules  
- Mega-roadmap finance rules → `policy_constraints()`  
- Pilot intake status → release gate inputs  

---

## 7. Future Extensions

- Adapter marketplace with signed manifests  
- Multi-repo Project Adapter (web + mobile repos)  
- Tool Adapter sandbox for untrusted tools  
- Evidence Adapter plugins for custom artifact types

---

## 8. Open Questions

| ID | Question |
|----|----------|
| Q1 | One mega AISTROYKA adapter vs split web/mobile adapters? |
| Q2 | Supabase: Project vs Tool adapter boundary? |
| Q3 | Evidence Adapter mandatory for every Tool Adapter? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial adapter model |
