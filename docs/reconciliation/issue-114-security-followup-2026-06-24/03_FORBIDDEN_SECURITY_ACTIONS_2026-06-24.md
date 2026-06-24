# Forbidden Security Actions — Issue #114 Follow-Up

**Date:** 2026-06-24

Actions that must **not** be taken from this audit PR or without a separate approved operator task.

## Branch / merge

- Do **not** broad-merge `audit/issue-114-middleware-security-stacked-audit-2026-06-22`
- Do **not** broad-merge `hotfix/middleware-matcher-and-headers`
- Do **not** broad-merge `feat/p0-deps-and-security-headers`
- Do **not** broad-merge `claude/aistroyka-audit-security-infra-cg810i`
- Do **not** broad-merge or touch `cursor/aistroyka-system-maturity-7957`
- Do **not** merge any stale security branch without fresh rebase + small-slice audit

## Runtime / ops

- Do **not** deploy from this audit PR
- Do **not** run staging or production smoke as part of this audit PR
- Do **not** claim live header PASS without operator-approved smoke per `docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md`

## Data / schema

- Do **not** apply Supabase migrations
- Do **not** touch live Supabase data
- Do **not** change auth/RLS policies or RPC grants without separate design audit

## Code (unless separate implementation PR)

- Do **not** change `middleware.ts` matcher or routing in this audit PR
- Do **not** change CSP/HSTS values in production code without header smoke evidence
- Do **not** add CSP to API responses
- Do **not** weaken owner gate, lite allow-list, or protected-route logic

## Governance

- Do **not** change branch protection settings
- Do **not** self-approve or bypass protected merge
- Do **not** commit secrets or tokens

## Resurrection

- Do **not** resurrect deleted archive branches from issue #117 execution without owner checklist
- Do **not** delete remaining manual-review security branches without backup tags
