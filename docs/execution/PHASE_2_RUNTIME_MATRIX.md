# Phase 2 — Runtime Matrix (Staging)

**Date:** 2026-04-18  
**Environment:** `https://staging.aistroyka.ai`  
**Actor context:** authenticated tenant user with role `admin`.

## Goal

Validate end-to-end document loop:

- `create -> upload -> under_review -> request_changes -> resubmit -> approve`
- `create -> upload -> under_review -> reject`

## Runtime execution summary

### Step A — Upload blocker revalidation

- Previous blocker: `POST /api/v1/projects/{id}/documents/{documentId}/upload` returned
  `{"error":"new row violates row-level security policy"}`.
- Applied live DB policy fix for `storage.objects` (`media` bucket) to allow:
  - tenant-member access,
  - tenant-owner access (`tenants.user_id = auth.uid()`),
  - project-id-prefixed paths that belong to accessible tenant projects.
- Recheck result: **PASS**.
  - upload endpoint now returns `200`,
  - document status transitions `draft -> uploaded`,
  - object path persists in storage and document row.

### Step B — Flow `create -> upload -> under_review -> reject`

- Runtime execution: **PASS**.
- Evidence:
  - project: `a0000003-0000-4000-8000-000000000001`
  - document: `075ced46-b334-4a6e-bcf5-25b2e67dcf5e`
  - final status: `rejected`
  - approval history includes:
    - `document_upload`
    - `document_submit_for_review`
    - `document_review` (`to=rejected`)

### Step C — Flow `create -> upload -> under_review -> request_changes -> resubmit -> approve`

- Runtime execution (manager path): **PASS**.
- Evidence (manager-authenticated actor):
  - project: `a0000003-0000-4000-8000-000000000001`
  - document: `e16fa50f-c137-47c9-bfd0-0bc84f99ca3b`
  - transitions observed live:
    - `draft -> uploaded`
    - `uploaded -> under_review`
    - `under_review -> changes_requested`
    - `changes_requested -> under_review` (resubmit)
    - `under_review -> approved`
  - approval history includes expected governance audit trail with `document_review` on both `changes_requested` and `approved` decisions.

### Step D — Decision endpoint behavior

- `POST /api/v1/projects/{id}/documents/{documentId}/decision` is now present on staging.
- Current admin actor gets `403` (`Project owner access required`) by design.
- This is **not** a Phase 2 manager-loop blocker; it confirms owner-gated decision route behavior.

## Evidence anchors

- Upload recheck doc: `85887664-b968-46a4-bcef-bc6be0fa9bb8` (upload now `200`).
- Flow A doc: `e16fa50f-c137-47c9-bfd0-0bc84f99ca3b` (full `changes_requested -> resubmit -> approved` manager path PASS).
- Flow B doc: `198a4626-2ef2-4cde-9940-51a7808bf526` (full reject path PASS).
- Decision route permission probe doc: `64a9ee92-eba2-409c-9338-4afde6dc78b6` (`/decision` -> `403` for non-owner actor).

## Mitigations applied

- Repo code:
  - `apps/web/lib/domain/documents/document-upload-path.ts`
  - `apps/web/app/api/v1/projects/[id]/documents/[documentId]/upload/route.ts`
  - `apps/web/lib/domain/documents/document-upload-path.test.ts`
- DB migrations:
  - `apps/web/supabase/migrations/20260418123000_media_storage_owner_access.sql`
  - `apps/web/supabase/migrations/20260418123500_media_storage_project_prefix_access.sql`

## Runtime verdict (current deployment)

- **PASS (manager closure criteria)**: both required manager document loops are runtime-proven on staging.
