# Reports Export UI / UX Polish Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Current UI Placement

The export action lives in the Project Reports tab only, above the reports table or empty state.

Positive:

- placement is scoped and low-risk
- export is still available for empty reports state
- no top-level tenant-wide export button
- no customer/stakeholder copy

## Reports Tab UX

Current reports tab shows:

- export action for allowed users
- table of report id, worker id, status, created date
- pagination
- empty state if no reports
- loading skeleton while query is pending
- simple text error on query failure

## Empty State

Current behavior is good for owner/admin: export appears before the empty state, allowing header-only CSV.

Potential polish:

- clarify that empty CSV export is available even with no current reports
- consider small helper text near button only if it does not clutter the tab

## Loading State

Current behavior: loading returns only `Skeleton`, so export is not visible until the reports query finishes.

Potential polish:

- show export action above loading skeleton because export does not depend on current page data
- only if tests prove no duplicate rendering and role gate remains fail-closed

## Error State

Current behavior: error returns a text message and does not show export.

Potential polish:

- consider keeping export visible if reports list fails but project/role context is valid
- risky because it may confuse users when the tab cannot load
- defer unless UX need is proven

## Download Affordance

Current behavior: plain link styled as button.

Potential polish:

- add download icon or "CSV" suffix
- add browser-native `download` attribute only if it does not break authenticated API behavior
- add tooltip/helper text for project-scoped export

## Accessibility / ARIA

Current behavior:

- link has `aria-label={exportProjectReportsCsv}`
- visible text is localized `exportCsv`
- project subnav has aria label

Potential polish:

- add visible context text for screen readers if multiple export controls ever exist
- add focus-visible style parity if button/link styles change

## Responsive Concerns

Current button is in a right-aligned flex row. It should remain usable on narrow widths, but no dedicated mobile visual test exists for this control.

Potential polish:

- make export action full-width or wrap-friendly on very narrow screens
- preserve minimum touch target

## UX Verdict

UI polish risk: LOW/MEDIUM.

Low if limited to label/icon/layout polish. Medium if changing visibility during loading/error states or moving the control to broader surfaces.
