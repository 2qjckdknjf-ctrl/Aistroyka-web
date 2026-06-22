# Export / Report Go / No-Go — 2026-06-20

## Decision
- Is export/report implementation safe to start? YES, but only the minimal read-only manager/admin report CSV slice.
- Exact smallest slice: `GET /api/v1/reports/export`
- Safe to port outside-main code directly? NO.
- Implementation method: reimplement from plan/tests, using outside-main branches as reference only.

## Customer / Stakeholder CSV
- Is customer finance CSV safe now? NO.
- Is stakeholder export safe now? NO.
- Reason: customer/stakeholder-safe field model and CSV filtering are not fully specified for finance/commercial data.

## Report Review Side Effects
- Are report review side effects understood? PARTIAL.
- Current main behavior is understood: report review update + audit.
- Outside-main extra behavior requires review: approval event, sync change, notification.
- Decision: do not include side effects in first slice.

## Tests
- Are required tests defined? YES.
- Must be written before implementation.

## Blocks
- Project export blocked by field/finance review.
- Customer/stakeholder exports blocked by finance isolation review.
- Report review side effects blocked by side-effect semantics and duplicate/failure behavior.
- AI routes blocked by migrations/RLS.

## Next Exact Implementation Prompt
Implement only `GET /api/v1/reports/export` as a read-only manager/admin CSV export. First add route/service tests proving anonymous, worker, stakeholder/customer, wrong-tenant, and wrong-project access is blocked; manager/admin access is tenant/project scoped; CSV contains only the approved safe columns and excludes finance/note/media URL fields. Do not add frontend/mobile UI, project export, review side effects, migrations, AI routes, middleware changes, or customer/stakeholder exports. Validate with lint, focused tests, full tests, build, and cf:build.
