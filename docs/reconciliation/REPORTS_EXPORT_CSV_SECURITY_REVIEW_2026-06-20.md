# Reports Export CSV Security Review — 2026-06-20

## Allowed Columns
Verified fixed column list:
- `report_id`
- `project_id`
- `worker_user_id`
- `status`
- `created_at`
- `submitted_at`
- `reviewed_at`
- `media_count`
- `analysis_status`

## Forbidden Fields
Verified absent from CSV:
- costs
- budget
- margin
- profitability
- subcontractor cost
- notes
- comments
- media URLs
- signed URLs
- raw AI output
- emails
- phone numbers
- names

## CSV Escaping
`escapeCsvValue` handles:
- commas
- quotes
- newlines
- carriage returns

## Formula Injection
String values starting with these prefixes are escaped with a leading apostrophe:
- `=`
- `+`
- `-`
- `@`

## Empty Export
- Empty export returns header-only CSV with CRLF terminator.

## Headers
- `Content-Type`: `text/csv; charset=utf-8`
- `Content-Disposition`: `attachment; filename="reports-export.csv"`
- `Cache-Control`: `private, no-store`

## Test Coverage
- Safe columns only.
- Forbidden fields absent.
- CSV quote/comma/newline escaping.
- Formula injection prefixes.
- Empty export.
- Route headers.

## Fix Needed
- NO additional CSV fix needed.
