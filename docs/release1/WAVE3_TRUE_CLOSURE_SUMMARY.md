# Wave 3 — True closure summary

**Date:** 2026-03-28

---

## Proven live (this session)

- **`pilot_launch.sh`** end-to-end **PASS** on **`https://aistroyka.ai`** when both env files are sourced and Supabase key order matches the script.
- **Bearer + `--location-trusted`:** `GET /api/v1/tasks/<random-uuid>` → **404**; `GET /api/v1/reports/<random-uuid>` → **404**; `GET /api/v1/worker/tasks/today` → **200** (empty list).
- **Production build stamp** from health (informational): `sha7` present in `/api/v1/health` payload during probe.
- **Android** `shared` module **compiles** after Worker task DTO alignment.

---

## Proven in repo only (not live on production)

- **`proof_required`** on submit — **not** observed on production (submit without media **200**).
- **Lite allow-list** for `GET /api/v1/tasks/:id` and `GET /api/v1/reports/:id` — **403** on production for `ios_lite` + tasks path until deploy.

---

## Unproven / limitations

- Full **G4** chain with real storage uploads.
- **Second worker** cross-read denial with a **real** peer report id.
- **Assigned** task **GET** success (no tasks returned for pilot user).
- **iOS** build / device.
- **Production** parity with **`main`** after merge + deploy.

---

## Blockers

1. **Deploy** current `main` (or PR containing Wave 3 + lite-list + Android fix) to **Production** or verify on **Vercel Preview** URL.
2. **Operator** must use **`curl --location-trusted`** (or canonical host) for all authenticated API checks.
3. Optional test data: **second worker**, **assigned task**, cleanup of **orphan submitted report without proof** created during live probe.

---

## Wave 4 allowed?

**NO** — Wave 3 **live closure** criteria are **not** met; proceed only after **deploy + re-audit** or explicit product waiver of live proof (not requested here).

---

## Files to read next

- `WAVE3_FINAL_POST_AUDIT_REPORT.md`
- `WAVE3_LIVE_NEGATIVE_PATH_REPORT.md`
- `WAVE3_PILOT_SMOKE_REPORT.md`
