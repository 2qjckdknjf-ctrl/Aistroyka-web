# Полная привязка 97 пакетов к существующему плану

Дата интеграции: 20 октября 2026. Основа: [канонический roadmap](../AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md), [amendment](../AISTROYKA_PLAN_AMENDMENT_2026-09-23.md), [актуальная сверка](../CURRENT_EXECUTION_STATE_2026-10-11.md). [Правила исполнения](../AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [машинная карта](canonical-mapping.json).

Каждый пакет имеет одну основную Phase. Связанные фазы и additional release scopes — области влияния, не добавленные hard dependencies. Принадлежность к Phase классифицирует результат: она не переоткрывает уже выполненное требование и не включает Customer/AI/Android в текущий пилот. `BROAD_PARENT_INFERRED` честно отмечает отсутствие точного специализированного AIS-ID. Поддерживающие IDs из старых матриц сохраняют свои имена; их исторические PARTIAL/MISSING не импортируются как сегодняшнее состояние.

| Пакет | Phase | Existing AIS parent | Дополнительный existing ID | Release scope | Режим |
|---|---|---|---|---|---|
| [V2-ARCH-01](#v2-arch-01) | 1 | AIS-PILOT-001, AIS-OWNER-001 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-ARCH-04](#v2-arch-04) | 1 | AIS-PILOT-001, AIS-EVID-002, AIS-VISION-003, AIS-GRAPH-004 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-ARCH-07](#v2-arch-07) | 13 | AIS-PILOT-001, AIS-OWNER-001, AIS-EVID-002 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-ARCH-09](#v2-arch-09) | 13 | AIS-PILOT-001, AIS-OWNER-001 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-01](#v2-ios-01) | 0 | AIS-PILOT-001 | IOS-MGR-001, IOS-WKR-001, IOS-CUST-001, CICD-001, STORE-IOS-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-PUB-01](#v2-pub-01) | 12 | AIS-PILOT-001 | — | PUBLIC_WEB | DETAIL_EXISTING_REQUIREMENT |
| [V2-PUB-02](#v2-pub-02) | 12 | AIS-PILOT-001 | — | PUBLIC_WEB | DETAIL_EXISTING_REQUIREMENT |
| [V2-PUB-03](#v2-pub-03) | 12 | AIS-PILOT-001 | — | PUBLIC_WEB | DETAIL_EXISTING_REQUIREMENT |
| [V2-PUB-04](#v2-pub-04) | 12 | AIS-PILOT-001 | — | PUBLIC_WEB | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-01](#v2-web-01) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-22](#v2-web-22) | 0 | AIS-PILOT-001 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-AND-01](#v2-and-01) | 13 | AIS-PILOT-001 | AND-MGR-001, AND-WKR-001 | ANDROID_DEFERRED | CROSS_CUTTING_ACCEPTANCE |
| [V2-CON-02](#v2-con-02) | 0 | AIS-PILOT-001 | IOS-WKR-001, AND-WKR-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-AND-02](#v2-and-02) | 13 | AIS-PILOT-001 | AND-MGR-001, AND-WKR-001 | ANDROID_DEFERRED | CROSS_CUTTING_ACCEPTANCE |
| [V2-ARCH-02](#v2-arch-02) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-ARCH-06](#v2-arch-06) | 1 | AIS-PILOT-001, AIS-OWNER-001 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-CON-01](#v2-con-01) | 13 | AIS-PILOT-001, AIS-EVID-002 | IOS-WKR-001, IOS-MGR-001, AND-WKR-001, AND-MGR-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-CON-03](#v2-con-03) | 6 | AIS-EVID-002, AIS-OWNER-001 | IOS-WKR-001, IOS-MGR-001, IOS-CUST-001, AND-WKR-001, AND-MGR-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-CON-04](#v2-con-04) | 1 | AIS-PILOT-001D | IOS-MGR-001, AND-MGR-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-02](#v2-ios-02) | 13 | AIS-PILOT-001, AIS-OWNER-002 | IOS-MGR-001, IOS-WKR-001, IOS-CUST-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-03](#v2-ios-03) | 13 | AIS-PILOT-001, AIS-OWNER-002 | IOS-MGR-001, IOS-WKR-001, IOS-CUST-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-WEB-05](#v2-web-05) | 1 | AIS-PILOT-001, AIS-OWNER-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-AND-03](#v2-and-03) | 6 | AIS-EVID-002 | AND-WKR-001 | ANDROID_DEFERRED | DETAIL_EXISTING_REQUIREMENT |
| [V2-AND-04](#v2-and-04) | 6 | AIS-EVID-002 | AND-WKR-001 | ANDROID_DEFERRED | DETAIL_EXISTING_REQUIREMENT |
| [V2-AND-05](#v2-and-05) | 13 | AIS-EVID-002 | AND-WKR-001 | ANDROID_DEFERRED | CROSS_CUTTING_ACCEPTANCE |
| [V2-AND-06](#v2-and-06) | 13 | AIS-PILOT-001 | AND-WKR-001 | ANDROID_DEFERRED | CROSS_CUTTING_ACCEPTANCE |
| [V2-AND-07](#v2-and-07) | 6 | AIS-EVID-002 | AND-WKR-001 | ANDROID_DEFERRED | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-04](#v2-ios-04) | 6 | AIS-EVID-002 | IOS-WKR-001, IOS-MGR-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-05](#v2-ios-05) | 6 | AIS-EVID-002 | IOS-WKR-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-06](#v2-ios-06) | 6 | AIS-EVID-002 | IOS-WKR-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-07](#v2-ios-07) | 13 | AIS-PILOT-001, AIS-EVID-002 | IOS-WKR-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-08](#v2-ios-08) | 13 | AIS-EVID-002, AIS-PILOT-001 | IOS-WKR-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-09](#v2-ios-09) | 13 | AIS-PILOT-001 | IOS-WKR-001, DOCS-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-10](#v2-ios-10) | 1 | AIS-PILOT-001 | IOS-WKR-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-11](#v2-ios-11) | 13 | AIS-PILOT-001 | IOS-WKR-001, IOS-MGR-001, NOTIF-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-12](#v2-ios-12) | 13 | AIS-PILOT-001 | IOS-WKR-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-13](#v2-ios-13) | 6 | AIS-EVID-002 | IOS-WKR-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-14](#v2-ios-14) | 6 | AIS-EVID-002 | IOS-WKR-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-15](#v2-ios-15) | 1 | AIS-PILOT-001, AIS-EVID-002 | IOS-WKR-001, IOS-MGR-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-16](#v2-ios-16) | 13 | AIS-PILOT-001 | IOS-WKR-001, IOS-MGR-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-AND-08](#v2-and-08) | 6 | AIS-EVID-002, AIS-PILOT-001D | AND-MGR-001, AND-WKR-001 | ANDROID_DEFERRED | DETAIL_EXISTING_REQUIREMENT |
| [V2-AND-09](#v2-and-09) | 1 | AIS-PILOT-001D | AND-MGR-001 | ANDROID_DEFERRED | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-17](#v2-ios-17) | 1 | AIS-PILOT-001 | IOS-MGR-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-18](#v2-ios-18) | 1 | AIS-PILOT-001, AIS-EVID-002 | IOS-MGR-001, IOS-WKR-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-19](#v2-ios-19) | 6 | AIS-EVID-002, AIS-OWNER-001, AIS-OWNER-002, AIS-PILOT-001D | IOS-MGR-001, IOS-WKR-001, IOS-CUST-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-20](#v2-ios-20) | 1 | AIS-PILOT-001 | IOS-MGR-001, NOTIF-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-21](#v2-ios-21) | 1 | AIS-PILOT-001 | IOS-MGR-001, DOCS-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-23](#v2-ios-23) | 1 | AIS-EVID-002, AIS-PILOT-001 | IOS-MGR-001, BUDGET-001 | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-02](#v2-web-02) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-03](#v2-web-03) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-04](#v2-web-04) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-06](#v2-web-06) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-07](#v2-web-07) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-08](#v2-web-08) | 1 | AIS-PILOT-001, AIS-OWNER-001, AIS-EVID-002 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-12](#v2-web-12) | 6 | AIS-EVID-002, AIS-VISION-003 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-15](#v2-web-15) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-24](#v2-ios-24) | 2 | AIS-OWNER-002, AIS-OWNER-001 | IOS-CUST-001, PORTAL-001 | CUSTOMER | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-25](#v2-ios-25) | 3 | AIS-OWNER-002, AIS-OWNER-001, AIS-APPROVAL-003 | IOS-CUST-001, DOCS-001 | CUSTOMER | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-26](#v2-ios-26) | 2 | AIS-OWNER-002, AIS-OWNER-001, AIS-EVID-002 | IOS-CUST-001, PORTAL-001 | CUSTOMER | DETAIL_EXISTING_REQUIREMENT |
| [V2-IOS-27](#v2-ios-27) | 2 | AIS-CLIENT-005A, AIS-OWNER-002 | IOS-CUST-001, CUST-INTAKE-005A | CUSTOMER | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-09](#v2-web-09) | 3 | AIS-OWNER-001, AIS-PILOT-001 | — | CUSTOMER | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-10](#v2-web-10) | 2 | AIS-OWNER-001, AIS-PILOT-001 | — | CUSTOMER | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-16](#v2-web-16) | 6 | AIS-PILOT-001, AIS-EVID-002 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-23](#v2-web-23) | 2 | AIS-OWNER-001, AIS-EVID-002 | — | CUSTOMER | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-24](#v2-web-24) | 3 | AIS-OWNER-001, AIS-EVID-002 | — | CUSTOMER | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-25](#v2-web-25) | 6 | AIS-PILOT-001, AIS-EVID-002 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-26](#v2-web-26) | 1 | AIS-PILOT-001, AIS-MATCH-006 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-29](#v2-web-29) | 0 | AIS-PILOT-001 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-WEB-31](#v2-web-31) | 9 | AIS-OWNER-001, AIS-EVID-002 | — | CUSTOMER | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-33](#v2-web-33) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-ARCH-05](#v2-arch-05) | 7 | AIS-EVID-002, AIS-VISION-003, AIS-GRAPH-004, AIS-CORRECTION-009 | — | AI | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-22](#v2-ios-22) | 7 | AIS-VISION-003, AIS-EVID-002 | IOS-MGR-001, VISION-003 | AI | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-11](#v2-web-11) | 7 | AIS-EVID-002, AIS-VISION-003, AIS-OWNER-001 | — | AI | DETAIL_EXISTING_REQUIREMENT |
| [V2-AND-10](#v2-and-10) | 13 | AIS-PILOT-001 | AND-MGR-001, AND-WKR-001, A11Y-001, I18N-001, DESIGN-001 | ANDROID_DEFERRED | CROSS_CUTTING_ACCEPTANCE |
| [V2-AND-11](#v2-and-11) | 13 | AIS-PILOT-001 | AND-MGR-001, AND-WKR-001 | ANDROID_DEFERRED | CROSS_CUTTING_ACCEPTANCE |
| [V2-AND-12](#v2-and-12) | 13 | AIS-PILOT-001 | AND-WKR-001, NOTIF-001 | ANDROID_DEFERRED | CROSS_CUTTING_ACCEPTANCE |
| [V2-ARCH-03](#v2-arch-03) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-ARCH-08](#v2-arch-08) | 13 | AIS-PILOT-001, AIS-EVID-002 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-28](#v2-ios-28) | 13 | AIS-PILOT-001, AIS-OWNER-002 | IOS-MGR-001, IOS-WKR-001, IOS-CUST-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-29](#v2-ios-29) | 13 | AIS-PILOT-001, AIS-OWNER-002 | IOS-MGR-001, IOS-WKR-001, IOS-CUST-001, A11Y-001, I18N-001, DESIGN-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-PUB-05](#v2-pub-05) | 12 | AIS-PILOT-001 | — | PUBLIC_WEB | DETAIL_EXISTING_REQUIREMENT |
| [V2-PUB-06](#v2-pub-06) | 12 | AIS-PILOT-001 | — | PUBLIC_WEB | DETAIL_EXISTING_REQUIREMENT |
| [V2-PUB-07](#v2-pub-07) | 12 | AIS-PILOT-001 | — | PUBLIC_WEB | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-13](#v2-web-13) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-14](#v2-web-14) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-18](#v2-web-18) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-19](#v2-web-19) | 13 | AIS-PILOT-001, AIS-OWNER-001 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-WEB-20](#v2-web-20) | 13 | AIS-PILOT-001, AIS-OWNER-001 | — | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |
| [V2-WEB-27](#v2-web-27) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-28](#v2-web-28) | 1 | AIS-PILOT-001, AIS-OWNER-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-17](#v2-web-17) | 4 | AIS-PILOT-001, AIS-OWNER-001 | — | COMMERCIAL | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-32](#v2-web-32) | 1 | AIS-PILOT-001 | — | CONTRACTOR_CORE | DETAIL_EXISTING_REQUIREMENT |
| [V2-PUB-08](#v2-pub-08) | 12 | AIS-PILOT-001 | — | PUBLIC_WEB | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-21](#v2-web-21) | 12 | AIS-PILOT-001 | — | COMMERCIAL | DETAIL_EXISTING_REQUIREMENT |
| [V2-WEB-30](#v2-web-30) | 12 | AIS-PILOT-001 | — | PUBLIC_WEB | INTEGRATION_VALIDATION_ONLY |
| [V2-AND-13](#v2-and-13) | 13 | AIS-PILOT-001 | AND-MGR-001, AND-WKR-001, STORE-AND-001, CICD-001 | ANDROID_DEFERRED | CROSS_CUTTING_ACCEPTANCE |
| [V2-IOS-30](#v2-ios-30) | 13 | AIS-PILOT-001, AIS-OWNER-002, AIS-EVID-002, AIS-VISION-003 | IOS-MGR-001, IOS-WKR-001, IOS-CUST-001, CICD-001, STORE-IOS-001 | CONTRACTOR_CORE | CROSS_CUTTING_ACCEPTANCE |

## V2-ARCH-01

**Единый реестр маршрутов, действий и capabilities.** [Полная карточка](MEGA_PLAN_RU.md#v2-arch-01).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 2, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-001`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Навигационные producers/consumers и capabilities уточняют действующий Manager shell; Customer projection — связанная область.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)

## V2-ARCH-04

**Контракты сущностей, источников, units и разрешённых действий.** [Полная карточка](MEGA_PLAN_RU.md#v2-arch-04).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 2, 6, 7, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-EVID-002`, `AIS-VISION-003`, `AIS-GRAPH-004`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`, `AI`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Контракты entity/source/units/sync/report policy поддерживают текущий операционный цикл; не создают новый доменный продукт.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:28](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L28)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:30](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L30)

## V2-ARCH-07

**Матрица доступа и projection для каждого actor/source.** [Полная карточка](MEGA_PLAN_RU.md#v2-arch-07).

Основная **Phase 13 — Production Hardening Final**; связанные: 0, 2.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-001`, `AIS-EVID-002`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Матрица actor/source/projection относится к security hardening; Phase 0 сохраняет baseline-проверку, Phase 2 — Customer границу.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)

## V2-ARCH-09

**Релиз по доказательствам критических journeys.** [Полная карточка](MEGA_PLAN_RU.md#v2-arch-09).

Основная **Phase 13 — Production Hardening Final**; связанные: 0.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-001`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`, `AI`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Сценарная приёмка и доказательства на конкретной сборке уточняют существующий release gate.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)

## V2-IOS-01

**Зафиксировать воспроизводимый native baseline перед изменениями.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-01).

Основная **Phase 0 — Live Truth Verification**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `IOS-MGR-001`, `IOS-WKR-001`, `IOS-CUST-001`, `CICD-001`, `STORE-IOS-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`, `AI`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Воспроизводимый SHA/build/API baseline конкретизирует Live Truth Verification перед изменениями; сборка, тесты и внешняя дистрибуция остаются отдельными доказательствами.

- Не заявляет запуск симулятора или устройства и не восстанавливает отсутствующую release-ветку по исторической инструкции.
- Наличие target или архива не означает готовность Customer либо разрешение store upload.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:261](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L261)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:30](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L30)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:28](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L28)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1734](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1734)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L12)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:62](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L62)

## V2-PUB-01

**Исправить непересекающийся hero layout.** [Полная карточка](MEGA_PLAN_RU.md#v2-pub-01).

Основная **Phase 12 — Monetization / Packaging**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `PUBLIC_WEB`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Публичный acquisition/help/content результат детализирует существующую упаковку продукта; его исправление не включает платную подписку или будущий feature rollout.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-PUB-02

**Исправить контраст и типографику общих CTA.** [Полная карточка](MEGA_PLAN_RU.md#v2-pub-02).

Основная **Phase 12 — Monetization / Packaging**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `PUBLIC_WEB`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Публичный acquisition/help/content результат детализирует существующую упаковку продукта; его исправление не включает платную подписку или будущий feature rollout.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-PUB-03

**Восстановить читаемую таблицу сравнения тарифов.** [Полная карточка](MEGA_PLAN_RU.md#v2-pub-03).

Основная **Phase 12 — Monetization / Packaging**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `PUBLIC_WEB`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Публичный acquisition/help/content результат детализирует существующую упаковку продукта; его исправление не включает платную подписку или будущий feature rollout.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-PUB-04

**Сделать корректные карточки ссылок справки.** [Полная карточка](MEGA_PLAN_RU.md#v2-pub-04).

Основная **Phase 12 — Monetization / Packaging**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `PUBLIC_WEB`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Публичный acquisition/help/content результат детализирует существующую упаковку продукта; его исправление не включает платную подписку или будущий feature rollout.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-01

**Остановить цикл регистрации Create Task.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-01).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-22

**Закрыть production smoke/session/RPC консоль.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-22).

Основная **Phase 0 — Live Truth Verification**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Production diagnostic exposure проверяется как Live Truth/security slice; не утверждает текущую production уязвимость без runtime evidence.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-AND-01

**Сессия с refresh и запретом выполнения работы от другого аккаунта.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-01).

Основная **Phase 13 — Production Hardening Final**; связанные: 0.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `AND-MGR-001`, `AND-WKR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Session refresh, owner generation и A/B fence детализируют security/release safety существующих Android клиентов.

- Точного AIS refresh ID нет; этот technical acceptance не активирует Android D2.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L11)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-CON-02

**Общий Worker bootstrap и разрешённый identity context.** [Полная карточка](MEGA_PLAN_RU.md#v2-con-02).

Основная **Phase 0 — Live Truth Verification**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `IOS-WKR-001`, `AND-WKR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `ANDROID_DEFERRED`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Worker bootstrap и разрешённый identity context конкретизируют authoritative tenant/project authorization проверку: сначала согласуется контракт и negative fixture, затем его native consumers.

- Сопоставление Phase 0 предложено как contract/security preflight; это не новый auth backend и не расширение всех /me полей.
- Добавляется только необходимый method/path для четырёх Worker profiles, без подмены x-client на Manager и без доверия tenantId из UI.
- Manager/Customer auth не переопределяются заголовком роли, хотя frozen metadata содержит общий перечень ролей.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:261](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L261)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [AGENTS.md:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/AGENTS.md#L10)

## V2-AND-02

**Проверяемый bootstrap, членство и разрешённые действия.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-02).

Основная **Phase 13 — Production Hardening Final**; связанные: 1.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `AND-MGR-001`, `AND-WKR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Membership, canReview и Worker bootstrap должны соблюдать tenant/project/revoke policy; это общий security gate текущих двух Android клиентов.

- Mobile allowlist не описан отдельным AIS требованием.
- Customer роли и Customer Android не добавляются.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L11)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:464](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L464)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-ARCH-02

**Типизированные ресурсные состояния и recovery commands.** [Полная карточка](MEGA_PLAN_RU.md#v2-arch-02).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Общие resource/recovery states являются сквозными условиями корректности ежедневных действий.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-ARCH-06

**Единые read models, полнота и cache invalidation.** [Полная карточка](MEGA_PLAN_RU.md#v2-arch-06).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 4, 7, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-001`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`, `AI`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Полнота read models и cache ownership — сквозные условия правильного Manager результата и безопасных projections.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)

## V2-CON-01

**Долговечный результат повторяемой операции и защита от дубликатов.** [Полная карточка](MEGA_PLAN_RU.md#v2-con-01).

Основная **Phase 13 — Production Hardening Final**; связанные: 1, 6.

Existing AIS: `AIS-PILOT-001`, `AIS-EVID-002`. Supporting IDs: `IOS-WKR-001`, `IOS-MGR-001`, `AND-WKR-001`, `AND-MGR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`, `ANDROID_DEFERRED`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Durable operation outcome, owner/payload binding и восстановление после lost response — общий acceptance к уже существующим writer flows и evidence retry. Это ограниченный backend срез родительских V2-ARCH-04/07.

- Точного AIS operation receipt ID нет; использовать существующие CAS/unique/readback и добавлять только доказанные недостающие гарантии.
- Не обещать exactly-once транспорта или распределённую транзакцию со Storage/AI provider.
- AI canonical completion остаётся у V2-ARCH-05. Customer consumers получают отдельную проверку своих прав/версий; общая receipt не заменяет AIS-APPROVAL-003.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L11)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:67](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L67)

## V2-CON-03

**Идентичность вложения, версия и добавление исправлений.** [Полная карточка](MEGA_PLAN_RU.md#v2-con-03).

Основная **Phase 6 — Proof Pack**; связанные: 1, 2, 7, 13.

Existing AIS: `AIS-EVID-002`, `AIS-OWNER-001`. Supporting IDs: `IOS-WKR-001`, `IOS-MGR-001`, `IOS-CUST-001`, `AND-WKR-001`, `AND-MGR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`, `AI`, `ANDROID_DEFERRED`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Source/association identity, revision и append policy исправлений прямо уточняют Evidence provenance и сохранение оригинала для Worker, Manager, Web, Customer и AI readers.

- До link A→B создаёт локальную revision; после link correction по умолчанию добавляет evidence к прежнему reportId. Истинный supersede требует отдельного additive решения.
- Legacy array ordering не доказывает before/after; переиспользуются существующие report_before/report_after purpose.
- Это не полный Graph, не AI completion и не AIS-CORRECTION-009 training/eval lineage; публикация и отзыв доступа остаются отдельными правами.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L11)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1128](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1128)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:132](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L132)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:134](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L134)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:95](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L95)

## V2-CON-04

**Полные списки отчётов: фильтры до limit, курсор и счётчики.** [Полная карточка](MEGA_PLAN_RU.md#v2-con-04).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001D`. Supporting IDs: `IOS-MGR-001`, `AND-MGR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `ANDROID_DEFERRED`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Полный /api/v1/reports список с server-side фильтрацией до limit, стабильным cursor и правдивым count уточняет существующую Manager approval очередь.

- Backend AIS-PILOT-001D уже доставлен; эта запись описывает дополнительную ограниченную пагинацию/фильтрацию, а не заново реализацию approval queue.
- AIS-PILOT-001E project summary — другой контракт. Task lists, Customer collections, IOS-17 Home и единичный Web viewer не получают искусственный hard dependency.
- Frozen generic [0,1,13]/AIS-PILOT-001 сохранён как исходное значение; новая primary 1 — явное предложенное уточнение mapping, не изменение frozen файла.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:338](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L338)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:5](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L5)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L11)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L350)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:462](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L462)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:6](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L6)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L8)

## V2-IOS-02

**Привязать кэш, drafts и outbox к неизменяемому владельцу.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-02).

Основная **Phase 13 — Production Hardening Final**; связанные: 0, 2.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-002`. Supporting IDs: `IOS-MGR-001`, `IOS-WKR-001`, `IOS-CUST-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Owner-scoped cache, draft, outbox и защита от старых callbacks — конкретные acceptance к tenant/session isolation. Для Customer session revocation прямо предусмотрен AIS-OWNER-002.

- Отдельного AIS требования на owner key/generation нет; технический механизм является предложенной детализацией security gate.
- Общая библиотека не объединяет приложения; Customer проверяется в своём release slice.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L26)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)

## V2-IOS-03

**Завершить понятный вход, role recovery и первое использование.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-03).

Основная **Phase 13 — Production Hardening Final**; связанные: 0, 1, 2.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-002`. Supporting IDs: `IOS-MGR-001`, `IOS-WKR-001`, `IOS-CUST-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Вход, recovery, bootstrap и различение недоступного сервера, истёкшей сессии и отсутствующего членства завершают существующий auth loop и security/E2E gates.

- Нового AIS onboarding/bootstrap ID нет; Phase 13 является владельцем общей приёмки, а Phase 1/2 обозначают затронутые рабочие входы.
- Сохраняются существующие auth/PKCE и четыре Worker профиля; нельзя маскировать запрет под Manager client.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L26)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)

## V2-WEB-05

**Связать identity, onboarding и правильное рабочее пространство.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-05).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 0, 2, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)

## V2-AND-03

**Восстанавливаемый черновик и точная связь с задачей/объектом.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-03).

Основная **Phase 6 — Proof Pack**; связанные: 13.

Existing AIS: `AIS-EVID-002`. Supporting IDs: `AND-WKR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Точная task/project/source identity и восстанавливаемый draft поддерживают существующую evidence chain и Worker task/photo/submit loop.

- Room и owner partition являются предложенной реализацией/AC; это не утверждение о наличии отдельного canonical offline модуля.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1091](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1091)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-AND-04

**Проверяемые фото до/после и устойчивая очередь загрузки.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-04).

Основная **Phase 6 — Proof Pack**; связанные: 13.

Existing AIS: `AIS-EVID-002`. Supporting IDs: `AND-WKR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Before/after, сохранение оригинала, отсутствие duplicate evidence и честное завершение прямо уточняют Proof Pack и Capture Completeness.

- Durable Android upload/outbox — технические AC существующей цепочки, а не отдельный новый продукт.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1091](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1091)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:131](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L131)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-AND-05

**Worker sync: применить данные, затем подтвердить cursor.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-05).

Основная **Phase 13 — Production Hardening Final**; связанные: 6.

Existing AIS: `AIS-EVID-002`. Supporting IDs: `AND-WKR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Применение snapshot/delta до ACK и crash recovery защищают сохранность Worker evidence data.

- Точного AIS sync/offline/cursor ID нет; техническая привязка inferred.
- Только Worker sync; Manager остаётся на REST.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-AND-06

**Смена с подтверждённым серверным результатом и датой.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-06).

Основная **Phase 13 — Production Hardening Final**; связанные: нет.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `AND-WKR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Подтверждённый start/end/current-day обеспечивает надёжность уже существующего Worker field loop.

- В проверенном каноне нет отдельного AIS shift/day reconciliation ID.
- Это не новая Phase 6 business feature.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-AND-07

**История решений и полный повторный отчёт с новым evidence.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-07).

Основная **Phase 6 — Proof Pack**; связанные: 13.

Existing AIS: `AIS-EVID-002`. Supporting IDs: `AND-WKR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Reviewed result, before/after, report status, manager note и добавление evidence при resubmit конкретизируют Proof Pack.

- Не AIS-CORRECTION-009: он относится к prediction/model correction и corpus, а не к обычной правке Worker report.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:95](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L95)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:97](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L97)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-IOS-04

**Заменить строительные значения по умолчанию на требования конкретной задачи.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-04).

Основная **Phase 6 — Proof Pack**; связанные: 1, 13.

Existing AIS: `AIS-EVID-002`. Supporting IDs: `IOS-WKR-001`, `IOS-MGR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Версионированные требования конкретной задачи и честное отсутствие замера прямо уточняют Evidence Quality Gate: denominator, requirement version и unknown/null должны иметь источник.

- Удаление строительных default values не требует внедрения полного AIS-RULE-015 или нового AI engine.
- Обязательность поля задаётся согласованным требованием задачи, а не неподтверждённой универсальной нормой.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:131](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L131)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:132](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L132)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:133](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L133)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:134](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L134)

