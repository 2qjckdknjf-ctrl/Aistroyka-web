# AI Brain Phase C — Memory Model Spec

**Status:** Phase C  
**Date:** 2026-03-23

## Memory Kinds

1. **SESSION** — short-lived, run context, single interaction
2. **PROJECT_WORKING** — operational context per project (blocker, evidence gap, pending focus)
3. **USER_PREFERENCE** — display/communication preferences (concise vs detailed, tone)
4. **LEARNING_CANDIDATE** — correction signals, failure patterns, human edits (NOT full learning)

## Required Fields

- memoryId, tenantId, projectId (nullable), userId (nullable)
- memoryType, scope, sourceKind, sourceRef
- title/label, body/value payload
- factsUsed, grounding refs
- confidence, ttl/expiresAt, status
- supersededBy, createdAt, updatedAt

## Rules

- No magic blobs without type/scope
- Separate facts from inferred summaries
- Human vs AI vs system-derived marked clearly
- AI-derived must be marked; safe to ignore if stale/weak
