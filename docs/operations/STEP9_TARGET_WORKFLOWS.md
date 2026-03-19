# Step 9 — Target workflows

## A. Manager

1. Open project → Intelligence tab.
2. **First read:** trust band + data coverage state + why bullets + next steps.
3. Scroll: health, summary, risks, evidence, recommendations (unchanged structure).
4. On error: see **permission vs runtime vs session** + copyable reference ID.

**Success:** Manager distinguishes thin data from product outage; knows what to do next.

## B. Operator / admin

1. Open `/admin/ai`.
2. Scroll to **AI runtime (routes & failures)**.
3. Read error rate, traffic by route, recent errors with trace pills.
4. Use `operator_hints` + build SHA to classify incident.
5. Correlate `trace_id` with log lines.

**Success:** Faster classification (auth vs data vs provider vs release).

## Critical states (normalized)

| State | Manager signal | Operator signal |
|-------|----------------|-----------------|
| Loading | Skeletons | — |
| No data yet | Empty copy improved | Low audit volume |
| Insufficient data | Banner + trust low | intelligence diagnostics in logs |
| Degraded | Medium trust + why | — |
| Auth | “Session required” | classify_401 hint |
| Permission | “No access” | classify_403 |
| Runtime failure | 503 copy + ref | 503 hints + audit error rows |