## V2-IOS-05

**Сделать один ReportDraft для Form, Review и Submit.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-05).

Основная **Phase 6 — Proof Pack**; связанные: 13.

Existing AIS: `AIS-EVID-002`. Supporting IDs: `IOS-WKR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Один восстанавливаемый ReportDraft связывает form, review и submit с той же задачей, source media и reviewed result; это детализация существующего Worker field loop.

- Наличие предложенной модели в плане не означает, что миграция drafts уже выполнена.
- Backend outcome остаётся в V2-CON-01; клиентский пакет не создаёт второй протокол идемпотентности.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:134](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L134)

## V2-IOS-06

**Связать preview с media revision и вынести binary из JSON.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-06).

Основная **Phase 6 — Proof Pack**; связанные: 13.

Existing AIS: `AIS-EVID-002`. Supporting IDs: `IOS-WKR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Связь preview с media identity/revision и отдельное файловое хранение защищают происхождение evidence и восстановление отчёта.

- Source URL не считается постоянной идентичностью; решение потребляет общий V2-CON-03.
- После link сохраняется оригинал; локальная замена до link не даёт права переписать уже принятое evidence.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:132](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L132)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:134](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L134)

## V2-IOS-07

**Разделить конфликты, auth и retry в outbox.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-07).

Основная **Phase 13 — Production Hardening Final**; связанные: 6.

