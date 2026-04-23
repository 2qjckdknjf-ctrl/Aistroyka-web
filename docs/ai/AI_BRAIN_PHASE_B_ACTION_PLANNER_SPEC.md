# AI Brain Phase B — Action Planner Spec

**Status:** Phase B  
**Date:** 2026-03-23

## Purpose

Transform ProjectTruthSnapshot + mode + user intent into zero or more safe AiActionDraft objects.

## Rules

- Prioritize conservative actions
- Prefer draft actions over execution
- Include explicit reasons
- Avoid proposing actions unsupported by module maturity
- Produce no action rather than unsafe action

## Fallback

- Incomplete context → return empty list or degraded proposal
- Snapshot null → no actions

## Mode-Aware Logic

- executive_summary → draft_manager_escalation, draft_client_update when risks high
- manager_assist → draft_followup_task, draft_approval_followup when pressure
- worker_assist → draft_report_review_note, draft_request_more_evidence when gaps
