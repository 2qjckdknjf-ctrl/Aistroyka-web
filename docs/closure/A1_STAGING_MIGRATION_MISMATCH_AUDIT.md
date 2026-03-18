# A1 — Staging migration history mismatch audit

**Date:** 2026-03-18  
**Scope:** Staging only (Supabase project linked to GitHub Actions staging secrets).  
**Evidence source:** Local repo + Supabase MCP `execute_sql` / `list_migrations` against project **vthfrxehrursfloevnlp** (AISTROYKA), matching the versions cited in the failed workflow dry-run.

---

## 1. Staging project ref

| Field | Value |
|-------|--------|
| **Project ref** | `vthfrxehrursfloevnlp` |
| **Note** | Confirm this matches **GitHub → staging environment → SUPABASE_PROJECT_REF**. If staging uses another project, re-run the same queries against that project before mutating history. |

---

## 2. Command outputs (summarized)

### 2.1 Local migration files

**Path:** `apps/web/supabase/migrations/*.sql`  
**Count:** 53 SQL files (excluding `.gitkeep`).  
**Version IDs:** 14-digit prefixes, sorted from `20260303000000` through `20260307500000` (full list in §4).

### 2.2 Remote migration history

**Query:**

```sql
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
```

**Result (staging):**

| version | name |
|---------|------|
| 20260311181941 | stripe_webhook_idempotency |
| 20260314215938 | project_cost_items_step13_reconciliation |

**MCP `list_migrations`:** Same two rows.

### 2.3 Public schema footprint (context)

**Table count (public, BASE TABLE):** 22  
**Sample tables:** `tenants`, `projects`, `processed_stripe_events`, `project_cost_items`, `project_milestones`, …

So staging has **real schema** but **migration history records only two versions**, and those version IDs **do not exist** as files in the repo.

---

## 3. Mismatch table (by version string)

| Category | Versions | Notes |
|----------|----------|--------|
| **LOCAL ONLY** | `20260303000000` … `20260307500000` (53 versions) | All repo migration timestamps; **none** of these appear in `schema_migrations` on staging. |
| **REMOTE ONLY** | `20260311181941`, `20260314215938` | Recorded on staging; **no matching files** under `apps/web/supabase/migrations/`. |
| **BOTH** | *(none)* | No shared version string between local filenames and remote rows. |

**Logical overlap (not same version ID):**

| Remote version | Remote name | Closest local file |
|----------------|-------------|-------------------|
| 20260311181941 | stripe_webhook_idempotency | `20260306900000_stripe_webhook_idempotency.sql` |
| 20260314215938 | project_cost_items_step13_reconciliation | `20260307500000_project_cost_items.sql` |

Same features, **different timestamps**; remote versions are **after** local max (`075` &lt; `111` &lt; `142`).

---

## 4. Local-only version list (53)

```
20260303000000, 20260304000000, 20260304000100, 20260304000200, 20260304000300,
20260304000400, 20260305000000, 20260305000100, 20260305000200, 20260306000000,
20260306100000, 20260306130000, 20260306140000, 20260306150000, 20260306200000,
20260306235900, 20260306300000, 20260306400000, 20260306410000, 20260306420000,
20260306430000, 20260306440000, 20260306450000, 20260306460000, 20260306470000,
20260306480000, 20260306490000, 20260306500000, 20260306510000, 20260306520000,
20260306530000, 20260306540000, 20260306550000, 20260306560000, 20260306570000,
20260306580000, 20260306590000, 20260306600000, 20260306610000, 20260306620000,
20260306630000, 20260306640000, 20260306650000, 20260306660000, 20260306670000,
20260306680000, 20260306900000, 20260307000000, 20260307100000, 20260307200000,
20260307300000, 20260307400000, 20260307500000
```

---

## 5. Why the mismatch likely happened

1. **Ad-hoc or branch-specific applies:** Two migrations were applied to staging under timestamps `20260311181941` and `20260314215938` (names match Stripe idempotency and project cost items), while the canonical repo later standardized those changes as `20260306900000` and `20260307500000`.
2. **Incomplete history:** Staging records only those two rows; the rest of the schema likely came from earlier applies, resets, or partial pipelines—not reflected in `schema_migrations`. That is why **blind** “mark everything applied” would be unsafe without validating schema.

---

## 6. Safest correction path (evidence-based)

