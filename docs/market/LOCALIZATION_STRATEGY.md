# Product Localization Strategy

**Phase 10 — Market Expansion & Revenue Scaling**  
**UI language roadmap and i18n architecture.**

---

## UI language roadmap

| Phase | Locales | Focus |
|-------|---------|--------|
| **Current** | ru (default), en, es, it | Home market + EU/IT/ES readiness. |
| **Phase 2** | + de, fr | EU (DACH, France). |
| **Phase 3** | + pt (pt-BR) | LATAM (Brazil). |
| **Phase 4** | + pl, tr (optional) | EU expansion, Turkey. |

**Priority:** Add locales when entering a new region (see MARKET_EXPANSION_STRATEGY). No domain logic change; only UI strings and formatting.

---

## i18n architecture

- **Current:** next-intl; `routing.locales`: ru, en, es, it; defaultLocale: ru; localePrefix: always. Messages in `messages/{locale}.json`. Path structure: `/[locale]/...`.
- **Principles:**  
  - All user-facing strings in message files; no hardcoded copy in components.  
  - Route and API contract stay locale-agnostic; locale is presentation only.  
  - Server and client use same locale from URL/headers/cookie (next-intl).
- **New locale:** Add code to `routing.locales` and `defaultLocale` (if changing); add `messages/{locale}.json`; run translation workflow; test critical flows.
- **RTL:** Not in current scope; document if required for future markets.

---

## Locale-aware formatting

- **Dates:** Format via next-intl or Intl.DateTimeFormat with user locale (e.g. DD.MM.YYYY vs MM/DD/YYYY). Use same locale as UI.
- **Numbers:** Decimal and thousand separators by locale (Intl.NumberFormat). Currency in REGIONAL_PRICING.
- **Time zones:** Store UTC in backend; display in user or tenant time zone when available. Document tenant timezone setting if added.
- **Units:** Metric vs imperial (e.g. for future dimensions); default by region or tenant setting.

---

## Translation workflow

1. **Extract:** Export keys from message files (e.g. next-intl extract or script); produce source (e.g. en) JSON for translators.
2. **Translate:** Send to translation vendor or in-house; return locale JSON. No code in translation files.
3. **Review:** Native speaker or PM review for product and legal accuracy.
4. **Import:** Replace or merge `messages/{locale}.json`; commit with locale tag in message.
5. **QA:** Smoke test sign-in, dashboard, report submit, and key screens in each locale; check overflow and layout.
6. **Legal:** Terms, privacy, and consent must be localized where required (see legal/regulatory).

**Tools:** Optional TMS or CSV round-trip; keep format compatible with next-intl.

---

## Legal/regulatory adaptation

- **Terms of Service and Privacy Policy:** Localized versions per jurisdiction (e.g. RU, EU, US). Legal review before go-live in that region.
- **Consent and cookies:** EU cookie consent and GDPR; CCPA if serving California. Reuse platform; only copy and config (banner, links) change.
- **Data residency:** Document where data is stored (e.g. EU region for EU customers) and state in contract; platform already supports single-region deployment.
- **Invoicing and tax:** Per REGIONAL_PRICING and REVENUE_OPERATIONS; local VAT and invoicing rules by country.
- **Industry rules:** Construction-specific rules (e.g. certifications, safety) are industry-pack content and training, not code change.
