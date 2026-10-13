# Database tail handoff — 2026-10-11

Completion update: #416 was subsequently merged and applied at remote 20261011093430. Current handoff: [continuation state](2026-10-11-continuation-state.md). The text below is the earlier delivery snapshot.

Baseline 2e2f07da. Intake/RPC/private-helper migrations already applied. After #415 live apply, five helpers are app_private; anon EXECUTE false, authenticated policy helper EXECUTE true, direct identity-trigger EXECUTE false. RLS policies (4) and user triggers (3) persist. The full API synthetic intake lifecycle passed again and all exact owned probe rows were removed.

The present slice adds 20261011092645_close_post_apply_database_tails.sql and a six-check SQL harness for daily-log search_path and intake FK coverage. Do protected merge, then apply after confirming intake size and exact trigger body, verify advisors and schema, and update the dated operational pointers and evidence. Existing owner authorization covers this operation. Do not request it again.

Three more old PRs (#281/#289/#293) were closed after all changed file blobs matched origin/main. Remote branch heads were read back unchanged. A read-only audit covered 78 prior open PRs; 75 require semantic reconciliation, not bulk merging. Private audit manifest and sanitized closure evidence are separate from customer data.

Staging deployment for #415 is still running at this snapshot (38128324110). Production promotion must follow successful staging; health SHA is the final evidence. Remaining legacy advisories and physical-device/store/billing/legal requirements are not closed by this migration.
