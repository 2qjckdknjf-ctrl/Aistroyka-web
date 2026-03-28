# Wave 3 — Final mobile and client report

**Date (UTC):** 2026-03-28

## Lite / mobile API (production)

Verified on **`https://www.aistroyka.ai`** with:

- `x-client: ios_lite` (or `android_lite` where tested earlier)
- `Authorization: Bearer <Supabase access token>`
- **`x-idempotency-key`** on all lite **writes** (`create`, `upload-sessions`, `finalize`, `add-media`, `submit`)

## What is proven (API-level)

- **Submit with proof** end-to-end returns **`status":"queued"`** with **`jobIds`**.
- **GET** own report after submit returns **`submitted`** and **media** linkage (`upload_session_id`).
- **Tasks today** empty array — no device-specific behavior required for this proof.

## Device proof

- **Not run:** Physical iOS/Android app against production in this session.

## Manual device procedure (unchanged)

1. Set app base URL to **`https://www.aistroyka.ai`**.
2. Log in as pilot worker.
3. Repeat: create report → upload session → finalize → add-media → submit; confirm queue response.

## Blockers

- None for **API contract** parity with mobile headers.
