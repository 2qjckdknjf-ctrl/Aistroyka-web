# Failure and Rollback Policy

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## If Smoke Fails

Do:

- capture exact endpoint/test name
- capture status code and non-secret error body
- distinguish platform auth failure from app runtime failure
- distinguish missing credentials from product regression
- stop additional mutable smoke
- report blocker in the relevant PR/issue

Do not:

- retry repeatedly without new evidence
- rotate secrets casually
- create additional users
- deploy a fix without approval
- call a fallback response live success

## If Cleanup Fails

Do:

- stop immediately
- record what remains
- record identifiers only when non-sensitive
- escalate to operator/data owner
- do not create more smoke data

Do not:

- hide cleanup failure
- leave privileged accounts active
- continue to production gates

## If Branch Protection Blocks Merge

Do:

- keep PR green
- document exact GitHub blocker
- wait for required reviewer/admin approval

Do not:

- disable protection
- force merge
- use admin bypass without explicit approval
- create fake approvals

## If CI Fails

Do:

- inspect failing check logs
- classify branch-caused vs external/transient
- fix only if branch-caused and in scope
- rerun focused and full validation

Do not:

- push docs-only status churn to reset CI
- skip required checks
- merge with red CI

## If Production Smoke Fails After Deploy

Do:

- treat as incident/gate failure
- preserve logs
- identify whether deploy already changed runtime
- wait for operator approval for rollback/fix-forward

Do not:

- automatically revert
- automatically redeploy
- change Cloudflare/Vercel/Supabase settings without approval

## No Automatic Rollback

Rollback or fix-forward requires explicit operator approval because deployment source of truth is Cloudflare Workers and live data may be involved.

## Policy Verdict

Failure policy status: documented. Needs operator adoption before next release smoke run.
