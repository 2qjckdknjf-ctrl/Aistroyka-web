# Supabase advisor program closure (2026-06-02)

## Scope

Live project **AISTROYKA** (`vthfrxehrursfloevnlp`, eu-central-1).

## Final advisor posture

| Advisor | Start (2026-05-29) | End (batch 7) |
|---------|-------------------:|--------------:|
| Security WARN | 1 (HIBP) | **0** |
| `multiple_permissive_policies` | 181 | **0** |
| `auth_db_connections_absolute` | 1 | **0** |
| `unused_index` | 305 | **190** |
| `unindexed_foreign_keys` (INFO) | 22 | **90** |

## Shipped work (PR #55–#70)

- Security: HIBP via Management API (#56–#57), RLS SECURITY DEFINER wrappers (#55)
- Performance: RLS policy split (#58–#59), index batches 1–7 (#61–#70)
- Ops: Auth DB pool percent workflow, audit doc `docs/audit/SUPABASE_PERFORMANCE_ADVISORS_2026-05-29.md`

## Deferred (traffic-backed)

- Remaining **190** `unused_index`: intentional tenant/project composites and low-traffic tables
- **90** `unindexed_foreign_keys` INFO: accepted tradeoff from fkfix cleanup; restore targeted indexes if slow queries appear
- **6** retained `idx_fkfix_*` on hot paths (`push_outbox`, `worker_reports`, `worker_tasks`, `ai_memory_records`)

## Verdict

**CLOSED** for pilot publication DB hardening. Further index drops require production query evidence.