Existing AIS: `AIS-PILOT-001`, `AIS-EVID-002`. Supporting IDs: `IOS-WKR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Различение auth, conflict, retry и NeedsReconciliation делает существующую отправку отчётов безопасной при потерянном ответе и повторе.

- Точного AIS outbox taxonomy ID нет; это сквозная надёжность существующей evidence цепочки.
- Автоматический retry разрешён только доказанным контрактом операции; транспорт exactly-once не обещается.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)

## V2-IOS-08

**Открывать Worker после cold start и применять snapshot до ACK.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-08).

Основная **Phase 13 — Production Hardening Final**; связанные: 6.

Existing AIS: `AIS-EVID-002`, `AIS-PILOT-001`. Supporting IDs: `IOS-WKR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Сохранённый bootstrap, применение snapshot/delta до ACK и recovery после crash обеспечивают целостность доступной Worker evidence модели.

- Порядок ACK-before/after apply не описан отдельным AIS требованием; сопоставление — техническая приёмка надёжности.
- Worker sync не переносится в Manager; возможная race требует воспроизводимого теста, а не утверждения о случившейся потере данных.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [AGENTS.md:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/AGENTS.md#L10)

## V2-IOS-09

**Сделать «доступно офлайн» свойством файла и версии.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-09).

Основная **Phase 13 — Production Hardening Final**; связанные: 1.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `IOS-WKR-001`, `DOCS-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Честная доступность конкретной версии файла офлайн и отзыв локального разрешённого cache уточняют надёжность существующих Worker documents.

- Нет отдельного AIS offline-document ID; DOCS-001 — точный существующий доменный родитель.
- Это не Customer pagination и не consumer V2-CON-04; удаление локальной копии не удаляет серверный документ.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:21](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L21)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)

## V2-IOS-10

**Сначала показывать работу, затем вторичные счётчики.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-10).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `IOS-WKR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Приоритет доступной задачи над вторичными счётчиками конкретизирует существующий Worker field loop. Phase 1 выбран как организационное место оперативной работы; название фазы относится к Manager, а Worker остаётся отдельным клиентом.

