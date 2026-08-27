# AISTROYKA Supply Market Search — Canonical Product Memory

**Status:** Canonical companion specification to `AISTROYKA_SUPPLY_LOGISTICS_AGENT_CANONICAL.md`
**Date:** 2026-08-27

## Product requirement

AISTROYKA Procurement & Logistics must not depend only on suppliers with direct API/ERP/WMS connections. It must also have a **Market Search Engine** capable of searching major construction-material retailers, merchants and e-commerce catalogs relevant to the project country/region.

For Spain, initial target market coverage should include major construction/home-improvement and professional-material retailers such as BAUHAUS España, Leroy Merlin España, OBRAMAT, BigMat and additional relevant regional/professional suppliers discovered during implementation. Country packs must be configurable so other markets can have their own source registry.

## Canonical user experience

Example manager request:

> “Нужно завтра 50 мешков плиточного клея на объект в Salou.”

AISTROYKA should:

1. check project/site inventory;
2. check company warehouses;
3. query directly connected suppliers;
4. run external market search against approved online sources for the project region;
5. normalize equivalent products and technical specifications;
6. compare current price, VAT treatment, quantity/pack size, visible stock/availability, pickup store/warehouse, distance to project, delivery/pickup options and freshness of information;
7. combine product sourcing with logistics/fleet options;
8. rank total landed-cost + ETA + reliability options;
9. present the best proposal(s) with provenance and confidence;
10. require approval before any purchase/booking action according to governance policy.

Example result:

> “Нашёл 4 подходящих предложения. Лучший вариант — OBRAMAT, 50 мешков доступны в выбранном складе, итоговая стоимость с доставкой €X, ожидаемое прибытие завтра 14:00. BAUHAUS дешевле на €Y, но подтверждённый срок позже. Подтвердить лучший вариант?”

## Source classes

The engine must distinguish source types:

- `DIRECT_API` — supplier-supported API/partner API;
- `ERP_WMS` — direct enterprise integration;
- `EDI_FEED` — structured feed;
- `PUBLIC_CATALOG` — retailer public product pages/catalog/search;
- `PUBLIC_STOCK_VIEW` — public store/warehouse stock surface where legally/technically accessible;
- `SEARCH_ENGINE_DISCOVERY` — discovery only; never treated as authoritative stock;
- `MANUAL_QUOTE` — human-entered supplier quote;
- `EMAIL_PDF` — parsed fallback source.

The system must never claim stock, final price or delivery confirmation unless the underlying source actually supports that claim. Search-engine snippets are discovery evidence, not transactional truth.

## Spain market pack

Initial Spain source registry should cover at least:

- BAUHAUS España;
- Leroy Merlin España;
- OBRAMAT;
- BigMat;
- additional professional builders merchants and regional suppliers discovered during source audit.

Current public surfaces already demonstrate useful patterns: OBRAMAT exposes warehouse-selection-dependent stock/price views and advertises 20,000+ stocked products, 2-hour pickup and 24-hour worksite delivery on parts of its catalog; Leroy Merlin likewise requires selecting a store to see stock availability; BigMat provides an online catalog/store locator and construction-material network. These capabilities must be verified per connector during implementation and must not be assumed stable forever.

## Architecture

Add a first-class subsystem conceptually named:

`Supply Market Search Engine`

Suggested components:

- `MarketSourceRegistry`
- `CountryMarketPack`
- `RetailerConnector`
- `CatalogSearchAdapter`
- `ProductPageParser`
- `StockAvailabilityAdapter`
- `PriceNormalizer`
- `MaterialMatcher`
- `OfferFreshnessEvaluator`
- `SourceReliabilityScorer`
- `MarketOfferAggregator`
- `ProcurementRankingEngine`

Each retailer/source gets its own adapter. Do not build one fragile universal scraper.

## Connector strategy

Priority order:

1. official API / partner integration where available;
2. official structured product feeds;
3. official public catalog/search pages where permitted;
4. controlled browser/search retrieval for discovery and read-only comparison;
5. manual quote fallback.

