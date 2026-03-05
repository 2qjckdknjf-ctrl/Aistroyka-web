# CSRF stance

- **Same-site cookies:** Session cookies use `SameSite=Lax` (or `Strict`) so cross-site requests do not send cookies. Supabase auth cookies follow this.
- **Risky actions:** State-changing operations (POST/PUT/DELETE) require a valid session (cookie). No custom CSRF token is required for same-origin form submissions or API calls from our web app when cookies are same-site.
- **If adding token-based CSRF later:** Use a double-submit cookie or header (e.g. `x-csrf-token`) for any endpoint that accepts form POST from a different origin. Currently all API consumers are same-origin or mobile (Bearer token); mobile does not rely on cookies for API auth.