- Прямая каноническая Phase 1 задача Worker Today не сформулирована; фазовая привязка является предложением с опорой на существующий IOS-WKR-001.
- Ограниченный endpoint не превращается в полную историю; новый backend список не следует из этой записи.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:338](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L338)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L350)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:423](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L423)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:462](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L462)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)

## V2-IOS-11

**Довести notification и deep link до разрешённой сущности.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-11).

Основная **Phase 13 — Production Hardening Final**; связанные: 1, 6.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `IOS-WKR-001`, `IOS-MGR-001`, `NOTIF-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

APNs lifecycle и переход к конкретной разрешённой сущности прямо входят в mobile delivery roadmap и дополняют общий security/E2E gate.

- Native push не является Telegram Phase 10; opened, read и delivery имеют разную семантику.
- Customer push не активируется этим пакетом автоматически и остаётся отдельным предложением в своём release slice.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:22](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L22)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:315](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L315)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:317](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L317)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:318](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L318)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:319](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L319)

## V2-IOS-12

**Добавить восстановление QR и контекстные permissions.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-12).

Основная **Phase 13 — Production Hardening Final**; связанные: 0.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `IOS-WKR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

QR recovery и контекстный запрос системных разрешений — конкретные приёмочные условия существующего Worker входа и capture flow.

