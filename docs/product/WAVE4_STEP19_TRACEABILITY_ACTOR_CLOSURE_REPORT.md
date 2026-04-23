# Wave 4 Step 19 — Actor display closure (Stage A)

## A1 — Identity sources reviewed

- **Supabase Auth user records** (server-only): `user_metadata.full_name`, `user_metadata.name`, `email` (local-part usable as a fallback label).
- **No** dedicated `profiles` table in the migration chain; tenant-scoped membership tables do not carry display names.

## A2 — Strategy chosen (minimal, safe)

1. **Scope gate:** Only user IDs that appear in **`tenant_members`** (tenant), **`project_members`** (project + active), **`project_stakeholders`** (project, accepted user), or **`tenants.user_id`** (tenant owner) may be resolved. This blocks using the admin API as an arbitrary people lookup.
2. **Resolution:** For scoped IDs, **`getAdminClient()`** + `auth.admin.getUserById` applies `actorLabelFromAuthUser`: prefer trimmed `full_name` / `name` from metadata, else **email local-part** (never full email in the label string).
3. **Fallback:** If service role is not configured or resolution fails, **`actorLabel` stays null** and the UI keeps the short UUID prefix (unchanged behavior).

## A3 — Safety model

- Labels are **work-context oriented**, not a directory: intersection of trace actors with tenant/project membership (plus tenant owner).
- **No** extra PII is written to the database for this feature.
- **Length cap** (56 chars) on labels to avoid UI overflow.

## A4 — Limitations

- Stakeholders or workers **not** linked via the tables above will not get labels (UUID fallback).
- Production must set **`SUPABASE_SERVICE_ROLE_KEY`** for name/email-local resolution; without it, labels remain null by design.
