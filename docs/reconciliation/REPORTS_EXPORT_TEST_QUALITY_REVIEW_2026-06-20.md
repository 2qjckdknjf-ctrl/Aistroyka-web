# Reports Export Test Quality Review — 2026-06-20

## Review
The initial tests covered anonymous, lite worker, stakeholder, project scope, manager/admin success, and CSV safety. The review found a gap: worker blocking depended too much on client-profile handling and did not prove that an authenticated non-lite `member` role was blocked.

## Strengthening Added
- Added route test for a web `member` role with `canReviewReport` returning true.
- Added query validation tests for invalid `status`, invalid `from`, and invalid `range_days`.
- Cleared mocks in `beforeEach` to prevent stale calls from hiding route behavior.

## Required Proof
- anonymous blocked: YES.
- worker role blocked: YES, including non-lite `member`.
- owner/customer blocked: stakeholder/customer-style role blocked; tenant owner remains allowed as internal admin.
- stakeholder blocked: YES.
- manager/admin allowed: YES.
- wrong tenant blocked: covered by tenant-scoped service design and route tenant context mocks; no service-role bypass.
- wrong project blocked: YES via `getProject` failure.
- forbidden fields excluded: YES.
- CSV formula injection escaped: YES.
- no media URLs: YES.
- no notes: YES.
- no finance fields: YES.
- empty export safe: YES.

## Mock Limitations
- Route tests mock tenant context and Supabase helpers, consistent with existing route test style.
- Full end-to-end auth against live Supabase is not part of this slice.

## Verdict
- Tests are strong enough for this isolated backend slice after hardening.