- Точного AIS QR/permissions требования нет; родитель AIS-PILOT-001 широкий, связь обоснована native/security gate.
- Отказ camera permission должен оставлять доступный recovery; не добавляется новый продуктовый onboarding.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:161](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L161)

## V2-IOS-13

**Сделать camera settings и quality feedback правдивыми.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-13).

Основная **Phase 6 — Proof Pack**; связанные: 13.

Existing AIS: `AIS-EVID-002`. Supporting IDs: `IOS-WKR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Правдивые camera settings и capture quality feedback напрямую соответствуют versioned capture requirements, missing/blurred/stale cases и разделению качества изображения и качества работ.

- Качественный кадр не подтверждает construction verdict; unavailable не заменяется фиктивным score.
- Этот UX срез не требует автоматически запускать будущую ML/eval программу мобильного quality gate.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:131](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L131)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:132](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L132)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:133](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L133)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:134](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L134)
- [docs/roadmap/AI_DIGEST_RECONCILIATION_2026-10-13.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AI_DIGEST_RECONCILIATION_2026-10-13.md#L24)

## V2-IOS-14

**Восстанавливать исправление отчёта, сохранив существующий queued submit.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-14).

Основная **Phase 6 — Proof Pack**; связанные: 13.

Existing AIS: `AIS-EVID-002`. Supporting IDs: `IOS-WKR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Восстанавливаемый resubmit сохраняет reportId, оригинал, manager note и новое evidence в существующем reject/resubmit loop.

- Обычная правка Worker отчёта не является AIS-CORRECTION-009: тот относится к prediction/model correction и evaluation lineage.
- Не заменять существующий queued submit новым параллельным отправителем; R1 correction не очищает независимый draft R2.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:134](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L134)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:95](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L95)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:97](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L97)

## V2-IOS-15

**Сохранить identity замечания при частичном успехе.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-15).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 6, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-EVID-002`. Supporting IDs: `IOS-WKR-001`, `IOS-MGR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Сохранение issueId после частичного create/upload и переход Manager к доказательству завершают существующее оперативное замечание и его evidence.

- Операционные project issues не отождествляются с project_defects из Phase 8.
- Фазовая привязка к daily control и общий AIS-PILOT родитель — вывод; AIS-EVID применяется к сохранности источника, а не создаёт новый дефектный контур.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:338](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L338)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L350)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1287](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1287)

## V2-IOS-16

**Сохранить chat draft и media при ошибке отправки.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-16).

Основная **Phase 13 — Production Hardening Final**; связанные: 1, 6.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `IOS-WKR-001`, `IOS-MGR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Восстанавливаемые task chat draft/media и один logical message после timeout — сквозные критерии надёжности существующих Manager/Worker коммуникаций.

- Нет точного AIS task-chat требования; supporting IOS родители ограничивают существующую поверхность.
- Voice attachment не означает AIS-STREAM-010, live intake или Telegram; Phase 6 касается только связанной сохранности вложений.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:161](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L161)

## V2-AND-08

**Manager видит полное доказательство и результат проверки.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-08).

Основная **Phase 6 — Proof Pack**; связанные: 1, 13.

Existing AIS: `AIS-EVID-002`, `AIS-PILOT-001D`. Supporting IDs: `AND-MGR-001`, `AND-WKR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Manager получает точные evidence/note и записывает review; связанный queue invalidation детализирует существующий approval consumer.

- Backend AIS-PILOT-001D уже включён; пакет не переоткрывает его реализацию как отсутствующую.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:5](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L5)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L11)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L350)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L8)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-AND-09

**Правдивая Manager очередь: All/A/B/Без привязки, страницы и счётчики.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-09).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001D`. Supporting IDs: `AND-MGR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Полная Manager очередь submitted reports и точные All/A/B/unassigned/counts — конкретные новые клиентские AC существующего approval requirement.

- AIS-PILOT-001E не назначается: он относится к project summary, а не пагинации report-list.
- Общий контракт принадлежит V2-CON-04; Android — отложенный потребитель.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:338](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L338)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:5](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L5)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L11)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L350)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:462](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L462)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L8)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-IOS-17

**Сделать Manager Home и проектные входы завершёнными.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-17).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `IOS-MGR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Пустой список проектов, capability-aware create, recovery частичного summary и сохранение navigation context конкретизируют существующий Manager daily control и проектный вход.

- AIS-PILOT-001 — широкий родитель; точный существующий native parent — IOS-MGR-001.
- Manager Home/project create не должен ждать полного /reports pagination V2-CON-04. Existing shell сохраняется до проверки дизайна.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:338](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L338)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L350)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:423](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L423)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:462](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L462)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L8)

## V2-IOS-18

**Проверить полный Manager task lifecycle и назначение.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-18).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 6, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-EVID-002`. Supporting IDs: `IOS-MGR-001`, `IOS-WKR-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Проверка create/assign/edit и одной версии task requirements уточняет уже существующий task lifecycle; связанный Worker читает сохранённое требование.

- Это не заявление об отсутствии Manager CRUD и не новая задача разработки с нуля.
- Phase 6 относится к передаче версии evidence requirements; AIS-PILOT остаётся широким операционным родителем.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:338](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L338)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L350)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:132](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L132)

## V2-IOS-19

**Сохранить доказательство в Manager review и отдельной публикации.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-19).

Основная **Phase 6 — Proof Pack**; связанные: 1, 2, 13.

Existing AIS: `AIS-EVID-002`, `AIS-OWNER-001`, `AIS-OWNER-002`, `AIS-PILOT-001D`. Supporting IDs: `IOS-MGR-001`, `IOS-WKR-001`, `IOS-CUST-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Полный source-linked Manager review — часть Proof Pack. Явная публикация разрешённых фото составляет отдельный Customer срез, связанный с Owner contracts.

