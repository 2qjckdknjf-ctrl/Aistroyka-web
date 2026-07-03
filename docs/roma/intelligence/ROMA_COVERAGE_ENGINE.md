# ROMA Coverage Engine

**Document ID:** ROMA-INT-004  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_INTELLIGENCE.md`

---

## 1. Purpose

Measures assurance **beyond line/route percentages** — answering what business flows, roles, APIs, devices, and AI scenarios remain uncovered.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Multi-dimensional coverage maps | Executing tests to close gaps |
| Coverage debt classification | Equating coverage % with YES verdict |

---

## 3. Coverage Dimensions

| Dimension ID | Question | Inventory source |
|--------------|----------|------------------|
| `COV-FLOW` | What business flows are uncovered? | Journey catalog (J1–J12+) |
| `COV-ROLE` | What roles/personas lack probes? | ADR-0003 profiles × RBAC matrix |
| `COV-API` | What API routes never probed? | `docs/roma/inventory/routes.json` |
| `COV-PAGE` | What pages/screens never visited? | Web + mobile inventory |
| `COV-DEVICE` | What device matrix cells empty? | viewport/device manifest |
| `COV-AI` | What AI scenarios untested? | AI entry catalog |
| `COV-LOCALE` | What locales not exercised? | en/ru/es/it matrix |
| `COV-FINANCE` | Stakeholder denylist paths probed? | SEC finance catalog |

---

## 4. Inputs

| Input | Source |
|-------|--------|
| System inventory | ROMA Core sync |
| Run history | `docs/qa/runs/*` |
| Knowledge Graph | flow → API → page edges |
| Last N run manifests | Planner + subsystem reports |

---

## 5. Outputs

| Output | Description |
|--------|-------------|
| `coverage_map.json` | per dimension: covered / total / debt_items[] |
| `coverage_debt_register` | R4 items with age, risk_tier |
| `uncovered_flows[]` | ranked by business criticality |
| `uncovered_roles[]` | persona IDs |
| `uncovered_apis[]` | path templates |
| `uncovered_ai_scenarios[]` | LIVE, fallback, cancel, leakage |
| `planner_recommendations[]` | slices to add next run |

### Debt severity

| Age + risk | Classification |
|------------|----------------|
| RT-Critical uncovered > 7d | P1 debt |
| RT-High uncovered > 30d | P2 debt |
| R4 latent | Learning only until SLA breach |

---

## 6. Interfaces

- **Planner:** pulls debt items into next run when budget allows  
- **Release Confidence:** penalizes high-risk uncovered flows  
- **Executive Reporting:** "coverage story" not just %  

---

## 7. Rationale

Route % alone misses role isolation and AI LIVE paths — multi-dimensional coverage matches AISTROYKA RBAC/finance complexity.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial coverage engine spec |
