# PR 109 Runtime Blocker — 2026-06-20

## Preview URL
- Vercel: `https://aistroyka-web-web-v7jq-git-int-8335ee-2qjckdknjf-ctrls-projects.vercel.app`
- Cloudflare branch preview: `https://integration-aistroyka-full-reconc-2944-aistroyka-web-production.z6pxn548dk.workers.dev`

## Blocker Type
- Vercel preview: protected by Vercel authentication.
- Cloudflare preview: protected by Cloudflare Access.

## Missing Access
- Vercel-authenticated browser/session for the preview.
- Cloudflare Access-authenticated browser/session for the Workers branch preview.
- Or another accessible staging URL not behind platform auth.

## Evidence Already Available
- PR checks are green.
- Local validation is green.
- Prior local API runtime export verification passed for owner path.
- Unauthenticated preview requests prove platform auth blockers, not app runtime failures.

## Evidence Still Missing
- Authenticated browser dashboard load.
- Project detail UI verification.
- Project subnav UI verification.
- Reports tab/export UI click verification.
- Runtime role visibility for non-owner roles.

## Exact Next Human/Operator Action
Open the Vercel or Cloudflare preview in a browser with platform access, authenticate through the platform layer, then run owner/admin dashboard verification and role visibility checks.
