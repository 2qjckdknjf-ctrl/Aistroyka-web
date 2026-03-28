# Wave 3 — Post-deploy rule verification (checklist)

**Date:** 2026-03-28  
**Prerequisite:** `GET /api/v1/health` → `buildStamp.sha7` = **`8ea1603`** (or newer `main`).

---

## C1. Submit without proof

**Expected:** `POST /api/v1/worker/report/submit` → **HTTP 400**, body includes `code: proof_required` (or `error` text).

**Procedure:**

```bash
# After password grant → TOKEN; use --location-trusted on all app API calls
curl -sSL --location-trusted -X POST "$BASE/api/v1/worker/report/create" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "x-idempotency-key: $(openssl rand -hex 8)" \
  -d '{}' 
# capture data.id as RID

curl -sSL --location-trusted -X POST "$BASE/api/v1/worker/report/submit" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "x-idempotency-key: $(openssl rand -hex 8)" \
  -d "{\"report_id\":\"$RID\"}"
```

**Pre-deploy observation (still `sha7=3d329d3`):** submit without media → **HTTP 200** (incorrect vs Wave 3).

**Post-deploy:** **Not re-verified** — health stamp unchanged in session.

---

## C2. Lite `GET /api/v1/tasks/:id`

**Expected:** **Not** `403` `lite_client_path_forbidden` for valid GET path; **404** for non-existent id.

```bash
curl -sSL --location-trusted -H "Authorization: Bearer $TOKEN" \
  -H "x-client: ios_lite" -H "x-device-id: test" \
  "$BASE/api/v1/tasks/00000000-0000-0000-0000-000000000001"
```

**Pre-deploy:** **403** forbidden (old middleware).

**Post-deploy:** **Pending.**

---

## C3. Lite `GET /api/v1/reports/:id`

**Expected:** **404** for random id; **200** for own report id.

**Pre-deploy:** random id → **403** (blocked at middleware).

**Post-deploy:** **Pending.**

---

## C4. Submit with proof (full chain)

**Expected:** create upload session → storage upload → finalize → `add-media` → submit → **200** with coherent `jobIds`.

**Status:** **Not executed** in this session (requires storage + binary upload).

---

**Overall:** **OPEN** until deploy SHA updates **and** commands re-run.
