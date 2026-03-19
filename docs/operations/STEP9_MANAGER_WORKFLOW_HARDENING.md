# Step 9 — Manager workflow hardening

## Implemented

1. **`operational` block** on `GET /api/v1/projects/:id/intelligence` — built by `buildManagerOperationalContext()` (server-only, grounded in existing API fields).
2. **`IntelligenceOperationalBanner`** — trust band, state label, disclaimers, “Why you’re seeing this”, numbered next steps, truncated request ref.
3. **Error UX** — 401 / 403 / 503 specific copy + “Reference for admin” from `X-Request-Id`.
4. **Empty copy** — executive summary / evidence / reporting empty states clarify “add data” vs silence.

## Non-goals

- No new marketing visuals.
- No exposure of internal diagnostics JSON to managers.
- Full request_id shown truncated (8 chars + …); full ID remains in response header for support.