- Approved report не публикует фото автоматически; review и publication имеют разные права и версии.
- AIS-PILOT-001D уже имеет backend реализацию; это только проверка очереди/инвалидации потребителем, не повторное открытие старого PR.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1077](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L26)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:5](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L5)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1128](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1128)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L350)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L8)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L10)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:17](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L17)

## V2-IOS-20

**Уточнить Manager Team и Notifications действия.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-20).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `IOS-MGR-001`, `NOTIF-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Уточнение разрешённых Team и Notifications действий делает существующую Manager рабочую поверхность последовательной и проверяемой.

- Team membership и приглашения не являются Contractor Directory Phase 11 или AIS-MATCH-006.
- Нет точного AIS native Team ID; supporting IOS-MGR-001 и NOTIF-001 сохраняют границу текущего продукта.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:338](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L338)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:22](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L22)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L350)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:464](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L464)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)

## V2-IOS-21

**Согласовать Manager documents, issue DTO и decision права.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-21).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `IOS-MGR-001`, `DOCS-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Project documents, частичная загрузка и evidence DTO уточняют Manager daily operations. Document decision отображается только при действительном project-owner праве.

- Tenant Manager/tenant owner не автоматически project owner; это не повод назначить весь пакет Customer Decision Requests Phase 3.
- Nullable DTO loss сначала подтверждается production fixture; project issues не переименовываются в Phase 8 project_defects.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:338](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L338)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:21](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L21)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L350)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1684](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1684)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)

## V2-IOS-23

**Разделить бюджет и физический прогресс во всех Manager выходах.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-23).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 6, 13.

Existing AIS: `AIS-EVID-002`, `AIS-PILOT-001`. Supporting IDs: `IOS-MGR-001`, `BUDGET-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Отдельные бюджетные показатели и физический прогресс обеспечивают правдивость Manager daily control; evidence-derived work progress должен иметь собственное основание.

- Отношение фактических затрат к бюджету не является процентом выполненных строительных работ.
- Внутренний BUDGET-001 не относится к Customer commercial estimate Phase 4 и не должен попадать в Customer projection.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:338](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L338)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:20](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L20)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:423](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L423)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1102)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1688](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1688)

## V2-WEB-02

**Открытие задачи из Canon board и восстановление контекста.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-02).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-03

**Полный и видимый scope списка задач.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-03).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-04

**Восстановление task mutations и частичного создания.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-04).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-06

**Отделить lifecycle проекта от его риска.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-06).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-07

**Не превращать отказ загрузки в здоровый проект.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-07).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-08

**Вернуть входы к существующим project capabilities.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-08).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 2, 4, 6, 8, 9, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-001`, `AIS-EVID-002`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)

## V2-WEB-12

**Source-aware просмотр отчёта и доказательств.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-12).

Основная **Phase 6 — Proof Pack**; связанные: 7, 13.

Existing AIS: `AIS-EVID-002`, `AIS-VISION-003`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `AI`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Источник отчёта и исходные доказательства относятся к Proof Pack; AI result-area подключается отдельным условным срезом.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:28](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L28)

## V2-WEB-15

**Сохранение сведений при создании проекта.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-15).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-IOS-24

**Дать Customer полный разрешённый список и понятный project context.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-24).

Основная **Phase 2 — Owner / Customer Portal**; связанные: 3, 4, 13.

Existing AIS: `AIS-OWNER-002`, `AIS-OWNER-001`. Supporting IDs: `IOS-CUST-001`, `PORTAL-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Полные разрешённые Customer collections и устойчивый project context непосредственно детализируют отдельный Customer iOS клиент и безопасный Owner portal contract.

- Существующий Customer target уже подтверждён current state; историческое MISSING из матрицы не переносится.
- Полнота этих domain collections не достигается /reports V2-CON-04 и не создаёт ему новую зависимость.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:470](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L470)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L26)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:13](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L13)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:576](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L576)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:17](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L17)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L12)
- [docs/roadmap/AI_DIGEST_RECONCILIATION_2026-10-13.md:17](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AI_DIGEST_RECONCILIATION_2026-10-13.md#L17)

## V2-IOS-25

**Показывать Customer содержание версии до ответа.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-25).

Основная **Phase 3 — Decision Requests**; связанные: 2, 4, 13.

Existing AIS: `AIS-OWNER-002`, `AIS-OWNER-001`, `AIS-APPROVAL-003`. Supporting IDs: `IOS-CUST-001`, `DOCS-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Показ документа/сметы, условий и конкретной версии перед ответом — прямая детализация Decision Requests и Action/Approval contract.

- Изменённая версия требует нового согласия; сервер повторно проверяет actor/project.
- Не добавляются платежи, юридическая электронная подпись или обязательная fresh auth для всех кнопок: policy действует только для уже выбранных значимых действий.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:629](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L629)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L26)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:66](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L66)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:21](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L21)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:744](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L744)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:914](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L914)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:64](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L64)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:67](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L67)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:17](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L17)

## V2-IOS-26

**Сохранить защищённую галерею и добавить полноту просмотра.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-26).

Основная **Phase 2 — Owner / Customer Portal**; связанные: 6, 13.

Existing AIS: `AIS-OWNER-002`, `AIS-OWNER-001`, `AIS-EVID-002`. Supporting IDs: `IOS-CUST-001`, `PORTAL-001`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Полнота безопасной галереи, source identity и действия revoke конкретизируют опубликованные фото/видео и private evidence доступ в существующем Customer приложении.

- Сохраняется existing private resolver и публикационный allowlist; URL не является основанием доступа.
- Этот пакет не включает весь raw Worker evidence и не публикует материалы автоматически после review.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:470](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L470)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L26)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:13](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L13)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:576](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L576)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1128](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1128)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L10)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L12)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:17](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L17)

## V2-IOS-27

**Доработать существующий Customer intake без лишней обязательности.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-27).

Основная **Phase 2 — Owner / Customer Portal**; связанные: 13.

Existing AIS: `AIS-CLIENT-005A`, `AIS-OWNER-002`. Supporting IDs: `IOS-CUST-001`, `CUST-INTAKE-005A`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Восстановление существующего manual intake form, сохранение необязательности полей и полный список drafts — ограниченная клиентская часть broader async intake backlog. Phase 2 выбрана по Owner surface.

- Текущий project-bound manual CRUD уже существует; пакет не реализует целиком preproject owner-bound AI extractor AIS-CLIENT-005A.
- Не относится к live camera/voice AIS-CLIENT-005B, Graph prerequisite не добавляется вручную к простой форме.
- Дополнительный camera/gallery upload включается только после проверки существующего безопасного контракта.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:470](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L470)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:29](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L29)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L26)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:14](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L14)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:35](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L35)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:17](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L17)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L11)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L12)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:16](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L16)

## V2-WEB-09

**Замкнуть документное согласование из inbox.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-09).

Основная **Phase 3 — Decision Requests**; связанные: 2, 13.

Existing AIS: `AIS-OWNER-001`, `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Документное решение из inbox относится к Decision Requests; уже существующий документный backend переиспользуется.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-10

**Отдельный разрешённый shell клиентского портала.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-10).

Основная **Phase 2 — Owner / Customer Portal**; связанные: 9, 13.

Existing AIS: `AIS-OWNER-001`, `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Отдельный разрешённый Customer shell развивает существующий portal; /owner не назначается новым Customer маршрутом.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-16