Respect source terms, robots/access restrictions, authentication boundaries and rate limits. Do not bypass anti-bot protections or private interfaces. If real-time stock/order capability is unavailable, mark the offer as `NEEDS_CONFIRMATION` and route to a confirmation workflow rather than fabricating certainty.

## Normalized market offer

Every market result should normalize into a typed structure containing at least:

- source/retailer;
- source type;
- source URL or connector identifier;
- source product ID/SKU where available;
- normalized AISTROYKA material ID;
- original title;
- manufacturer/brand;
- technical attributes;
- unit and pack quantity;
- requested quantity coverage;
- displayed unit price;
- displayed total price;
- VAT semantics if known;
- selected store/warehouse;
- stock status;
- numeric available quantity only when genuinely supplied by source;
- pickup availability;
- delivery availability;
- delivery estimate/window if provided;
- distance from project when calculable;
- observed timestamp;
- freshness TTL;
- confidence;
- provenance/evidence.

## Material matching

AI may assist with fuzzy matching, but technical compatibility must be rule/evidence based. Never silently substitute products with different critical properties such as dimensions, strength class, fire rating, acoustic rating, waterproofing class, electrical rating, certification or project-specified brand/system compatibility.

Statuses for substitutes should include:

- `EXACT_MATCH`
- `APPROVED_EQUIVALENT`
- `POSSIBLE_EQUIVALENT_REVIEW_REQUIRED`
- `NOT_COMPATIBLE`

## Location-aware search

Search must use project location. For each project, AISTROYKA should identify relevant nearby stores/warehouses and rank them by actual fulfilment outcome, not merely web search rank.

Ranking inputs:

- suitability;
- stock confidence;
- price;
- total landed cost;
- distance;
- pickup readiness;
- delivery window;
- supplier reliability;
- source freshness;
- project required-by time;
- transport availability.

## Agent tools

Add/reuse typed tools such as:

- `search_market_materials`
- `search_retailer_catalog`
- `find_nearby_material_stores`
- `get_market_product_details`
- `check_public_store_availability`
- `compare_market_offers`
- `rank_market_fulfilment_options`
- `refresh_market_offer`
- `request_supplier_confirmation`

Read-only public market search must remain separate from transactional ordering tools.

## Freshness and truth rules

Public retailer information changes quickly. Every market offer must carry `observed_at`, source provenance and freshness state.

Recommended states:

- `LIVE_CONFIRMED`
- `RECENT_PUBLIC_DATA`
- `STALE_NEEDS_REFRESH`
- `NEEDS_SUPPLIER_CONFIRMATION`
- `UNAVAILABLE`

Before approval of an order, price/stock/delivery must be refreshed. Before execution, the transactional connector or explicit supplier confirmation is authoritative.

## Country expansion

Market sources must be data/configuration driven. Conceptual structure:

`market-packs/es`, `market-packs/fr`, `market-packs/de`, etc.

Each pack defines:

- retailer/source registry;
- supported categories;
- languages;
- currency/tax assumptions;
- connector capabilities;
- regional location rules;
- legal/technical constraints.

## Cursor retrieval aliases

Treat the following user phrases as references to this specification plus the main Supply & Logistics canonical document:

- “поиск материалов по интернету”
- “ищи материалы в магазинах”
- “поиск по BAUHAUS”
- “поиск по Leroy Merlin”
- “поиск по OBRAMAT”
- “поиск по BigMat”
- “основные магазины Испании”
- “сравни цены на материалы”
- “найди где материал есть в наличии”
- “Market Search Engine”
- “Supply Market Search”
- “retailer connectors”

Before implementing any of these, Cursor/agent must read both:

1. `docs/product/AISTROYKA_SUPPLY_LOGISTICS_AGENT_CANONICAL.md`
2. `docs/product/AISTROYKA_SUPPLY_MARKET_SEARCH_CANONICAL.md`

Then audit current code and implement incrementally without duplicate procurement, AI-provider or governance stacks.
