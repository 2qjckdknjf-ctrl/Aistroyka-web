# ROMA Knowledge Graph

**Document ID:** ROMA-INT-008  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Models **relationships** across the AISTROYKA ecosystem to enable impact analysis: "if this API changes, what flows, roles, mobile apps, and AI paths are affected?"

---

## 2. Node Types

| Node type | Examples |
|-----------|----------|
| `page` | `/dashboard/projects/[id]` |
| `api` | `GET /api/v1/projects/:id` |
| `db_table` | `projects`, `tenant_members` |
| `role` | `owner`, `stakeholder`, `foreman` |
| `permission` | `project:read`, `billing:admin` |
| `mobile_app` | `IOS-Manager`, `AND-Worker` |
| `ai_capability` | `copilot-stream`, `analyze-image` |
| `document` | estimate, change-order |
| `report` | daily-report, proof-pack |
| `task` | `tasks` domain |
| `budget` | internal cost (internal-only node) |
| `project` | project entity |
| `worker` | worker persona / API |
| `manager` | manager persona |
| `business_flow` | J3 worker-report-manager-sees |
| `subsystem` | ROMA WEB, BCK, … |

---

## 3. Edge Types

| Edge | Meaning | Example |
|------|---------|---------|
| `calls` | page → api | dashboard project detail calls projects API |
| `reads` | api → db_table | GET project reads `projects` |
| `requires_permission` | api → permission | export requires `reports:export` |
| `granted_to` | permission → role | stakeholder denied internal cost |
| `syncs_via` | mobile → api | Worker sync bootstrap |
| `uses_ai` | page/api → ai_capability | project copilot stream |
| `part_of_flow` | node → business_flow | |
| `depends_on` | subsystem → subsystem | WEB depends BCK |
| `customer_visible` | node → flag | finance denylist boundary |

---

## 4. Responsibilities

| Owns | Does not own |
|------|--------------|
| Graph schema and inventory sync | Live graph database vendor choice (future) |
| Impact queries for engines | Product business logic |

---

## 5. Inputs

| Input | Source |
|-------|--------|
| Route inventory | Core sync |
| RBAC matrix (Stage 3+) | SEC |
| Mobile screen map | IOS/AND |
| AI catalog | AI subsystem |
| Manual curated flows | QA architecture |

Storage (future): `docs/roma/inventory/knowledge_graph.json` or graph DB.

---

## 6. Outputs / Queries

| Query | Consumer |
|-------|----------|
| `impact_radius(change_set)` | Regression, Risk |
| `flows_touching(api_id)` | Coverage |
| `roles_affected(module)` | Coverage COV-ROLE |
| `blast_radius(node)` | Release Confidence |
| `customer_visible_paths(node)` | SEC finance |

---

## 7. AISTROYKA Constraints

- **Customer finance nodes** (`budget`, internal cost) must never link to `stakeholder` role via `customer_visible` paths — graph validation rule G-001.  
- **Platform owner** nodes isolated from tenant RBAC subgraph.

---

## 8. Future Extensibility

- Auto-extract `calls` edges from OpenAPI + App Router static analysis  
- Version graph per `inventory_hash`  
- Visual explorer (Stage 7 dashboard)  

---

## 9. Rationale

Without a graph, diff-only planning misses transitive API/UI/mobile failures — essential at 287+ routes and dual mobile clients.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial knowledge graph spec |
