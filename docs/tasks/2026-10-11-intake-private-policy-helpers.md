# Task: intake private policy helpers

Branch: fix/intake-private-policy-helpers-2026-10-11, baseline d20827fd. PR #415.

Owner explicitly authorized autonomous work and operational application on 2026-10-11. Isolated SQL/REST tests preceded the live intake/RPC apply. Five newly exposed SECURITY DEFINER helpers must move to app_private while existing policies and triggers retain their OIDs and authorization behavior. This slice follows the existing intake implementation; it does not recreate intake or expand AI scope.

Acceptance: public helper RPC absent; anon EXECUTE denied; authenticated policy paths, projectless stakeholder, internal owner and identity/status protection work; retry/concurrency and tenant negatives pass; protected current-head review and required CI pass; apply this migration only after merge and verify live advisors/RLS/REST. Update current pointers with the final dated operational evidence.

Validation and scope: docs/reports/2026-10-11-intake-private-policy-helpers.md. Preserve private schema snapshots, credentials and all old branches/worktrees.
