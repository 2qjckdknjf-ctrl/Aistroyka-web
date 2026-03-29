# Wave 4 Step 7 — Date gate resolution

**Date:** 2026-03-29

## D1 — UTC date at resolution

**2026-03-29** — **before** 2026-03-30.

## D2 — Gate status

`scripts/release/check-migrations.sh` **failed** on filenames `20260330120000` … `20260330190000` (`ts > today`).

## D3 — Chosen path: **B — rename** (justified)

**Proof migrations were unapplied on linked remote:** `supabase migration list` showed **Remote** column **empty** for all `202603301*` files before any successful apply.

**Renames (filesystem `mv`, same content):**

| Old | New |
|-----|-----|
| `20260330120000_project_client_requests.sql` | `20260329110000_project_client_requests.sql` |
| `20260330140000_project_stakeholders.sql` | `20260329120000_project_stakeholders.sql` |
| `20260330150000_tenant_members_stakeholder_role.sql` | `20260329130000_tenant_members_stakeholder_role.sql` |
| `20260330170000_stakeholder_rls_isolation.sql` | `20260329140000_stakeholder_rls_isolation.sql` |
| `20260330180000_stakeholder_rls_remaining.sql` | `20260329150000_stakeholder_rls_remaining.sql` |
| `20260330190000_stakeholder_rls_identity_export_photo.sql` | `20260329160000_stakeholder_rls_identity_export_photo.sql` |

**Ordering:** Strictly increasing after `20260329100000_project_client_portal.sql`.

## D4 — Code references updated (minimal)

- `apps/web/lib/tenant/rls-stakeholder-predicates.test.ts` — comment  
- `apps/web/supabase/migrations/20260329150000_stakeholder_rls_remaining.sql` — dependency comment  

## D5 — Validation

`bash scripts/release/check-migrations.sh` → **PASSED** (79 migrations).

## D6 — Alternative (not used)

Wait until **2026-03-30** UTC — unnecessary after safe rename.
