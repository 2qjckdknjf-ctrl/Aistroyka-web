# LIVE Documents & Costs Verification (2026-05-01)

## Scope

- Verify live document/cost routes under authenticated tenant context.
- Production checks should be read-only unless explicitly safe.

## Endpoints under verification

- Documents:
  - `GET /api/v1/projects/:id/documents`
  - `POST /api/v1/projects/:id/documents`
- Costs:
  - `GET /api/v1/projects/:id/costs`
  - `POST /api/v1/projects/:id/costs`
  - `GET /api/v1/projects/:id/costs/:costItemId`

## Executed checks (no auth token/session available)

1. `GET https://aistroyka.ai/api/v1/projects/test-project/documents`
   - HTTP `401`
   - Body: `{"error":"Authentication required"}`

2. `GET https://aistroyka.ai/api/v1/projects/test-project/costs`
   - HTTP `401`
   - Body: `{"error":"Authentication required"}`

3. `GET https://aistroyka.ai/api/v1/projects/test-project/costs/test-cost`
   - HTTP `401`
   - Body: `{"error":"Authentication required"}`

## Findings

- Routes are protected from anonymous access (expected).
- Authenticated live verification (list/create/update/budget summary/signals) cannot be completed without tenant user credentials.

## Blockers

- Missing authenticated tenant context:
  - no valid `Authorization: Bearer <user_jwt>` in this session,
  - no session cookie for tenant manager.

## Exact operator checks (read-only first, then safe mutations in staging)

Read-only:

```bash
export BASE_URL="https://aistroyka.ai"
export AUTH_HEADER="Bearer <tenant_manager_user_jwt>"
export PROJECT_ID="<existing_project_id>"

curl -i "$BASE_URL/api/v1/projects/$PROJECT_ID/documents" -H "Authorization: $AUTH_HEADER"
curl -i "$BASE_URL/api/v1/projects/$PROJECT_ID/costs" -H "Authorization: $AUTH_HEADER"
```

Safe mutation (prefer staging):

```bash
export BASE_URL="<staging_base_url>"
export AUTH_HEADER="Bearer <tenant_manager_user_jwt>"
export PROJECT_ID="<staging_project_id>"

curl -i -X POST "$BASE_URL/api/v1/projects/$PROJECT_ID/documents" \
  -H "Authorization: $AUTH_HEADER" -H "Content-Type: application/json" \
  --data '{"type":"document","title":"live-verification-doc"}'

curl -i -X POST "$BASE_URL/api/v1/projects/$PROJECT_ID/costs" \
  -H "Authorization: $AUTH_HEADER" -H "Content-Type: application/json" \
  --data '{"title":"live-verification-cost","category":"other","planned_amount":1000}'
```

## Verdict

- Documents live verification: **BLOCKED**
- Costs live verification: **BLOCKED**
