# Live Supabase Final Verification

## Inspected files (repo)

- `apps/web/supabase/migrations/*.sql` (parity reference; not a substitute for live read)

## Live verification — Cursor MCP `user-supabase` (2026-05-09)

**Method:** Read-only calls against the Supabase project linked in IDE MCP (same stack as Dashboard API — not anon-key SQL from this agent).

| Step | Tool | Result |
|------|------|--------|
| Project URL | `get_project_url` | `https://vthfrxehrursfloevnlp.supabase.co` (ref **`vthfrxehrursfloevnlp`**) |
| Tables (`public`) | `list_tables` | **PASS** — required core + roadmap tables **present** (see `LIVE_SUPABASE_SCHEMA_REPORT.md`) |
| Applied migrations | `list_migrations` | **PASS** — chain includes `base_tenants_projects` through `phase11_tenant_contractor_profiles`, `phase10_telegram_integration`, `phase6_proof_pack_shares`, customer estimates/change orders, etc. |
| Advisors | `list_tables` (embedded advisory) | **Note:** MCP reports **11** `public` tables with **RLS disabled** (mostly internal/AI optimization catalog). **No** auto-remediation applied; treat as separate security backlog (enabling RLS without policies would lock tables). |

**Destructive actions:** **None** (no `db push`, no `apply_migration`).

## Local Supabase CLI (management API) — still blocked (2026-05-09)

| Step | Result |
|------|--------|
| `supabase projects list` | **Unauthorized** — `SUPABASE_ACCESS_TOKEN` in typical `apps/web/.env.local` is often an **anon/JWT**, not an [Account PAT](https://supabase.com/dashboard/account/tokens). |
| `supabase link` / `migration list` / `db push --dry-run --linked` | **Not run** via CLI this session (MCP already proved live migrations). |

**Operator fix (optional, for CLI workflows):**

1. Dashboard → **Account** → **Access tokens** → create PAT → `export SUPABASE_ACCESS_TOKEN=…` (do not use anon/service_role).
2. `export SUPABASE_PROJECT_REF=vthfrxehrursfloevnlp` (or omit if `supabase link` interactive).
3. `supabase login` **or** token env → `supabase link --project-ref "$SUPABASE_PROJECT_REF"` → `supabase migration list` → `supabase db push --dry-run --linked`.

## Proof summary

- **Live** hosted project matches app config host pattern used in repo deploy docs.
- Critical tables and migration history **verified** via MCP on **2026-05-09**.
- CLI PAT remains an **optional** convenience path; schema closure does **not** depend on it once MCP/Dashboard evidence is recorded.

## Final verdict

**PASS** — live schema + migration history verified (read-only MCP, 2026-05-09).  
**CLI management token:** **BLOCKED** until PAT is fixed (does not reverse the **PASS** above).
