# AISTROYKA Release Hardening — Security Wave 5

Date: 2026-09-06
Logical dependency: Security Wave 4 / PR #287
Tracking: #282
Legacy finding reference: #220

## Scope

No product features. This wave closes the confirmed direct-PostgREST wipe/forge paths on photo annotations and comments while preserving read-only collaboration visibility for viewers.

## Confirmed current-main findings

Current `photo_annotations_internal` and `photo_comments_internal` are broad `FOR ALL` policies based on internal tenant reader access. Because that cohort includes `viewer`, direct Supabase REST can bypass the intended application write boundary.

Concrete impact before this wave:
- viewer can insert/update/delete annotations;
- viewer can insert/update/delete comments;
- comments can be rewritten despite being append-only in the API;
- direct REST can forge `author_user_id` on inserts;
- annotation updates can change identity fields the API never exposes;
- rows can reference a `media_id` that does not belong to the supplied tenant if not otherwise constrained.

## Application-layer fix

The three official write routes now require `canManageProjects(ctx)` (member+; viewer denied):
- `POST /api/v1/media/[mediaId]/annotations`
- `PATCH /api/v1/media/[mediaId]/annotations/[id]`
- `POST /api/v1/media/[mediaId]/comments`

Existing validation, annotation optimistic-concurrency (`If-Match`), and change-log emission are unchanged.

## RLS fix

Migration: `20260906115000_harden_photo_annotations_comments.sql`

### Annotations
- SELECT remains available to internal readers;
- INSERT requires writer cohort, `author_user_id = auth.uid()`, and media/tenant consistency;
- UPDATE requires writer cohort and media/tenant consistency;
- no authenticated DELETE policy;
- trigger prevents authenticated UPDATE from changing `tenant_id`, `media_id`, `author_user_id`, or `created_at`.

### Comments
- SELECT remains available to internal readers;
- INSERT requires writer cohort, `author_user_id = auth.uid()`, and media/tenant consistency;
- no authenticated UPDATE or DELETE policies: comments remain append-only.

### Media consistency

`media_belongs_to_tenant(media_id, tenant_id)` verifies that collaboration rows reference media owned by the same tenant and blocks cross-tenant media-ID skew.

## Regression coverage

- `lib/tenant/photo-collab-rls.hardening.test.ts`
- `lib/tenant/photo-collab-route-auth.contract.test.ts`

Coverage locks:
- viewer read-only / writer separation;
- route member+ write gates;
- author binding;
- media/tenant consistency;
- immutable annotation identity;
- append-only comments;
- absence of authenticated delete policies.

## Validation strategy

Wave 5 is stacked on the exact Wave 4 head that passed the combined validation PR #288 (`CI Check` success including lint, typecheck, all tests, release-readiness policy, and Cloudflare bundle).

Wave 5 remains a separate Draft PR. After it is opened, the validation-only branch is moved to the Wave 5 exact head so the full stack runs through the repository's main-based CI workflow. The validation PR is never a merge path.

## Required gates

- clean Wave 5-only diff against Wave 4;
- exact combined-stack CI green;
- no unresolved P0/P1 review findings;
- negative checks: viewer cannot POST/PATCH via API; viewer/direct REST cannot CUD comments or delete annotations; author/media identity cannot be forged;
- positive checks: member can create/update annotation and add comment; viewer can still read collaboration data;
- staging/prod policy-name and schema compatibility before migration apply;
- no production mutation in this PR.