**Надёжное создание документа и честная ссылка доступа.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-16).

Основная **Phase 6 — Proof Pack**; связанные: 2, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-EVID-002`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Надёжность документа и честная ссылка доступа — часть evidence/document handoff, а не повторное создание Documents.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)

## V2-WEB-23

**Проверить полный customer path и опубликованные источники.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-23).

Основная **Phase 2 — Owner / Customer Portal**; связанные: 0, 3, 4, 6, 13.

Existing AIS: `AIS-OWNER-001`, `AIS-EVID-002`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Полная цепочка Customer и опубликованных версий — приёмка существующего portal/publication контура.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)

## V2-WEB-24

**Межролевые списки и детали без потери сообщения или решения.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-24).

Основная **Phase 3 — Decision Requests**; связанные: 2, 4, 5, 8, 9, 13.

Existing AIS: `AIS-OWNER-001`, `AIS-EVID-002`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Межролевое сообщение/решение детализирует Decision Requests и связанные существующие списки.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)

## V2-WEB-25

**Завершить проверку сохранения и подтверждения daily log.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-25).

Основная **Phase 6 — Proof Pack**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-EVID-002`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Daily log persistence и acknowledgement дополняют Evidence приёмку; существующий CRUD не создаётся заново.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)

## V2-WEB-26

**Развести people directory и управление доступом.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-26).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 11, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-MATCH-006`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Текущий people directory и access management относятся к Manager; AIS-MATCH-006 только связанный будущий scope, не активация matching.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:32](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L32)

## V2-WEB-29

**Проверить tenant admin и platform admin как разные продукты.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-29).

Основная **Phase 0 — Live Truth Verification**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Разделение tenant/platform administration проверяется на baseline и access scope; Customer и platform owner не смешиваются.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-31

**Handover и public proof share с источниками и отзывом доступа.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-31).

Основная **Phase 9 — Handover Pack**; связанные: 6, 13.

Existing AIS: `AIS-OWNER-001`, `AIS-EVID-002`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Handover и отзыв опубликованного proof share относятся к Phase 9 с переиспользованием Proof Pack.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)

## V2-WEB-33

**Governance case от создания до подтверждённого закрытия.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-33).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-ARCH-05

**Долговечный AI результат, source lifecycle и human review.** [Полная карточка](MEGA_PLAN_RU.md#v2-arch-05).

Основная **Phase 7 — AI Daily Digest**; связанные: 6, 13.

Existing AIS: `AIS-EVID-002`, `AIS-VISION-003`, `AIS-GRAPH-004`, `AIS-CORRECTION-009`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `AI`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Durable AI completion и human review уточняют AI Daily Digest и существующие Evidence/Vision/Graph, с отдельным AI release scope.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:28](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L28)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:30](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L30)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:95](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L95)

## V2-IOS-22

**Развести AI job, insight и решение по источнику.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-22).

Основная **Phase 7 — AI Daily Digest**; связанные: 6, 13.

Existing AIS: `AIS-VISION-003`, `AIS-EVID-002`. Supporting IDs: `IOS-MGR-001`, `VISION-003`.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `AI`; дополнительные срезы: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Разделение технического AI job status, insight и человеческого решения конкретизирует существующие Vision/evidence contracts; Phase 7 выбран как место принятия и отображения AI выводов.

- Phase 7 здесь классифицирует AI presentation/review, не требует создать новый Daily Digest pipeline.
- Durable backend completion принадлежит V2-ARCH-05; пакет потребляет его результат. Не закрывает полный AIS-CORRECTION-009/eval corpus.
- Убрать фиктивные probability/confidence и честно показать error/unknown можно в ограниченном core UI срезе; это не означает готовность AI capability.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1164](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1164)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:28](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L28)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:15](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L15)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1271](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1271)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:35](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L35)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:54](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L54)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:55](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L55)
- [docs/roadmap/AI_DIGEST_RECONCILIATION_2026-10-13.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AI_DIGEST_RECONCILIATION_2026-10-13.md#L18)

## V2-WEB-11

**Разделить строительный риск, AI job status и рекомендации.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-11).

Основная **Phase 7 — AI Daily Digest**; связанные: 13.

Existing AIS: `AIS-EVID-002`, `AIS-VISION-003`, `AIS-OWNER-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `AI`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:28](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L28)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)

## V2-AND-10

**Нативная навигация, состояния, текст и доступность существующих экранов.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-10).

Основная **Phase 13 — Production Hardening Final**; связанные: 1, 6.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `AND-MGR-001`, `AND-WKR-001`, `A11Y-001`, `I18N-001`, `DESIGN-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Навигация, состояния, локали и доступность существующих экранов — общий native quality gate; approved render packages и accessibility/localization прямо названы в handoff.

- Точного AIS native-navigation ID нет.
- Web-oriented supporting IDs не объявляются исторически выполненной Android приёмкой; широкая parity не добавляется.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L11)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:31](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L31)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:32](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L32)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:34](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L34)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:161](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L161)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-AND-11

**Контекстная помощь после основной работы, без ложной уверенности ИИ.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-11).

Основная **Phase 13 — Production Hardening Final**; связанные: 1.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `AND-MGR-001`, `AND-WKR-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Необязательная помощь должна оставлять основную работу доступной и предлагать только разрешённые выполнимые действия.

- Нет точного AIS help/onboarding ID.
- Не привязывать к Phase 7/AIS-VISION по слову AI: help card не является Daily Digest или Vision capability.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L11)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:425](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L425)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:462](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L462)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-AND-12

**Worker push: permission, доставка, открытие правильного отчёта, logout.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-12).

