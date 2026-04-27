# AI Brain Phase C — Memory Write Policy

**Status:** Phase C  
**Date:** 2026-03-23

## Source Kinds

- system_derived
- human_confirmed
- ai_suggested
- ai_inferred
- action_outcome

## Write Rules

- system_derived: allowed (session, project_working)
- human_confirmed: allowed (all types)
- ai_suggested: allowed as session; project_working only with grounding
- ai_inferred: session only; downgraded to low confidence
- action_outcome: allowed (learning_candidate)

## Rejected

- Raw prompt dumps
- Unattributable claims
- Cross-tenant data

## Confidence

- human_confirmed → high
- system_derived with refs → high
- ai_suggested with grounding → medium
- ai_inferred → low
