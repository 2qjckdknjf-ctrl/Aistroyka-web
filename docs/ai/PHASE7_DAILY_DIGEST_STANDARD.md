# Phase 7 — Daily digest standard

## Purpose

Daily digest surfaces **prioritized, actionable lines** derived from live project signals. Two audiences are mandatory:

- **`manager`** — may reference internal operational and budget pressure wording (within the manager dashboard only).
- **`owner`** — customer-safe: only information already derivable from the client portal projection (`ClientProjectView`).

## Payload shape

See `apps/web/lib/domain/digest/daily-digest.types.ts`:

- `DailyDigestPayload` — `{ audience, generated_at, project_id?, project_name?, lines }`
- `DailyDigestLine` — `{ id, severity: "info"|"warning"|"critical", text, href? }`

## Construction rules

1. **Sorting** — lines sorted by severity (`critical` → `warning` → `info`) via `sortDigestLines`.
2. **Manager lines** — built from `ProjectSummary` (`buildManagerDigestLinesFromSummary`). May include internal budget / planned ceiling language and deep links to costs/schedule tabs.
3. **Owner lines** — built only from `ClientProjectView` (`buildOwnerDigestLinesFromClientView`). Must not introduce internal finance vocabulary (see security audit doc).
4. **No LLM in v1** — deterministic rules from DB-backed summaries; optional future “AI narrative” layer must not bypass audience separation.

## API surface

- `GET /api/v1/dashboard/daily-digest` — portfolio manager digest.
- `GET /api/v1/projects/:id/daily-digest?audience=manager|owner` — per project.

## Persistence

Roadmap optional table `project_daily_digests` is **not** required for v1; digests are computed on read. Add persistence when caching, history, or async generation is needed.
