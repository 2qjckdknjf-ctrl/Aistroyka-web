# AI Brain Phase E — Telemetry

## Overview

Structured telemetry for the Controlled Optimization Layer. Safe metadata only.

## Events

| Event | Description |
|-------|-------------|
| phase_e_proposal_created | Proposal created |
| phase_e_package_created | Package created |
| phase_e_experiment_complete | Experiment completed |
| phase_e_decision_recorded | Decision recorded |

## Captured Fields

- proposal_id, source_candidate_id, target_layer, tenant_id
- package_id, proposal_id, package_type
- experiment_id, package_id, execution_mode, status, regression_count
- decision_id, proposal_id, decision_type
