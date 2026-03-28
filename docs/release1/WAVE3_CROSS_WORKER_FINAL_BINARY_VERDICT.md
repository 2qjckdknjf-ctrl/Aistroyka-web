# Wave 3 — Cross-worker final binary verdict

**Date (UTC):** 2026-03-28

## Proven live

1. **Code:** Lite field workers (`ios_lite` / `android_lite`) cannot use tenant-wide manager GET semantics for **reports** and **tasks** (commit **`6a808bd`** on `main`).
2. **Data:** Worker B + draft report owned by B in smoke tenant.
3. **Denial:** Worker A JWT + `ios_lite` → **404** on B’s report id.
4. **Allow (own):** Worker B JWT + `ios_lite` → **200** on same id.

## Not proven

- **Peer task** denial (no suitable `worker_tasks` row without extra project seeding).

## Binary

- **WAVE3_LIVE_CLOSED:** **YES**
- **WAVE4_ALLOWED:** **YES**