Основная **Phase 13 — Production Hardening Final**; связанные: нет.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `AND-WKR-001`, `NOTIF-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Worker FCM lifecycle завершает существующий Android field loop; post-pilot roadmap явно предусматривает Android FCM readiness.

- Отдельного AIS push ID нет. FCM не блокирует первый web+iOS pilot при deferred Android.
- Manager FCM, Customer Android и Telegram Phase 10 не включаются.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:22](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L22)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:315](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L315)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:321](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L321)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:449](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L449)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-ARCH-03

**Отделить feature behavior от Canon presentation.** [Полная карточка](MEGA_PLAN_RU.md#v2-arch-03).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Разделение feature behavior и Canon presentation устраняет повторные расхождения реализации существующего кабинета.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-ARCH-08

**Telemetry завершения реальных пользовательских задач.** [Полная карточка](MEGA_PLAN_RU.md#v2-arch-08).

Основная **Phase 13 — Production Hardening Final**; связанные: 1, 7.

Existing AIS: `AIS-PILOT-001`, `AIS-EVID-002`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `AI`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Telemetry результата входит в observability/hardening; назначение пакета не означает измеренный baseline.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)

## V2-IOS-28

**Сделать настройки, help и диагностику понятными действиями.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-28).

Основная **Phase 13 — Production Hardening Final**; связанные: 1, 2.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-002`. Supporting IDs: `IOS-MGR-001`, `IOS-WKR-001`, `IOS-CUST-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Настройки, доступная help action и безопасная диагностика — общий quality/recovery gate существующих приложений, включая Customer состояния при включении его среза.

- Точного AIS help/settings ID нет; это сквозная детализация, а не новый AI assistant backend.
- Контекстная помощь не блокирует основную работу; условный V2-CON-05 не входит в текущие 97/47 пакетов.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L26)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:161](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L161)

## V2-IOS-29

**Проверить native typography, accessibility и четыре локали.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-29).

Основная **Phase 13 — Production Hardening Final**; связанные: 1, 2, 6.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-002`. Supporting IDs: `IOS-MGR-001`, `IOS-WKR-001`, `IOS-CUST-001`, `A11Y-001`, `I18N-001`, `DESIGN-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Native typography, VoiceOver/large text и четыре production локали — сквозные критерии существующего coding handoff; phase-specific journeys проверяются в выбранном срезе.

- A11Y-001/I18N-001 исторической матрицы первоначально описаны на web surfaces; применение к native дополнительно обосновано amendment localization/accessibility, а не выдаётся за старый iOS PASS.
- Accessibility и locale proof не следуют из наличия строк или compile; требуется отдельное native исполнение.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L26)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:31](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L31)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:32](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L32)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:34](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L34)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:161](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L161)

## V2-PUB-05

**Сохранить intent обращения и фокус многошаговой формы.** [Полная карточка](MEGA_PLAN_RU.md#v2-pub-05).

Основная **Phase 12 — Monetization / Packaging**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `PUBLIC_WEB`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Публичный acquisition/help/content результат детализирует существующую упаковку продукта; его исправление не включает платную подписку или будущий feature rollout.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-PUB-06

**Дать действующим пользователям отдельный путь поддержки.** [Полная карточка](MEGA_PLAN_RU.md#v2-pub-06).

Основная **Phase 12 — Monetization / Packaging**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `PUBLIC_WEB`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Публичный acquisition/help/content результат детализирует существующую упаковку продукта; его исправление не включает платную подписку или будущий feature rollout.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-PUB-07

**Переписать семь статей как инструкции по реальным ролям.** [Полная карточка](MEGA_PLAN_RU.md#v2-pub-07).

Основная **Phase 12 — Monetization / Packaging**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `PUBLIC_WEB`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Публичный acquisition/help/content результат детализирует существующую упаковку продукта; его исправление не включает платную подписку или будущий feature rollout.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-13

**Правдивые названия меню и область поиска.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-13).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-14

**Убрать ложные действия в заголовках.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-14).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-18

**Согласовать период существующего графика работ.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-18).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-19

**Доступность основных Canon действий.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-19).

Основная **Phase 13 — Production Hardening Final**; связанные: 1, 2.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-001`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Accessibility уточняет final hardening существующих действий; не является новым функциональным эпиком.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)

## V2-WEB-20

**Локаль, тексты и сохранение навигационного контекста.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-20).

Основная **Phase 13 — Production Hardening Final**; связанные: 1, 2.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-001`. Supporting IDs: не назначены.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Locale/context preservation уточняет cross-surface hardening существующих экранов.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)

## V2-WEB-27

**Операционные экраны загрузок, устройств и нагрузки.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-27).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-28

**Ролевая помощь, поддержка и security settings.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-28).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 2, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)

## V2-WEB-17

**Корректные денежные агрегаты и полнота портфеля.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-17).

Основная **Phase 4 — Customer Estimates / Commercial Approvals**; связанные: 1, 7, 13.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `MIXED`. Release scope: `COMMERCIAL`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Денежная полнота и units относятся к commercial-facing и внутренним агрегатам с раздельной audience projection.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25)

## V2-WEB-32

**Один достоверный рабочий день и портфельный action list.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-32).

Основная **Phase 1 — Manager Daily Control Center**; связанные: 7, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `CONTRACTOR_CORE`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Конкретное действие существующего Manager/операционного контура детализирует широкое требование AIS-PILOT-001; самостоятельный AIS-ID не вводится.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-PUB-08

**Подготовить утверждённые публичные условия и правдивые материалы.** [Полная карточка](MEGA_PLAN_RU.md#v2-pub-08).

Основная **Phase 12 — Monetization / Packaging**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `PUBLIC_WEB`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Публичный acquisition/help/content результат детализирует существующую упаковку продукта; его исправление не включает платную подписку или будущий feature rollout.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-21

**Честное ожидание активации подписки без изменения billing gates.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-21).

Основная **Phase 12 — Monetization / Packaging**; связанные: 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `DETAIL_EXISTING_REQUIREMENT`; основание: `BROAD_PARENT_INFERRED`. Release scope: `COMMERCIAL`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Ожидание subscription activation относится к Monetization/Packaging; entitlement/account-first gates сохраняются.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-WEB-30

**Public acquisition и визуальные регрессии по результатам Product Design.** [Полная карточка](MEGA_PLAN_RU.md#v2-web-30).

Основная **Phase 12 — Monetization / Packaging**; связанные: 1, 13.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: не назначены.

Режим: `INTEGRATION_VALIDATION_ONLY`; основание: `BROAD_PARENT_INFERRED`. Release scope: `PUBLIC_WEB`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Единая интеграционная проверка уже учтённых PUB-01…08 в acquisition path; повторной реализации и повторного effort нет.

- Primary phase — классификация пакета, не новая зависимость и не подтверждение недостающей реализации. Existing requirement delivery не переоткрывается автоматически.
- Owner, estimate и applicability каждого release slice уточняются после свежей сверки main/PR/runtime.

Основания в каноне:

- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)

## V2-AND-13

**Android scope lock и воспроизводимый non-bypass release gate.** [Полная карточка](MEGA_PLAN_RU.md#v2-and-13).

Основная **Phase 13 — Production Hardening Final**; связанные: 0.

Existing AIS: `AIS-PILOT-001`. Supporting IDs: `AND-MGR-001`, `AND-WKR-001`, `STORE-AND-001`, `CICD-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `ANDROID_DEFERRED`. Execution: `DEFERRED_BY_DECISION`; проверки: `NOT_RUN`.

Проверка конкретного SHA/build, NO_GO при отсутствии evidence и сохранение отдельного store gate продолжают D1 evidence к будущему минимальному D2.

- Это классификация release gate, а не разрешение широкой parity или изменение DEFERRED_BY_DECISION.
- Android D1 audit уже merged; историческое TODO в DAG не переносится как текущая незавершённость.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L11)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L12)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:29](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L29)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:30](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L30)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1734](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1734)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:41](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L41)
- [docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L43)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L18)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L63)

## V2-IOS-30

**Доказать основной цикл на production типах и реальных устройствах.** [Полная карточка](MEGA_PLAN_RU.md#v2-ios-30).

Основная **Phase 13 — Production Hardening Final**; связанные: 0, 1, 2, 3, 4, 6, 7.

Existing AIS: `AIS-PILOT-001`, `AIS-OWNER-002`, `AIS-EVID-002`, `AIS-VISION-003`. Supporting IDs: `IOS-MGR-001`, `IOS-WKR-001`, `IOS-CUST-001`, `CICD-001`, `STORE-IOS-001`.

Режим: `CROSS_CUTTING_ACCEPTANCE`; основание: `DIRECT_SEMANTIC_DETAIL`. Release scope: `CONTRACTOR_CORE`; дополнительные срезы: `CUSTOMER`, `AI`. Execution: `PROPOSED`; проверки: `NOT_RUN`.

Проверяемый результат для конкретного SHA/build/OS/role/network непосредственно конкретизирует production hardening и независимые native release gates.

- PROPOSED, source review, compile, simulator и device evidence имеют разные уровни; skipped не считается PASS, DONE не означает Released.
- Формальная зависимость frozen пакета от всех IOS пакетов не превращается в запрет отдельного contractor core release до всего Customer/AI roadmap; выбирается и явно фиксируется нужный срез.
- Сопоставление не разрешает store upload, deploy или внешнюю передачу артефактов.

Основания в каноне:

- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1676](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L26)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:28](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L28)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L8)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L9)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L10)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:30](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L30)
- [docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv:28](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv#L28)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1702](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1702)
- [docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md:1734](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1734)
- [docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md:17](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L17)
- [docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md:62](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md#L62)
- [docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md:23](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md#L23)
