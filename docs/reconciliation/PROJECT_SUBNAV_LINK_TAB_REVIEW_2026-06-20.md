# Project Subnav Link / Tab Review — 2026-06-20

| Item | Route | Maps to existing section | Status |
|---|---|---|---|
| Overview | `/dashboard/projects/[id]` | default `workers`/overview state with project summary | PASS |
| Reports | `/dashboard/projects/[id]?tab=reports` | `activeTab === "reports"` | PASS |
| Documents | `/dashboard/projects/[id]?tab=documents` | `activeTab === "documents"` | PASS |
| Timeline | `/dashboard/projects/[id]?tab=schedule` | `activeTab === "schedule"` | PASS |
| Approvals | `/dashboard/projects/[id]?tab=decisions` | `activeTab === "decisions"` | PASS |

## Checks
- No dead links: YES, all links target existing project detail query-tab behavior.
- No tab typos: YES.
- Active state works: YES after fix.
- Existing project detail rendering not broken: YES by validation.
- Invalid tab behavior remains safe: YES; unknown tabs fall back to default state.
- Browser/query behavior safe: YES; links use current query-tab model.

## Fix
- Overview no longer appears active for hidden/internal tabs like `costs` or `ai`.
