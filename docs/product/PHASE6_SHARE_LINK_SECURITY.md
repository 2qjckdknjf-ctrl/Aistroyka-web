# Phase 6 — Proof Pack share link security

## Threat model

- Attacker guesses or steals a `token` (UUID-like string without hyphens in storage).
- Attacker calls public `/api/v1/share/proof/:token` or the SSR page that wraps it.
- Goal: obtain **tenant data**, **other projects**, or **internal financial** fields.

## Controls

1. **Opaque token** — `createProofPackShare` stores `crypto.randomUUID()` with hyphens stripped; guessing is infeasible.
2. **Row-level controls on share rows** — `proof_pack_shares` has RLS for internal tenants only. Unauthenticated Supabase clients (`anon`) do **not** receive share rows or underlying project/media/document tables.
3. **Server-only resolution** — `GET /api/v1/share/proof/:token` uses `getAdminClient()` (service role) **only inside the API route** after the request hits our app. The key never ships to the browser.
4. **DTO-only response** — `getProofPackByToken` → `buildProjectProofPack(..., { audience: "public" })` returns a fixed JSON shape. No `object_path`, raw storage paths, internal margin fields, or cost items.
5. **Revocation** — `revoked_at` set on DELETE; expired shares checked against `expires_at`.
6. **Scoped updates** — Revoke updates match `tenant_id`, `project_id`, and `token` so a manager cannot revoke another tenant’s row by token alone (token is unique globally but UPDATE is still tenant-scoped for defense in depth).

## Operational requirements

- **Production:** `SUPABASE_SERVICE_ROLE_KEY` must be set for public proof links to work (`503` otherwise). This matches other server jobs that depend on service role.
- **Monitoring:** Track `503` on share route — often missing service role in a new environment.

## Residual risks

- **Service role compromise** — If the service role key leaks, an attacker bypasses RLS for all data. Mitigation: standard secret hygiene, no `NEXT_PUBLIC_*`, rotate keys on incident.
- **Media URLs** — `file_url` in the pack may be publicly fetchable if storage is public; that is intentional for “proof” viewing. Restrict storage or use signed URLs in a future hardening pass if required.
- **Token forwarding** — Anyone with the link sees customer-safe pack contents; treat the URL like a secret capability URL.

## Anon key on this route (explicit non-use)

Earlier versions that used the anon key **could not** pass RLS for `proof_pack_shares` and project data; public sharing would fail or return empty errors. The service role path is required for correct behavior while keeping RLS strict for direct DB clients.
