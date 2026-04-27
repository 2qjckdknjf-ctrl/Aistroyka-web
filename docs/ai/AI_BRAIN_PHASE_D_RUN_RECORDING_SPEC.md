# AI Brain Phase D — Run Recording Spec

**Status:** Phase D  
**Date:** 2026-03-23

## Goal

Record AI Brain executions in a structured way for later evaluation.

## Attach Points

- project-brief flow
- action-plan flow
- memory-aware flows

## Metadata

- runId, tenantId, projectId, userId
- route, mode
- truth snapshot ref, action plan refs, memory refs
- output contract type, degraded flags
- execution timing, validation result
- version refs

## Rules

- No secrets or sensitive raw content
- Tenant/project/user scoping strict
