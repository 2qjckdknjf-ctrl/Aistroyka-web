# Wave 4 Step 5 — Customer-facing UI (Stage F)

## F1 — Surfaces

| Surface | Path / component |
|---------|------------------|
| Client view page | `/[locale]/dashboard/projects/[id]/client` — `client/page.tsx` + `ClientPortalViewClient.tsx` |
| Manager portal card | `ClientPortalManagerCard.tsx` on project detail |
| Project detail integration | `DashboardProjectDetailClient.tsx` — link for owners, manager card when allowed |

## F2 — UX principles

- Simple cards: tasks progress, optional budget, action needed, milestones, documents.
- No internal jargon in labels (plain English in component copy; **note**: strings are not fully i18n-keyed in `ClientPortalViewClient` — see validation report).

## F3 — Manager vs customer separation

- **Client** route is a dedicated read-focused layout; it does not embed manager tabs or worker tools.

## Limitations

- Document list is **metadata only** (no download button on this page — by design for safe exposure).
- Error state explains lock / portal off / access.
