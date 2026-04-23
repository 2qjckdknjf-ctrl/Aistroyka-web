# AI Brain Phase C — Memory Boundaries

**Status:** Phase C  
**Date:** 2026-03-23

## May Be Stored as Memory

- "Manager currently worried about delayed evidence"
- "Client prefers short status updates"
- "Last evidence gap discussed: task X"
- "Pending follow-up focus: approval Y"
- User-stated display preferences

## May Never Be Stored as Memory

- Project status (authoritative domain)
- Task overdue state (domain truth)
- Report submission state (domain truth)
- Financial/cost figures (domain truth)

## Must Stay in Domain Services

- Project health, risk counts, evidence coverage
- Task/report/document/milestone state
- Approvals, costs, issues

## Session-Only

- Current run context (ask/answer)
- Action planning state within single request

## May Persist Across Runs

- PROJECT_WORKING — with TTL
- USER_PREFERENCE — until user changes
- LEARNING_CANDIDATE — until superseded/expired

## Expiration Rules

- SESSION: end of request/session
- PROJECT_WORKING: default 7 days
- USER_PREFERENCE: 90 days or until superseded
- LEARNING_CANDIDATE: 30 days, or superseded by correction

## Invalidation

- When domain truth contradicts memory
- When supersededBy set
- When expiresAt passed

## Principle

Memory must never silently override domain truth.
