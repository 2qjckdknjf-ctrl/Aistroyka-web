# Wave 4 Step 10 — Validation report (Stage H)

## Tests

- **Unit:** `lib/domain/stakeholder-discussions/stakeholder-discussions.service.test.ts`  
  - `resolveDiscussion` rejects empty summary.  
  - Stakeholder cannot use `resolution_note`.  
  - Participant path calls `updateDiscussionStatusAsPortal` (RPC) with `awaiting_manager` (not direct `updateDiscussion`).
- **Domain / timeline:** `stakeholder-activity-timeline.repository.test.ts` (existing suite includes timeline behavior).
- **Full suite:** `apps/web` — `npm test` (Vitest): **199 files, 1182 tests passed** (as of last run in this step).

## Build

- Repository root: `npm run build` — **succeeded** (Next.js production build for `apps/web`).

## Focused checks

- Typecheck and bundle included in production build.
- **Migrations:** must be applied in Supabase for `project_stakeholder_discussions`, entries table, and `stakeholder_discussion_portal_set_status` RPC before production use.

## Gaps (non-blocking for build)

- No dedicated `route.test.ts` for `/api/v1/projects/.../stakeholder-discussions/*` HTTP handlers (service/policy coverage is primary).
