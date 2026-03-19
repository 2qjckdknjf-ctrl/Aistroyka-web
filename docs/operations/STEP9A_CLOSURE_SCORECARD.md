# Step 9A — Closure scorecard

| Area | Status | Reason | Blocker if not FULL |
|------|--------|--------|------------------------|
| **Manager workflow** | **FULL** (Intelligence tab scope) | Banner + errors + copy ref + prioritized steps + thin-vs-model copy | — |
| **Operator workflow** | **FULL** (panel scope) | Empty state + drilldown + hints | — |
| **State model** | **FULL** (declared states) | Labels + trust_summary branches distinguish thin / partial / low-confidence / healthy | — |
| **Actionability** | **PARTIAL** | Hints grounded; depth still depends on backend recommendation quality | Content, not wiring |
| **Role / access** | **FULL** | No regression | — |
| **Validation confidence** | **PARTIAL** | tsc + unit OK; **next build failed on agent (SWC)** | Run CI build before release |
