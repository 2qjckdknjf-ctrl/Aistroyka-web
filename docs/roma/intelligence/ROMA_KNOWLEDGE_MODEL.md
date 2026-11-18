# ROMA Knowledge Model

**Document ID:** ROMA-INT-CORE-007  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2A Architecture (design only)  
**Parent:** `ROMA_INTELLIGENCE_CORE.md`  
**Implements:** `ROMA_KNOWLEDGE_GRAPH.md` (Stage 2 graph schema)

---

## 1. Purpose

Defines the **engineering knowledge ontology** — how code, modules, APIs, data, mobile, roles, AI, infrastructure, releases, tests, and evidence relate for impact analysis and architecture health reasoning.

The Knowledge Model is ROMA's **world model** of the AISTROYKA system.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Node and edge type taxonomy | Live graph database vendor |
| Impact analysis semantics | Product ORM definitions |
| Architecture health signals | Source code parsing implementation |
| Customer-finance graph validation (G-001) | RBAC policy authoring |

---

## 3. Entity Domains

| Domain | Node types | Example |
|--------|------------|---------|
| **Code** | file, package, route_component | `apps/web/app/...` |
| **Modules** | subsystem, domain_module | WEB, BCK, AI |
| **API** | endpoint, contract | `GET /api/v1/projects/:id` |
| **Database** | table, rls_policy, migration | `projects`, `tenant_members` |
| **Mobile** | app, screen, sync_path | IOS-Worker, AND-Manager |
| **Roles** | persona, credential_profile | owner, stakeholder, foreman |
| **Permissions** | capability, route_gate | `project:read` |
| **Business flows** | journey, scenario_id | J3 worker-report-manager-sees |
| **AI** | capability, provider_route | copilot-stream, analyze-image |
| **Infrastructure** | worker, dns, deploy_target | Cloudflare, Supabase |
| **Releases** | build_stamp, branch, artifact | sha7, TestFlight build |
| **Tests** | slice, manifest_id, tier | WEB-auth-smoke |
| **Evidence** | artifact, finding | EV-SCREEN, finding_id |

---

## 4. Relationship Types

| Edge | Semantics | Reasoning use |
|------|-----------|---------------|
| `depends_on` | Hard dependency | Blast radius |
| `calls` | Runtime invocation | Regression forecast |
| `reads` / `writes` | Data access | DB risk, tenant isolation |
| `requires_permission` | AuthZ | RBAC coverage debt |
| `granted_to` / `denied_to` | Role binding | Stakeholder finance G-001 |
| `part_of_flow` | Business journey | Flow coverage |
| `validated_by` | Test → node | Coverage map |
| `evidenced_by` | Finding → node | Reasoning Q6 |
| `deployed_as` | Release → artifact | OBS proof |
| `customer_visible` | Exposure flag | Finance boundary |
| `syncs_via` | Mobile → API | Cross-surface risk |

---

## 5. Inputs

| Input | Source |
|-------|--------|
| Core inventory sync | routes, APIs, roles |
| Subsystem manifests | Module ownership |
| RBAC matrix (Stage 4+) | Permissions |
| Mobile screen maps | IOS/AND |
| AI catalog | AI subsystem |
| Test manifests | Slice → node links |
| Run findings | Evidence edges |
| ADR registry | Architecture boundaries |

---

## 6. Outputs

| Output | Consumer |
|--------|----------|
| `impact_radius(change_set)` | Reasoning Q3, Regression |
| `architecture_health_score` | Executive RPT-ARCH |
| `coverage_topology` | Coverage Engine |
| `unreachable_nodes` | Inventory drift alert |
| `knowledge_delta.json` | Per-run graph changes |
| `violation_reports` | G-001 finance path checks |

### Architecture health signals

| Signal | Detection |
|--------|-----------|
| Orphan API | No `calls` inbound from web/mobile |
| Hub overload | Node with >N dependents (configurable) |
| Boundary breach | Internal cost node `customer_visible` to stakeholder |
| Test drift | Changed node without `validated_by` edge update |
| Cross-tenant edge | DB policy missing on `reads` path |

---

## 7. Interfaces

| Partner | Contract |
|---------|----------|
| Knowledge Graph (Stage 2) | Serialized graph storage |
| Reasoning Model | `affected_actors`, blast radius |
| Risk Model | Centrality → criticality boost |
| Memory Model | MEM-ADR links to nodes |
| Regression Engine | Transitive failure paths |

---

## 8. Future Extensions

- Auto-extract edges from OpenAPI + App Router static analysis
- Infra nodes from wrangler.toml + Supabase schema sync
- Versioned graph snapshots per `inventory_hash`
- Graph diff in PR comments ("14 nodes in blast radius")
- Submodule graphs federated by repo

---

## 9. Open Questions

| ID | Question |
|----|----------|
| Q1 | Graph storage: JSON file vs graph DB at what node count? |
| Q2 | Manual curation SLA for business flows — who owns J* scenarios? |
| Q3 | Include `docs/roma/adr/` nodes explicitly in graph? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2A knowledge model |
