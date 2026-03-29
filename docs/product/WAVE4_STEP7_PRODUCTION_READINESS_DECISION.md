# Wave 4 Step 7 — Production readiness decision

**Date:** 2026-03-29

## G1 — Staging status

- **Drift** addressed on **linked** project via repair + `--include-all` + SQL fix.  
- **Step 7** migrations **applied** on that project (through `20260329160000`).  
- **Automated verification** (dashboard SQL, portal smoke) **deferred** to operator — see staging verification doc.

## G2 — Production safe to proceed?

**Conditional YES** for **process**: same **git ref**, same **CLI** sequence, GitHub Environment **production** secrets (`SUPABASE_PROJECT_REF` for **production** project), and **`supabase db push --include-all`** after `migration list` review.

**NOT executed here:** production `link` / `push` — **no production credentials** in this session.

## G3 — Production-specific risks

Run **`supabase migration list`** against **production** **before** push. If production has **different** drift (e.g. other remote-only versions), **stop** and repeat audit/repair **only** with production truth — **do not** assume parity with staging.

## Decision

| Question | Answer |
|----------|--------|
| Is repo + workflow ready for production apply? | **YES** (workflow updated with `--include-all`) |
| Has production been updated in this session? | **NO** |
| Is production **automatically** safe without preflight? | **NO** — requires production `migration list` + dry-run |
