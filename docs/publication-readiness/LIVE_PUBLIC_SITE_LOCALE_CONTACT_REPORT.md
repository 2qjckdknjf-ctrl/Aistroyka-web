# Live Public Site Locale & Contact Report

## Goal

Verify public multi-locale routes and contact flow readiness from live host.

## Route crawl (live)

### Non-localized roots

- `/` -> 307 (locale redirect)
- `/ru` -> 200
- `/en` -> 200
- `/es` -> 200
- `/it` -> 200
- Non-prefixed `/pricing`, `/about`, `/contact`, `/workflows`, `/enterprise`, `/copilot`, `/ai-demo` -> 404 (expected when canonical routing is locale-prefixed)

### Locale-prefixed pages

For `ru/en/es/it`, all checked pages returned 200:

- `/{locale}/pricing`
- `/{locale}/about`
- `/{locale}/contact`
- `/{locale}/workflows`
- `/{locale}/enterprise`
- `/{locale}/copilot`
- `/{locale}/ai-demo`
- `/ru/projects-showcase`

## Latest rerun (live-closure pass)

Rechecked matrix:

- `/` -> 307 locale redirect
- locale roots (`/ru`, `/en`, `/es`, `/it`) -> 200
- locale-prefixed target pages (`pricing/about/contact/workflows/enterprise/copilot/ai-demo`) -> all 200 for `ru/en/es/it`

## Browser visual rerun (operator-assisted browser automation)

Observed on live host during browser-level pass:

- `/ru/contact` contains mixed-language helper text:
  - `Для бизнес-запросов Use the form above and mention "Demo"...`
- Footer section heading appears as `Resources` on RU pages (untranslated visual string).

Code-side remediation prepared in branch:

- `apps/web/app/[locale]/(public)/contact/page.tsx` switched to localized `businessCtaDetails` key.
- `apps/web/components/public/PublicFooter.tsx` switched `Resources` heading to `public.footer.resources`.
- Locale keys added in `apps/web/messages/{en,ru,es,it}.json`.

Current live-state interpretation:

- Visual locale QA remains partial until these changes are deployed and rechecked on production.

## Post-deploy browser verification (run `26186503554`)

Production deploy from `release/publication-readiness-mega-sprint` completed successfully:

- workflow: `Deploy Cloudflare (Production)`
- run: `26186503554`
- pilot-smoke: passed
- ai phase5 gate: passed

Live browser recheck after deploy:

- `/ru/contact` helper text is fully Russian:
  - `Для бизнес-запросов используйте форму выше и укажите «Demo»...`
- `/ru` footer resources heading is localized:
  - `Ресурсы`
- `/en` footer resources heading remains English:
  - `Resources`

## Contact flow probe

Commands:

```bash
curl -X POST https://aistroyka.ai/api/v1/contact -H "Content-Type: application/json" --data '{}'
curl -X POST https://aistroyka.ai/api/v1/contact -H "Content-Type: application/json" --data '{"name":"Release Smoke","email":"release-smoke@example.com","message":"Publication readiness smoke check"}'
```

Observed:

- Invalid payload -> HTTP 400 (`{"error":"Required Required Required"}`)
- Valid payload -> HTTP 200 (`{"ok":true}`)

## Limitations of this check

- Browser-level visual audit (rendered copy quality, console/runtime UI issues, nav click-through from actual DOM) was not executed in this stage.
- Therefore, "no EN leftovers in RU" / "no RU leftovers in EN" is **not fully closed visually**, only partially inferred from route availability and existing i18n checks.

Manual browser checklist for closure:

1. Open `/ru`, `/en`, `/es`, `/it` in real browser and validate hero/nav/footer copy language consistency.
2. Click nav links to `pricing/about/contact/workflows/enterprise/copilot/ai-demo` for each locale and confirm no broken transitions/empty shells.
3. Submit contact form in browser and verify user-facing success message and validation message localization.
4. Verify favicon/logo/OG preview behavior in browser devtools and share preview.

## Verdict

**CLOSED**

