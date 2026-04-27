# AI Brain Phase B — Policy Engine Spec

**Status:** Phase B  
**Date:** 2026-03-23

## Policy Inputs

- user role (manager, worker, client, admin)
- tenant scope
- project membership
- action type
- project/module availability (from ProjectTruthSnapshot)
- module maturity
- current mode

## Policy Outputs

- allowed_as_read_only
- allowed_as_draft_only
- requires_manual_approval
- unavailable_due_to_partial_module
- forbidden

## Honesty Rules

- Approvals/document/cost areas partial → draft-only or unavailable
- No pretending modules are safe when they are not

## Components

- action policy evaluator
- risk classifier
- approval requirement classifier
- availability/degradation mapping
