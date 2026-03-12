# CSP eval audit

## Context

- CSP warning observed: `eval` (or `new Function`) blocked.
- Treated as **secondary** to the dashboard 500; not assumed to be the primary cause unless proven.

## Current CSP (middleware)

- `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.supabase.co; connect-src 'self' https://*.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline';`
- No `unsafe-eval` in script-src; therefore `eval()` and `new Function()` are blocked by CSP.

## Likely sources of eval

1. **Next.js / React dev or runtime:** Some bundles or frameworks may use eval in dev or in specific code paths; production builds often avoid it.
2. **Supabase client:** Supabase JS can use dynamic code in some paths; typically allowed via script-src if loaded from same origin or Supabase CDN.
3. **Browser extensions:** Can trigger CSP violations that are not from the app; must be ignored when attributing app failures.
4. **Build/runtime:** OpenNext or Worker bootstrap could introduce eval; would need to be confirmed via Worker logs or disabling CSP temporarily in staging to see if dashboard still fails.

## Relation to dashboard 500

- Dashboard 500 was traced to **middleware** (`getUser()` unsafe destructuring) and addressed there and in layout/page auth.
- A CSP violation usually produces a **console warning** and blocked script execution, not a **500 Server Error**. Server Components render on the server, where CSP does not apply.
- **Conclusion:** CSP eval warning is not the proven root cause of the dashboard 500. It should be tracked separately (e.g. identify script and replace or relax only if necessary and justified).

## Recommendations

- Do not add `unsafe-eval` to fix the dashboard 500.
- In staging/dev, identify which resource/script triggers the eval violation (e.g. from browser console or Worker logs).
- If it is app or Supabase code, consider replacing or configuring the dependency to avoid eval; if it is a known third-party requirement, document and consider a minimal, scoped CSP change only after validation.
