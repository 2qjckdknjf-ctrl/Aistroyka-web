# Wave 0.9 — Progress log

## 2026-03-27 — Final Wave 1 unlock (post–hotfix)

- Re-verified linked Supabase: `public.tenant_invitations` exists; **3** RLS policies on table.
- Re-verified smoke user `smoke@aistroyka.ai`: tenant `Smoke (pilot)`, **owner** in `tenant_members`, `tenants.user_id` aligned.
- Re-ran `scripts/smoke/pilot_launch.sh` with `apps/web/.env.local` sourced → **PASS** health, config, cron-tick, ops/metrics; exit **0**.
- Confirmed `GET /api/v1/health` → **HTTP 200** with `ok: true` (direct curl).
- **Decision:** **WAVE1_APPROVED** (recorded in `WAVE09_FINAL_UNLOCK.md`).

---

*Append below for future Wave 1+ checkpoints only.*
