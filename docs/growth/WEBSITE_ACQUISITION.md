# Website acquisition (Growth OS + public SEO)

Operational notes for the **public marketing site** funnel shipped in PRs #268–#271 and the SEO foundation that followed. This is **not** the in-app product-analytics plan (`docs/growth/PRODUCT_ANALYTICS_PLAN.md`) — those `login_success` / `task_assigned` events are still a design, not an emitter.

Do not treat a successful page view as proof that Growth OS ingested the event.

## Intent

1. Record first-touch UTM on public pages and persist it with contact/pilot leads.
2. Beacon anonymous website funnel events to Growth OS when configured.
3. Keep locale URLs self-canonical, sitemap = URL inventory only, and CSP allow the ingest host.

## Architecture

```
Public layout
  ├─ PublicFunnelBeacon        path → landing_page.viewed | solution.viewed | pricing.viewed
  ├─ Pilot / contact forms     contact_lead.started → POST /api/contact → contact_lead.submitted
  └─ generateMetadata          canonical + hreflang + Open Graph

Browser
  ├─ sessionStorage aistroyka_first_touch_attribution
  ├─ localStorage   aistroyka_growth_anon
  └─ sessionStorage aistroyka_growth_session + view-event ids

Server
  ├─ POST /api/contact  and  POST /api/v1/contact
  ├─ insertContactLead  → public.contact_leads (attribution columns, with fallback)
  ├─ /sitemap.xml       PUBLIC_SITEMAP_PATHS × locales
  └─ /robots.txt        disallow /api /dashboard /admin /login /register /owner
```

Code: `apps/web/lib/growth/*`, `apps/web/lib/public/lead-attribution.ts`, `apps/web/lib/public/contact-lead-submit.ts`, `apps/web/lib/public/post-public-contact-lead.ts`, `apps/web/lib/seo/*`, `apps/web/components/public/PublicFunnelBeacon.tsx`.

## Growth OS events

Client helper `trackGrowthEvent` (`apps/web/lib/growth/track-event.ts`):

- **No-op** when `NEXT_PUBLIC_GROWTH_OS_EVENTS_URL` is unset or the call is not in a browser. Marketing pages must still work.
- Transport failures are swallowed.
- Payload: `productSlug: "aistroyka"`, `surface: "website"`, `environment: "production"`, `anonymousId`, `session_id`, `event_id`, `event_version: 1`, `name`, `occurredAt`, sanitized `properties`.
- Allowed property keys only: `page`, `placement`, `locale`, `campaign`, `utm_*`, `referrer`, `path`. Strings clipped to 200 chars; values containing `@` or control characters are dropped.

| Event | When | Dedup |
|-------|------|--------|
| `landing_page.viewed` | `/` or `/{en\|ru\|es\|it}` | Same name+page per browser session |
| `solution.viewed` | path contains `/solutions` | Same |
| `pricing.viewed` | path contains `/pricing` | Same |
| `contact_lead.started` | first focus/open of contact or pilot form | Same (in `VIEW_EVENTS`) |
| `contact_lead.submitted` | successful `POST /api/contact` | New id each call |
| `cta.clicked` | V4.1 pilot CTA (`V41PilotButton`) | New id each call |

`funnelEventForPath` does **not** emit `contact_lead.started` — forms do.

## First-touch attribution

`readAttributionFromBrowser` reads `utm_source|medium|campaign|content|term` from the current URL, stores the **first** non-empty values in `sessionStorage` (`aistroyka_first_touch_attribution`), and refreshes `locale` from the current page.

Sanitizer (`sanitizeLeadAttribution`):

- UTM fields max 200; `landing_page` / `referrer` max 2000.
- Rejects control characters and `javascript:` / `data:` / `vbscript:` URLs.

`insertContactLead` writes those columns on `contact_leads`. If PostgREST reports a missing attribution column (`PGRST204` / schema-cache “does not exist”), it retries the insert **without** UTM fields so older DBs still accept the lead. Migration: `20260829150000_contact_leads_attribution.sql`.

