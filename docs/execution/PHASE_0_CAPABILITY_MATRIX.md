# Phase 0 — Capability Matrix

**Date:** 2026-04-18  
**Status scale:** `NOT_PRESENT` / `PLACEHOLDER` / `PARTIAL` / `REPO_COMPLETE` / `RUNTIME_PROVEN` / `OPERATIONALLY_CLOSED`.

| Area | Status | What exists | What is partial | What is missing / not proven | Closure truth |
|---|---|---|---|---|---|
| Web/API core | REPO_COMPLETE | Large `app/api/v1/**` surface + dashboard routes in `apps/web`. | Legacy/deprecated route overlays still present. | Full runtime closure across all loops not proven in this run. | Prior closure claims are overstated if they imply operationally closed. |
| Auth / tenant / roles | PARTIAL | Tenant + authz logic in `apps/web/lib/tenant/**`, `apps/web/lib/authz/**`. | Role enforcement matrix clarity is uneven across all routes. | Comprehensive permission audit evidence is missing. | Not operationally closed. |
| Worker field workflow | PARTIAL | Worker routes + mobile clients (iOS + Android) exist. | Cross-platform parity and runtime proof remain uneven. | End-to-end field runtime proof not complete in this run. | Any “fully closed” claim is overstated. |
| Manager workflow | PARTIAL | Manager dashboard and route families are extensive. | Some mobile manager surfaces remain placeholder-level. | Uniform manager loop proof across web/mobile not shown. | Not closed. |
| iOS | PARTIAL | Real app code in `ios/AiStroykaManager/**`, `ios/AiStroykaWorker/**`. | Placeholder manager sections remain. | Full CI/runtime operational proof missing. | “Missing iOS projects” is stale; “fully closed iOS” is also overstated. |
| Android | PARTIAL | Real app + shared API layer in `android/**`. | Runtime maturity and CI gate depth are limited. | Production-grade runtime proof not provided in this run. | “Android only scaffold” is stale. |
| Approvals | PARTIAL | Report approvals + document decision/history surfaces exist. | Unified manager approvals semantics still fragmented. | Fully closed triage loop across entities not proven. | Not closed. |
| Documents / acts / contracts | PARTIAL | Project document APIs and manager UI flow exist. | Workflow is still evolving; approval semantics overlap with approvals domain. | Full operational closure checklist not proven here. | Prior “closed” claims are overstated. |
| Budget / cost | PARTIAL (repo-strong) | Cost routes + dashboard panels exist. | Runtime activation proof remains incomplete. | DB activation parity and live proof unresolved. | Not operationally closed. |
| Copilot / streaming / memory / AI interaction | PARTIAL | Copilot stream and AI memory routes exist. | AI interaction reliability and guardrails need hardening. | End-to-end runtime confidence not proven in this run. | Not closed. |
| Intelligence / risks / health / summaries | PARTIAL | Intelligence routes and UI layers exist. | Calibration/data dependence and trust signals are uneven. | Operational quality proof is incomplete. | Not closed. |
| Manager action layer | PARTIAL | Action/priority surfaces exist in dashboard and APIs. | Some dispatch/execution semantics are shallow or stubs. | Reliable closed-loop action automation proof missing. | Not closed. |
| Schedule / milestones | PARTIAL | Milestone/timeline entities and routes exist. | Depth and closed-loop scheduling operations are limited. | Full schedule closure (operational) not proven. | Not closed. |
| Release / migration / smoke / recovery | PARTIAL | CI/deploy/smoke scripts and docs exist. | DB apply is decoupled/manual; smoke scope is limited. | Full live runtime closure remains open. | Not closed. |
| Observability / runtime diagnostics | PARTIAL | Health/ops/diagnostics surfaces exist. | Signal depth and operational trust are uneven. | Complete operator-ready observability closure not proven. | Not closed. |

## Capability Closure Summary

- `RUNTIME_PROVEN` status is not broadly claimable across major domains from current evidence.
- No audited area can be honestly marked `OPERATIONALLY_CLOSED` at this point.
- First meaningful product closure target remains approvals semantics (Phase 1), but runtime gate constraints remain explicit.
