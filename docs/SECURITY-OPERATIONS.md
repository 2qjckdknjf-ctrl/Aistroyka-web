# Security operations

## Secrets rotation checklist

- **Supabase:** Rotate anon key and service_role in project settings; update env (Cloudflare Secrets, .env); redeploy. Re-auth users if session invalidated.
- **Stripe:** Rotate API keys in Dashboard; update STRIPE_SECRET_KEY and webhook signing secret; redeploy. Re-trigger webhook test.
- **OpenAI:** New API key in platform; update OPENAI_API_KEY; redeploy.
- **APNs/FCM:** Replace key/cert; update env; redeploy push processor.

## Debug endpoint allowlist

- Debug routes require DEBUG_* env and ALLOW_DEBUG_HOSTS (comma-separated hosts). In production set ALLOW_DEBUG_HOSTS empty or omit to disable. No debug in production by default.

## Signed admin actions (optional)

- Re-auth for exports and billing changes: document that sensitive actions may require recent re-authentication (e.g. step-up auth). Scaffold only; implement when required.

## Security events stream

- Suspicious actions (e.g. login failures spike, export from new IP) can be written to a security_events table or audit_logs with type security. Consumed by anomaly detectors and playbooks.
