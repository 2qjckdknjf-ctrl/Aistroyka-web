# Wave 3 — Live positive flow report

**Date:** 2026-03-28  
**Target:** `https://aistroyka.ai` (production)  
**Auth:** Supabase password grant → Bearer JWT (operator env from `.env.local`).

---

## Preconditions

- All `curl` calls to `BASE_URL` MUST use **`curl --location-trusted`** (or canonical host only) to preserve `Authorization` across **apex/www** redirects.

---

## C1 — Worker task list

| Endpoint | Result |
|----------|--------|
| `GET /api/v1/worker/tasks/today` (+ Bearer, optional `x-client: ios_lite`) | **HTTP 200** (empty list in this run: `data` length **0**) |

**Evidence:** No assigned tasks in pilot tenant for this user — **assigned task detail** (`GET /api/v1/tasks/:id` for a real assignment) **not exercised** in this run.

---

## C2 / C3 — Create report, submit proof, enqueue

**Not executed end-to-end** in this session (requires upload session + storage + finalize + add-media, or a scripted multipart flow).

**Partial evidence:** `POST /api/v1/worker/report/create` → **HTTP 200** with draft `data.id` prefix `41c91a39…` (full report id redacted in operator logs).

**Critical:** Immediately after, `POST /api/v1/worker/report/submit` **without** `add-media` returned **HTTP 200** with `status: "queued"` and a `jobIds` entry — **this contradicts** the repo Wave 3 rule **proof_required** and proves **production** deployed build **does not yet include** server-side proof enforcement (or deploy is not current).

---

## C4 — Report read (own)

| Endpoint | Result |
|----------|--------|
| `GET /api/v1/reports/<draft-id>` | **HTTP 200** after submit (status **submitted** in body) |

---

## Post-submit enqueue

- Response included **`jobIds`** array (at least one job id) — **consistent** with enqueue path on **submitted** report.

---

## Blockers

1. **No full G4 chain** (upload → finalize → attach → submit) in this run.
2. **Production submit-without-proof** still accepted — **deployment / release drift** vs repo.
3. **No assigned task** in list — task detail **positive** path for a **real** assignment **not proven** live.

---

**Status:** **PARTIAL** — list + read + report create work; **proof-required submit** and **assigned task detail** **not** proven live.
