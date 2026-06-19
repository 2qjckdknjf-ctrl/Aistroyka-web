# LG-4X Public Site Release Audit

**Release gate:** Public website production readiness before LG-4.5 API phase  
**Auditor role:** Principal UX + SEO + Accessibility + Release  
**Verdict:** See scorecard below

## Global shell

| Surface | Status | Notes |
| --- | --- | --- |
| Header / desktop nav | ✅ | Platform → Features → Solutions primary order (PRE-LG45) |
| Mobile nav | ✅ | Main + More grouping; Cabinet CTA visible |
| Footer | ✅ | Resources include Construction AI, Mobile, API, Workflows |
| Metadata | ✅ | `buildPublicPageMetadata`: title, description, canonical, hreflang, OG, Twitter |
| JSON-LD (global) | ✅ | Organization, SoftwareApplication, WebSite in public layout |
| JSON-LD (per page) | ✅ | BreadcrumbList on all 19 in-scope routes (LG-4X) |
| Sitemap | ✅ | `apps/web/app/sitemap.ts` — all marketing paths + locale expansion |
| Robots | ✅ | `apps/web/app/robots.ts` — production crawl rules |
| i18n | ✅ | en / ru / es / it full-tree parity |

## Navigation stress test (step 9)

**Desktop:** Primary IA clear; product depth reachable within ≤2 clicks (Features, Platform, Solutions hubs).  
**Tablet:** Header collapses gracefully; no overlap observed in component structure.  
**Mobile:** Hamburger + sticky CTA pattern; footer provides secondary escape hatches.

**P3:** “More” dropdown packs Security, Integrations, API, Workflows, Enterprise, Implementation, FAQ, About, Contact — dense but scannable alphabetically by group; not a P1/P2 defect.

## Conversion map

```
Any public route
  ├─ PublicCTASection → /contact | /dashboard (pilot)
  ├─ PublicRelatedLinksSection → depth → /contact (where present)
  └─ Footer → /contact, /pricing, /implementation
```

No dead-end marketing pages identified in scope.

## Trust & claims posture

| Claim class | Public handling |
| --- | --- |
| Live AI / LLM | Mock demo labeled; Construction AI scoped to pilot; no “always live” marketing |
| Automation | Workflows page states partial automation; rules engine planned |
| SLA / certifications | Explicitly planned, not achieved |
| SSO | Enterprise evaluation / planned rollout |
| Full API platform | Early access / partial REST; developer sandbox planned |
| Model training | Security + enterprise copy: opt-in, deny by default |

## Release checklist

- [x] BreadcrumbList on all in-scope public pages
- [x] Truth copy pass (en + ru + es + it)
- [x] Mobile overflow guards
- [x] Accessibility heading / labelling improvements on shared components
- [x] i18n full-tree check
- [x] build + cf:build green
- [ ] Optional: manual visual QA at 320 / 375 / 390 / 430 / 768 (recommended pre-LG-4.5 deploy)

## Files touched (LG-4X delta summary)

**New**

- `apps/web/lib/seo/public-page-breadcrumb.ts`
- `apps/web/lib/seo/public-page-breadcrumb.test.ts`
- `apps/web/components/public/PublicJsonLd.tsx`
- `scripts/lg4x-add-breadcrumbs.mjs` (batch helper; not required at runtime)

**Modified**

- 19 public `page.tsx` routes (breadcrumb wiring)
- `apps/web/app/[locale]/(public)/layout.tsx`
- `apps/web/components/public/{PublicCTASection,PublicFeatureGrid,PublicPageHero,PublicRelatedLinksSection,index}.ts(x)`
- `apps/web/messages/{en,ru,es,it}.json`
- `apps/web/app/[locale]/(public)/partners/page.tsx` (full polish)

**Not committed** per operator instruction.