Public forms must keep using `/api/contact` (or `/api/v1/contact`) — both share the same Zod body and persist helper.

## SEO / canonical

| Rule | Implementation |
|------|----------------|
| Self-referencing canonical | `publicCanonicalUrl` — origin + locale path, no query/hash, no trailing slash except `/`. |
| hreflang | `publicLocaleAlternates` on every public page (`en`/`ru`/`es`/`it` + `x-default` → default locale). HTTP Link from next-intl is the other hreflang channel; **sitemap does not duplicate hreflang**. |
| Sitemap | `buildPublicSitemapEntries` — URL inventory only. No `changefreq` / `priority` / `lastmod`. Paths: `apps/web/lib/seo/public-paths.ts` (`PUBLIC_SITEMAP_PATHS`). Thin stubs stay in `PUBLIC_PATHS_EXCLUDED_FROM_SITEMAP`. |
| Open Graph | `publicOpenGraph` — `url` = that page’s canonical. Shared image `/brand/social/aistroyka-og.png` (1200×630). Next.js **replaces** nested `openGraph` objects; page-level OG must re-include image/url if it overrides. |
| robots | Allow `/`; disallow `/api/`, `/dashboard`, `/admin`, `/login`, `/register`, `/owner` (+ `/{locale}/owner`). Sitemap URL = `{NEXT_PUBLIC_APP_URL}/sitemap.xml`. |
| IndexNow | Static key file under `apps/web/public/<sha256>.txt` (PR #271) for Growth OS search ping. |

`.com` hosts are redirect-only (301 to `aistroyka.ai`). Do not treat `.com` as an independent canonical origin.

## CSP / env

`apps/web/lib/security-headers.ts` `connect-src` allowlists `https://growth-os-sable-psi.vercel.app` (PR #270). If `NEXT_PUBLIC_GROWTH_OS_EVENTS_URL` points at a **different** origin, the browser will block the beacon until that origin is added to the same `connect-src` list (and the matching `.js` copy if CI still dual-builds it).

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_GROWTH_OS_EVENTS_URL` | Optional. Inlined at **build** time (OpenNext). Empty → no events. |
| `NEXT_PUBLIC_APP_URL` | Canonical origin for sitemap, robots, metadata. |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for `getAdminClient()` on contact persist; missing admin client → HTTP 500 `"Something went wrong"`. |

## Pitfalls

| Symptom | Likely cause |
|---------|----------------|
| No Growth OS events | Env unset at `cf:build`, or CSP host mismatch, or private-mode storage throw (helper no-ops). |
| Duplicate view events across tabs | Dedup is **per sessionStorage tab/session**, not global. |
| Lead missing UTM | User landed without query params; first-touch store is session-scoped; or attribution migration not applied (row still saved via fallback). |
| Contact 500 | No service-role admin client, or persist error after fallback. |
| Sitemap lists a stub page | Path was added to `PUBLIC_SITEMAP_PATHS` instead of the excluded list. |
| Wrong OG image after a page override | Nested `openGraph` replaced the layout object — re-spread `publicOpenGraph`. |
| Google/Bing ignore sitemap priority | Expected. Do not add fake `priority` / `changefreq`. |

## Tests

- `apps/web/lib/growth/track-event.test.ts`, `funnel-events.test.ts`
- `apps/web/lib/public/lead-attribution.test.ts`, `contact-lead-submit.test.ts`, `post-public-contact-lead.test.ts`
- `apps/web/lib/seo/public-canonical.test.ts`
- `apps/web/app/api/v1/contact/route.test.ts`

## Related

- Product (in-app) event design — still unimplemented: `docs/growth/PRODUCT_ANALYTICS_PLAN.md`
- Public list prices: `apps/web/lib/public/pricing-catalog.ts` (live Stripe catalog only)
- Security headers smoke: `docs/ops/SECURITY_HEADERS_LIVE_SMOKE.md`