### Chosen case: **CASE B** (remote stray entries)

- Remote rows **20260311181941** and **20260314215938** are **not** represented in the repo (proven).
- They are **superseded** by canonical files `20260306900000_*` and `20260307500000_*` for the same features (proven by name/content alignment).
- **Do not** add duplicate stub files for `111`/`142` in the repo: that would leave 51+ migrations still “pending” vs remote and would not fix history.

**Official steps (Supabase CLI only; no hand-editing `schema_migrations`):**

1. **Before mutation** — save outputs:
   - `supabase migration list` (remote + local columns)
   - Optional: dump of `schema_migrations` (already captured above).

2. **Revert the two stale remote versions** (removes rows from migration history via supported CLI):

   ```bash
   cd apps/web
   export SUPABASE_ACCESS_TOKEN=<personal access token>
   supabase link --project-ref <STAGING_SUPABASE_PROJECT_REF>
   supabase migration repair --status reverted 20260311181941
   supabase migration repair --status reverted 20260314215938
   ```

3. **After mutation:**

   ```bash
   supabase migration list
   supabase db push --dry-run
   ```

4. **`db push`:** Expect a **large** pending set (full 53-migration chain). Many steps use `IF NOT EXISTS` / idempotent patterns; **some steps may still fail** if objects already exist with different definitions. If a step fails, **stop**, fix forward with a new migration or adjust per runbook—do not blind-repair.

5. **CI proof:** Re-run GitHub Actions **Apply Supabase migrations** with `target=staging`, `ref=main`.

---

## 7. Cases not chosen (and why)

| Case | Why not |
|------|---------|
| **CASE A (`db pull`)** | Remote is not the single source of truth for the full chain; history is two stray rows, not “repo should adopt remote schema” as one squashed migration. Pull would not reconcile 53-file history cleanly. |
| **CASE C (`repair --status applied` for all local versions)** | Would mark 53 migrations applied **without running SQL**. Staging only has 22 public tables vs a much larger migrated surface in repo—high risk of **false “applied”** and hidden drift. |

---

## 8. Execution status (this workspace)

| Step | Status |
|------|--------|
| Audit (local list + remote SQL + MCP) | **Done** |
| `supabase migration repair` / `db push` | **Not run here** — `SUPABASE_ACCESS_TOKEN` not available in this environment; requires operator machine or CI with staging token |

After an operator completes §6, update `docs/closure/A1_MIGRATION_APPLY_LIVE_EVIDENCE.md` with the new workflow run id, dry-run/db push outcome, and final status.

---

## 9. Operator command sequence (with `--linked`)

Run from `apps/web` after `export SUPABASE_ACCESS_TOKEN=<personal access token>` (Account → Access Tokens):

```bash
cd apps/web
supabase link --project-ref vthfrxehrursfloevnlp
supabase migration list
supabase migration repair 20260311181941 --status reverted --linked
supabase migration repair 20260314215938 --status reverted --linked
supabase migration list
supabase db push --dry-run --linked
supabase db push --linked
```

Then from repo root:

```bash
gh workflow run apply-migrations.yml -r main -f target=staging -f ref=main
```

### 9.1 Agent attempt (2026-03-18)

| Step | Result |
|------|--------|
| Shell `SUPABASE_ACCESS_TOKEN` | **Not set** — repair / `db push` / `migration list` via CLI **not executed** |
| GitHub `gh` | Authenticated on operator machine in some sessions; **irrelevant until CLI path completes** |

**Exact blocker:** Staging mismatch resolution requires a **Supabase personal access token** in the shell. Cursor/agent execution environment had **no** token; no blind DB changes were made.

### 9.2 Cursor agent run (2026-03-18, follow-up)

Оператор сообщил, что токен задан в своём shell. В **подпроцессе Cursor (run_terminal_cmd)** `SUPABASE_ACCESS_TOKEN` **не виден** (`printenv` / `npx supabase link` → «Access token not provided»). В `apps/web/.env.local` поля `SUPABASE_ACCESS_TOKEN` нет. **Команды repair / db push из агента не выполнялись.** Чтобы агент мог вызвать CLI, добавьте в `apps/web/.env.local` строку `SUPABASE_ACCESS_TOKEN=...` (файл в `.gitignore`) или выполните §9 вручную в том терминале, где экспортирован токен.
