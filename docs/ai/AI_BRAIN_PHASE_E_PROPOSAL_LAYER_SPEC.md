# AI Brain Phase E — Proposal Layer Spec

## Overview

The proposal layer turns Phase D improvement candidates into explicit optimization proposals. Proposals do not change live behavior.

## Flow

1. Improvement candidate (Phase D) exists with review_status approved
2. `createProposalFromCandidate(supabase, candidateId)` creates a proposal
3. Proposal links back via sourceCandidateId and linkedEvidenceRefs
4. Proposal has targetLayer, rationale, expectedGain, riskLevel, readiness

## Lifecycle

- draft → ready_for_review → pending (review) → approved / rejected
- Proposal review_status is independent; does not auto-apply

## API

- `createProposalFromCandidate(supabase, candidateId, overrides?)` — From candidate
- `createProposal(supabase, input)` — Direct create
- `listProposals(supabase, options)` — By tenant/review status
- `getProposalById(supabase, proposalId)` — Single fetch
