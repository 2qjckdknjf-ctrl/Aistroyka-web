# LIVE Documents & Costs Verification (2026-05-01)

## Scope

- Verify live documents/costs routes under authenticated tenant user.
- Keep production checks read-only.
- Prefer staging for safe mutation checks.

## Endpoints targeted

- Documents:
  - `GET /api/v1/projects/:id/documents` (list)
  - `POST /api/v1/projects/:id/documents` (create/register)
  - optional follow-up in staging:
    - `POST /api/v1/projects/:id/documents/:documentId/upload`
    - `POST /api/v1/projects/:id/documents/:documentId/decision`
- Costs:
  - `GET /api/v1/projects/:id/costs` (list + summary + signals in payload)
  - `GET /api/v1/projects/:id/costs/:costItemId`
  - `POST /api/v1/projects/:id/costs` (create in staging only)

## Executed live checks (anonymous protection baseline)

Using project id `a0000003-0000-4000-8000-000000000001`:

Production (`https://aistroyka.ai`):
- `GET /documents` -> HTTP `401`, `{"error":"Authentication required"}`
- `POST /documents` -> HTTP `401`, `{"error":"Authentication required"}`
- `GET /costs` -> HTTP `401`, `{"error":"Authentication required"}`
- `GET /costs/:costItemId` -> HTTP `401`, `{"error":"Authentication required"}`

Staging (`https://staging.aistroyka.ai`):
- `GET /documents` -> HTTP `401`, `{"error":"Authentication required"}`
- `POST /documents` -> HTTP `401`, `{"error":"Authentication required"}`
- `GET /costs` -> HTTP `401`, `{"error":"Authentication required"}`
- `GET /costs/:costItemId` -> HTTP `401`, `{"error":"Authentication required"}`

## Findings

- Runtime auth protection is active for documents/costs routes on both staging and production.
- Authenticated positive-path checks are blocked; therefore list payload shape, create flow, upload/finalize, transitions, budget summary and cost signals were not verified live.

## External blockers

- Missing tenant-auth credentials in this session:
  - `AUTH_HEADER="Bearer <tenant_user_jwt>"` or
  - `COOKIE="<tenant_session_cookie>"`
- Missing explicitly approved staging project/user context for mutation steps.

## Operator commands to close blocker

Read-only (production + staging):

```bash
export PROJECT_ID="<existing_project_id>"
export AUTH_HEADER="Bearer <tenant_manager_user_jwt>"

curl -i "https://aistroyka.ai/api/v1/projects/$PROJECT_ID/documents" -H "Authorization: $AUTH_HEADER"
curl -i "https://aistroyka.ai/api/v1/projects/$PROJECT_ID/costs" -H "Authorization: $AUTH_HEADER"

curl -i "https://staging.aistroyka.ai/api/v1/projects/$PROJECT_ID/documents" -H "Authorization: $AUTH_HEADER"
curl -i "https://staging.aistroyka.ai/api/v1/projects/$PROJECT_ID/costs" -H "Authorization: $AUTH_HEADER"
```

Safe mutation (staging only):

```bash
export BASE_URL="https://staging.aistroyka.ai"
export PROJECT_ID="<staging_project_id>"
export AUTH_HEADER="Bearer <tenant_manager_user_jwt>"

curl -i -X POST "$BASE_URL/api/v1/projects/$PROJECT_ID/documents" \
  -H "Authorization: $AUTH_HEADER" \
  -H "Content-Type: application/json" \
  --data '{"type":"document","title":"live-verification-doc"}'

curl -i -X POST "$BASE_URL/api/v1/projects/$PROJECT_ID/costs" \
  -H "Authorization: $AUTH_HEADER" \
  -H "Content-Type: application/json" \
  --data '{"title":"live-verification-cost","category":"other","planned_amount":1000}'
```

## Verdict

- **Documents live: BLOCKED**
- **Costs live: BLOCKED**
