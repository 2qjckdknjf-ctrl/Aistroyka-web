# Frontend API Wiring Audit — 2026-06-20

| UI surface | API called | Canonical/legacy | Backend exists current | Auth/role requirement | Likely works | Blocker | Fix recommendation |
|---|---|---|---|---|---|---|---|
| Projects list | `/api/v1/projects` | canonical | YES | tenant auth | YES | data/auth | none |
| Project detail | `/api/v1/projects/[id]` and project sub APIs | canonical | YES | tenant/project | YES/PARTIAL | data/auth | route-specific smoke later |
| Reports list | `/api/v1/reports` | canonical | YES | tenant auth | YES | data/auth | none |
| Report detail/review | `/api/v1/reports/[id]` | canonical | YES | tenant/reviewer | YES | data/auth | none |
| Reports export UI | none found | n/a | backend YES | owner/admin | NO UI | missing button/wiring | candidate future slice |
| Documents | `/api/v1/projects/[id]/documents*` | canonical | YES | tenant/project | YES/PARTIAL | project data | none |
| Costs/budget | `/api/v1/projects/[id]/costs*` | canonical | YES | internal tenant/project | YES/PARTIAL | must stay internal | no customer wiring |
| Milestones/schedule | `/api/v1/projects/[id]/milestones*`, timeline | canonical | YES | tenant/project | YES/PARTIAL | project data | none |
| Approvals | report/document approval APIs | canonical | YES | tenant/project | YES/PARTIAL | data/auth | none |
| Owner/customer portal | `/api/v1/portal/*`, client project routes | canonical | YES | stakeholder/customer/project | PARTIAL | role/data | audit with real fixture |
| AI/Copilot | `/api/v1/projects/[id]/copilot*`, AI endpoints | canonical | YES/PARTIAL | tenant/project/env | PARTIAL | AI env/fallbacks | defer Flywheel UI |
| Activation/help widgets | `/api/activation/status` | legacy | YES via redirect/compat | auth/tenant optional | YES/PARTIAL | legacy canonicalization | migrate later, not urgent |
| Auth login | `/api/auth/login` | intentional legacy exception | YES | auth | YES | none | keep |

## Legacy API Risks
- `/api/activation/status` is still used by onboarding/help components.
- `/api/auth/*` remains intentional non-v1 auth surface.
- Do not canonicalize legacy routes blindly; existing users/components still call them.

## Broken / Missing API Calls
- No broken API call was proven in static audit.
- New reports export API has no UI caller.

## Special Check
- Components still calling `/api/activation/status`: YES.
- Components using legacy `/api/*` where `/api/v1/*` is canonical: activation/status and auth exceptions primarily.
