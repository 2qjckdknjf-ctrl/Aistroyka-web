# AI Brain Phase C — Memory Retrieval Spec

**Status:** Phase C  
**Date:** 2026-03-23

## Mode-Aware

- manager_assist, executive_summary: project_working, user_preference, learning_candidate
- worker_assist: project_working, user_preference
- client_safe_summary: user_preference (sanitized)

## Bounded

- Default limit 10 per run
- Count/token budget: limit param

## Filtering

- stale: excluded
- expired: excluded (expiresAt < now)
- superseded: excluded (status)
- min confidence: optional filter

## Integration

- getRelevantMemoryForRun used by action-plan route
- Memory added to response as optional `memory` field
