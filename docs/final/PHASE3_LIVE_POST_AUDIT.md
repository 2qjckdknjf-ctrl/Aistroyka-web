# Phase 3 — Live activation post-audit

**Date:** 2026-03-23  
**Issue:** Paperclip **AISAA-10** — Phase 3 — Live activation / runtime truth  
**Verdict:** **NO**

---

## Executive summary

Repository migration **discipline** is intact (62 files, sanity script passes), but **runtime truth does not match “green production”**:

1. The Supabase project linked from this developer CLI is **missing** the latest migration (`20260323000000_project_members_owner_role.sql`).
2. Production **`GET /api/v1/health`** returns **503** with a **database/RLS error** (`tenant_members` policy recursion), so core readiness checks are **failing** even where the edge returns JSON.
3. **Staging** and **production DB** parity were **not** independently re-verified with explicit project refs.
4. **Live environment variable** audit against `docs/ENVIRONMENT-VARIABLES.md` was **not** performed (dashboard access).
5. **Full** `pilot_launch.sh` (cron + authenticated metrics) was **not** run with secrets in this heartbeat.

---

## Verdict table

| Criterion | Met? |
|-----------|------|
| Migration files + ordering sane in repo | **YES** |
| Linked remote caught up to repo (CLI evidence) | **NO** |
| Production health (`/api/v1/health`) indicates healthy DB | **NO** |
| Staging matrix completed | **NO** (OPEN) |
| Live env cross-check documented | **NO** (OPEN) |
| Full pilot smoke with Bearer against prod | **NO** (OPEN) |

---

## OPEN list (actionable)

1. **Apply** `20260323000000_project_members_owner_role.sql` to **production** and **staging** Supabase projects (use the existing GitHub “apply migrations” workflow or `supabase db push` with the correct ref); re-run `supabase migration list` per environment and attach redacted output.
2. **Fix RLS** on `tenant_members` (or dependent policies) — production health reports **infinite recursion**; until resolved, any monitor expecting `ok:true` will fail.
3. **Re-run** `scripts/smoke/pilot_launch.sh` against production with valid `AUTH_HEADER` / `CRON_SECRET` as required; confirm CI blocking job still aligns with tightened health semantics if you change the script.
4. **Dashboard env audit:** complete the presence/absence matrix vs `docs/ENVIRONMENT-VARIABLES.md` for Production (and Preview/staging if used).
5. **Optional hardening:** update `pilot_launch.sh` health assertion to require `ok:true` (JSON parse) so 503 + `ok:false` fails the smoke explicitly.

---

## Artifacts

| Deliverable | Path |
|-------------|------|
| Live matrix | `docs/final/PHASE3_LIVE_MATRIX.md` |
| Commands + results | `docs/final/PHASE3_RUNTIME_VALIDATION.md` |
| Post-audit (this file) | `docs/final/PHASE3_LIVE_POST_AUDIT.md` |

---

## Closeout tag

**inspected** · **incomplete** (staging + prod DB parity + env audit + full smoke) · **validated** (repo + partial live curls + CLI migration drift) · **verdict NO**
