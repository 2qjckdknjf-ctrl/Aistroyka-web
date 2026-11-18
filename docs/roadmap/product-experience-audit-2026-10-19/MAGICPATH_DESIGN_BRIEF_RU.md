# AISTROYKA V2 — техническое задание на дизайн в MagicPath

> Перенос в действующий план: 20 октября 2026. Основной текст ниже — аудит/предложение от **19 октября** на указанном SHA, не новая runtime-проверка. [Текущие правила интеграции](../AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта 97 пакетов](CANONICAL_MAPPING_RU.md) имеют приоритет при выборе Phase, existing requirement и release scope. Относительные ссылки адаптированы; снимки экрана и журналы доступны в [исходном архиве](ARCHIVE_REFERENCES.md).

**Статус: DESIGN PROPOSAL / READY TO DESIGN. Canvas и фреймы ещё не созданы.**

Дата: 19 октября 2026 года. Базовый исходный код: `04ec74bf955c29799ab535c043a33c1f9296c309`. Основа реализации — [консолидированный план из 97 пакетов](tickets.snapshot.json); метка последнего сверенного снимка — 2026-10-19T22:14:51.058719+00:00. При передаче в Cursor использовать его окончательно зафиксированную ревизию. Его `topological_order`, общие contract owners и release gates приоритетнее порядка экранов в этом документе.

## 1. Назначение и границы

Подготовить будущий canvas AISTROYKA с **23 основными фреймами в 9 семействах**, состояниями общих компонентов и тремя кликабельными сценариями. Дизайн должен показать, как человек завершает действие и понимает его результат: от выбора задачи и сохранения фотографии до решения менеджера и ответа заказчика по разрешённой версии документа.

Это задание на последующий дизайн, а не отчёт о готовом canvas. По read-only проверке MagicPath в текущем проходе root получил два других проекта; AISTROYKA в списке не обнаружен, active projects — пустой массив. Это не доказывает отсутствие AISTROYKA во всех возможных аккаунтах. `projectId`, `componentId` и `revisionId` для этого задания не известны и не придуманы. Новый проект, загрузки файлов и внешние изменения этим документом не выполнялись.

Прочитан актуальный MagicPath skill. При будущем выполнении использовать production-интеграцию, подтверждённый projectId и реальные component/revision IDs. Не подменять её beta CLI или локальным `.magicpath` файлом. Если впоследствии отдельно поручено создать новый проект, сначала создать и открыть его, затем генерировать дизайн. Для существующего подтверждённого canvas действуют правила повторного использования без лишних открытий.

### Что известно о текущем интерфейсе

| Поверхность | Основа задания | Статус текущего визуального состояния |
|---|---|---|
| Публичные сайт, pricing, contact, support | Свежие наблюдения root, PUB-пакеты и прочитанный source | PUBLIC V2 EVIDENCE; конкретные ссылки на наблюдения берутся из основного отчёта, не из вымышленных before-фреймов |
| Закрытый web-кабинет и Customer portal | Исходный код, API/роль и статический аудит | **BEFORE FRAME UNKNOWN** |
| iOS Worker, Manager, Customer | Свежая source-revalidation | **BEFORE FRAME UNKNOWN; NATIVE RUNTIME NOT_RUN** |
| Android Worker, Manager | Свежая source-revalidation | **BEFORE FRAME UNKNOWN; NATIVE RUNTIME NOT_RUN** |
| Все целевые фреймы этого задания | Предлагаемые структура, контент и поведение | **DESIGN PROPOSAL**, не существующая сборка |

Native фрейм в MagicPath моделирует интерфейс. Он не доказывает работу SwiftUI/Compose, системной камеры, фоновой отправки, VoiceOver/TalkBack, push, авторизации или сохранность после завершения процесса. Android Customer не входит в текущий продуктовый минимум и в это задание не добавляется.

## 2. Дизайн-принципы и данные

### Главный результат

Worker должен понимать, какую задачу выполняет, что сохранено локально и что принято сервером. Manager должен видеть полное исходное доказательство и результат своего решения. Customer должен видеть разрешённое содержание именно той версии, по которой отвечает. Публичный посетитель должен сохранять выбранный тариф или тему обращения до подтверждения.

На каждом фрейме один заметный основной следующий шаг. Вторичные действия остаются доступными, но не конкурируют с ним. Ошибка соседнего блока не стирает полезное содержимое всей страницы. Back, Cancel и смена фильтра сохраняют допустимый контекст и введённые данные.

### Сохранить бренд и различия платформ

Источник публичных цветов — [website-v41.css](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/styles/website-v41.css), строки 1–37: тёмный фон `#030b16`, поверхность `#09182a`, основной текст `#eef4ff`, акцент `#ffc400`, hover-акцент `#ffe36a`. Для приложения исходные семантические tokens находятся в [design-tokens.css](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/design-tokens.css), строки 19–56: фон `#040a18`, поверхность `#101b33`, акцент `#F5C518`, основной текст `#f8fbff`, обратный текст `#050b1c`.

Не сводить эти контексты к новому случайному набору цветов. Жёлтый — основной action/выделение; опасность и ошибка имеют отдельные подписи и семантический цвет. На жёлтой кнопке нужен тёмный текст. Цвет сам по себе не сообщает статус. Проверка фактического контраста и состояний CSS/native остаётся отдельным gate; наличие hex в макете не является PASS.

Сохранить существующие логотип, изображения и направление V4.1/V4.3/Canon. Если разрешённый asset не предоставлен в будущем canvas, использовать явно подписанный placeholder. Не генерировать рекламные кейсы, «доказательные» фотографии или чужие интерфейсы вместо исходного материала.

Использовать семантические отступы и типографику существующей системы. Для web — логичный порядок DOM/Tab, видимый focus, responsive панели. Для iOS — native navigation/sheet, safe areas, Dynamic Type и системные диалоги permissions. Для Android — ожидаемый system Back, keyboard/IME, permission-return и Compose-паттерны. Не рисовать web sidebar внутри Worker-приложения ради одинакового вида.

### Правила контента

- Все персональные и проектные данные прототипа — синтетические и помечены в аннотации canvas «Учебные данные». В сам интерфейс не переносить технические пометки автора.
- Один test report имеет одну identity во всех сценах: условный `R-DEMO-01` в аннотациях. Видимый заголовок — название задачи, объекта и дата, а не длинный UUID.
- Нет вымышленных AI probability/confidence, процентов строительной готовности, savings/ROI, сроков ответа поддержки или тарифных цен. Если источник отсутствует, показывать понятное unknown/loading, а не правдоподобное число.
- Количество, единица, метод и источник плана различимы. Не вводить 48, 26 мм или зелёное «В норме» как заранее выбранный факт. Ноль — осознанный ввод, отсутствие — отдельное состояние.
- Для pricing использовать значения действующего каталога, если они предоставлены. До этого обозначить поля цены/лимитов как неполученные, не подставлять придуманные суммы.
- AI job status, usable result, human review и физический риск — разные сведения. Бюджетное отношение не называется готовностью строительства.
- Customer не получает internal cost, margin, contractor budget, raw storage identifier или закрытый AI context. Согласованный commercial total не равен внутренней себестоимости.

## 3. Организация будущего canvas

Названия фреймов: `MP-01 … MP-23`. Названия семейств: `G01 … G09`. Это локальные design IDs, а не серверные component IDs и не новые Cursor tickets.

**Создать ровно 23 основных фрейма при будущем выполнении.** Разрешённые loading/error/permission/confirmation варианты оформлять состояниями компонентов или слоями внутри соответствующего фрейма. Если инструмент потребует отдельные физические copies для responsive/state variants, сначала показать их отдельный список и фактическое количество: не выдавать 60 canvas items за 23 фрейма. Основной набор из 23 остаётся неизменным.

Предложенные размеры для проектирования: web wide 1440 CSS px; web compact 390 CSS px; iOS portrait 390 logical points; Android portrait 412 logical dp. Это рабочие размеры макета, не доказательство поддержки устройств. Проверка расширяется на размеры/zoom из PUB-01, большие тексты и реальные поддерживаемые OS/device из IOS-29/30 и AND-10/13.

| Семейство | Фреймы | Основная поверхность | Решаемая задача |
|---|---|---|---|
| G01 Public | MP-01–04 | Web wide/compact | Понять продукт, выбрать тариф/тему, обратиться или найти помощь |
| G02 Access | MP-05–06 | Web + native adaptation | Войти в правильный разрешённый контекст |
| G03 Worker Today | MP-07 | iOS; Android adaptation | Начать или продолжить конкретную работу |
| G04 Worker report | MP-08–10 | iOS; Android minimum adaptation | Сохранить ввод и фотографии, проверить отправляемый состав |
| G05 Worker recovery | MP-11–12 | Android outbox / iOS correction | Восстановить отправку и исправить прежний отчёт |
| G06 Manager review | MP-13–15 | Web inbox / iOS evidence / Android decision | Найти отчёт, изучить источники, принять решение |
| G07 Publication | MP-16 | Web; iOS adaptation | Явно опубликовать выбранные источники |
| G08 Customer | MP-17–20 | iOS + safe web portal | Открыть разрешённый проект, версию, ответить |
| G09 Settings and recovery | MP-21–23 | Native + web adaptation | Управлять реальными настройками, получить помощь, выйти из ошибки |

Существующие native navigation trees и web Canon сохраняются. Ни таблица, ни прототип не вводят автоматический switch между Worker/Manager/Customer для обычного пользователя. Переключение синтетической тестовой сессии в сквозном прототипе — отдельный элемент тестового окружения вне продукта.

## 4. Спецификация 23 фреймов

Каждый фрейм ниже — PROPOSAL. Для MP-06–23 текущий before-frame UNKNOWN. Связанные `V2-*` IDs существуют в замороженном manifest. Указанный API boundary — контрактная зависимость дизайна, не обещание, что новый endpoint уже реализован.

### MP-01. Главная сайта — понятный старт

**G01 · Web wide.** Иерархия: header и язык → один H1 → короткое объяснение работы по ролям → primary CTA → существующее product image в отдельной колонке → роли/возможности/контекст human review. Иллюстрация не перекрывает текст, кнопку и порядок чтения.

**Действие и ввод:** «Обсудить пилот» открывает MP-03 с intent=pilot; «Посмотреть платформу» прокручивает к соответствующему разделу. «Войти» ведёт MP-05; «Тарифы» — MP-02. Переключение языка сохраняет допустимый path/query. Полей ввода на hero нет.

**Состояния/переходы:** default, focus/hover/pressed, expanded mobile menu; отсутствующий image не скрывает объяснение и CTA. Прокрутка к разделу имеет доступный target. Loading изображения не имитирует загрузку кабинета.

**RBAC/различия:** public; protected destination всегда проходит auth. На compact — последовательность текста и иллюстрации, доступное меню; native home не заменяется этим маркетинговым экраном.

**Задачи:** V2-PUB-01, V2-PUB-02, V2-WEB-20, V2-WEB-30. **AC:** все CTA имеют однозначную цель; hero не пересекается на согласованных размерах и длинных локалях; не показаны вымышленные результаты внедрения.

### MP-02. Pricing — сравнение без потери контекста

**G01 · Web wide.** Иерархия: заголовок → четыре карточки из текущего catalog → таблица «возможность + четыре тарифа» → короткие пояснения ограничений → контакты для соответствующего плана. Цена, период и лимиты читаются в одной связке.

**Действие и ввод:** выбрать существующий тариф; Starter/Pro сохраняют действующий login/next путь, Enterprise — согласованный contact intent. Поле `plan` хранится в переходе и подтверждении. Новый checkout или изменение billing rules здесь не проектируется.

**Состояния/переходы:** catalog ready/unavailable, selected plan, FAQ expanded, table horizontal scroll. При отсутствии значений показывается недоступность, не нулевая цена. MP-05 сохраняет next; MP-03 сохраняет plan/enterprise.

**RBAC/различия:** public read; последующие protected/billing действия отдельно проверяются. На compact горизонтально прокручивается только comparison wrapper; у ячейки остаются заголовок тарифа и feature. Не превращать сравнение в нечитаемый четырёхколоночный экран телефона.

**Задачи:** V2-PUB-03, V2-PUB-02, V2-WEB-21, V2-WEB-30. **AC:** каждая ячейка относится к своему тарифу; выбранный план доходит до следующего шага; нет нового forced subscription или фиктивной активации после возврата.

### MP-03. Contact — одна форма с сохранённой темой

**G01 · Web compact.** Иерархия: видимая тема обращения → текущий шаг → поля → локальные ошибки → primary action → краткая ссылка на действующие условия. Два шага остаются одним компонентом. Base fixture — enterprise/pilot; partner/security являются вариантами intent.

**Ввод/действие:** текущий pilot flow содержит имя, email, компанию; затем роль, число объектов, канал связи, цель. Для каждого intent показывать только согласованные подходящие поля. «Продолжить» валидирует шаг; «Назад» сохраняет ввод; «Отправить заявку» выполняет только simulated submit в прототипе.

**Состояния/переходы:** step1/step2, invalid field, sending, received, network error, duplicate tap coalesced. После смены шага focus идёт на heading/первое поле; после Back — осмысленно возвращается. Подтверждение повторяет тему/план и только утверждённое ожидание следующего действия.

**RBAC/различия:** public lead; форма не выдаёт доступ к организации. На wide сохранить ту же последовательность, не дублировать три формы. Support-intent открывается через MP-04 без обязательного описания нового пилота.

**Задачи:** V2-PUB-05, V2-PUB-06, V2-WEB-20, V2-PUB-08. **AC:** intent/plan не теряются после Back/error; все поля второго шага достижимы Tab до submit; повтор не создаёт ложных нескольких confirmations.

### MP-04. Support и справка — помощь действующему пользователю

**G01 · Web wide.** Иерархия: «С чем нужна помощь?» → категории существующей проблемы → релевантные инструкции по ролям → разрешённый канал обращения → контакты/статус ответа только из утверждённого процесса. Семь существующих docs доступны как полноценные отдельные карточки ссылок.

**Ввод/действие:** категория «Не отправляется отчёт / Нет доступа / Неверные данные / Оплата / Другая проблема», описание, контакт для ответа; app/build/request ID — необязательный безопасный контекст. «Сообщить о проблеме» передаёт support-intent в MP-03, а не возвращает к анкете пилота.

**Состояния/переходы:** category selected, article expanded/route, support form, sending/error/received. Статья объясняет prerequisites, точные шаги, результат и восстановление; не обещает ещё отсутствующее Android действие.

**RBAC/различия:** public инструкции без private project data; private support thread требует собственного доступа. Portal-only actor не получает ссылку на запрещённый internal support route. Native contextual help — MP-22.

**Задачи:** V2-PUB-04, V2-PUB-06, V2-PUB-07, V2-WEB-28, V2-WEB-10. **AC:** семь ссылок открывают свои статьи; карточки/focus не пересекаются; для поддержки не обязательны роль покупателя и запуск нового проекта; token/session dumps не запрашиваются.

### MP-05. Вход — восстановимый auth

**G02 · Web compact, native adaptation.** Иерархия: идентичность AISTROYKA/приложения → объяснимый context приглашения или next → email/password → primary login → существующие provider/recovery действия → условия/язык. Обязательность onboarding не маскируется под платную подписку.

**Ввод/действие:** email/password; показать/скрыть пароль; provider только там, где он существует. «Войти» переходит MP-06 после auth, а не сразу на protected Home. «Восстановить доступ» использует проверенный callback/return, не выдуманный deep link.

**Состояния/переходы:** validation, signing in, provider cancel, failed credentials, offline, expired session, recovered same owner. Cancel provider возвращает форму. Intent/next сохраняется, поздний ответ старой сессии не открывает новый аккаунт.

**RBAC/различия:** auth ещё не означает membership/capability. iOS сохраняет действующие Apple/Google safeguards; Android current minimum — email/password, без добавления social/OTP/QR. Native keyboard не закрывает CTA; системный Back предсказуем.

**Задачи:** V2-WEB-05, V2-WEB-20, V2-IOS-02, V2-IOS-03, V2-AND-01, V2-AND-02, V2-CON-02. **AC:** valid auth проходит через identity gate; expired recovery не теряет собственный draft; wrong account invite даёт понятный путь смены аккаунта.

### MP-06. Bootstrap и роль — разрешённое рабочее место

**G02 · Web compact с native состояниями.** Иерархия: подтверждённая identity → организация/проект, когда известны → состояние проверки доступа → один следующий шаг. Спиннер не заменяет no-membership экран без конца.

**Ввод/действие:** новый защищённый ввод не требуется. Ready ведёт Worker в MP-07, Manager в MP-13, Customer в MP-17. No-membership даёт существующий contractor onboarding, обработку приглашения или смену identity согласно текущему контексту. «Повторить проверку» повторяет read, не создаёт tenant.

**Состояния/переходы:** resolving identity, needs tenant, pending invitation, wrong app, forbidden/revoked, ready, offline with own allowed cache, no cache. Название роли и действия приходят из проверенного контекста, не из ручного role picker.

**RBAC/различия:** appProfile, tenant role, project owner, stakeholder, platform grant различаются. На native нельзя просто выбрать Manager и получить его права. Android bootstrap использует общий разрешённый `/me`; Customer не получает contractor tenant автоматически.

**Задачи:** V2-CON-02, V2-ARCH-07, V2-WEB-05, V2-IOS-02, V2-IOS-03, V2-AND-02. **AC:** ни один pending/denied state не выглядит пустым успешным списком; late response A не меняет UI B; нет автоматического повышения роли.

### MP-07. Worker Today — начать или продолжить работу

**G03 · iOS portrait.** Иерархия: дата и подтверждённый объект → актуальная смена/её неизвестность → назначенные задачи → незавершённый собственный отчёт/очередь → обратная связь менеджера. Optional guide и вторичные счётчики ниже основного действия.

**Действие/ввод:** «Продолжить отчёт» открывает прежний draft в MP-08; иначе «Начать отчёт по задаче» с подтверждённым task/project. Выбор фильтра не перепривязывает открытый draft. Start/end shift показывают pending/confirmed; неизвестная server day identity не заменяется локальной датой как ID.

**Состояния/переходы:** own cached tasks, refreshing, no tasks, no permissions, active/end pending shift, changes requested. Own correction ведёт MP-12, queue summary — MP-11. «На объекте» появляется только при определённом подтверждённом основании.

**RBAC/различия:** Worker scope и assignment; не весь Manager portfolio. Android не получает отсутствующие chat/issues/drawings кнопки; current minimum остаётся task/report/feedback. Cold offline entry может показывать собственную сохранённую работу с freshness.

**Задачи:** V2-IOS-08, V2-IOS-10, V2-IOS-11, V2-AND-02, V2-AND-05, V2-AND-06, V2-AND-11, V2-ARCH-04. **AC:** первичная работа доступна без ожидания help; ошибка count не становится 0; shift failure не рисует завершённую смену.

### MP-08. Черновик отчёта — один сохранённый состав

**G04 · iOS portrait.** Иерархия: объект/задача → требования именно этой задачи → заметка → quantity/unit/source, если контракт поддерживает → proof slots → статус локального сохранения → «Проверить отчёт». Никакого повторного независимого draft при переходе в review.

**Ввод/действие:** note, допустимые task-specific поля, фото через MP-09. Отсутствующий план отображается как «План не указан». Обязательные proof slots определяются принятой initial policy; произвольная задача не получает rebar checklist. Taskless legacy режим явно отличается от task-linked.

**Состояния/переходы:** clean/dirty/saved locally/save failed, missing required input, media pending/failed, reopened same draft. Back сохраняет; явное удаление локального черновика — отдельное действие с понятным последствием и без обещания server deletion.

**RBAC/различия:** immutable owner/task context. Android minimum сохраняет note/task/day/media; quantity/checklist editor не добавлять автоматически, если это новый непринимаемый scope. Web не получает новый Worker report editor только ради макета.

**Задачи:** V2-IOS-04, V2-IOS-05, V2-AND-03, V2-CON-01, V2-ARCH-04. **AC:** Back/restart восстанавливают тот же report; два drafts не смешивают note/media; unknown отличается от 0; selected project не подменяет server task relation.

### MP-09. Фото — выбор, качество и конкретное вложение

**G04 · iOS portrait.** Иерархия: цель фотографии/slot → preview → понятная доступная оценка качества → действия переснять/выбрать/использовать → статус сохранения. Не показывать геозамер и «В норме» без данных измерения.

**Ввод/действие:** camera или library по текущей платформе; «Использовать фото» означает успешное сохранение локального файла/текущей revision, не завершённый upload. «Заменить» до link создаёт новую revision. После link при доступном только append предложить добавить исправление; не рисовать несуществующий DELETE.

**Состояния/переходы:** picker cancel, camera permission denied, low storage, processing, image unreadable, blur warning, saved preview, upload pending. Cancel возвращает прежнее фото без красной ошибки. Return from Settings повторно проверяет permission.

**RBAC/различия:** фото принадлежит owner+draft+slot; signed URL — временное представление. Android current minimum использует gallery picker; direct camera/geo не добавляются этим фреймом. iOS системные controls остаются нативными.

**Задачи:** V2-IOS-06, V2-IOS-12, V2-IOS-13, V2-AND-04, V2-CON-03. **AC:** видимый B после замены совпадает с отправляемой revision B; late A не возвращается; cancel/deny не стирает ввод; реальный source не заменяется демонстрационной картинкой.

### MP-10. Проверка перед отправкой — что именно уйдёт менеджеру

**G04 · iOS portrait.** Иерархия: task/project → заметка и допустимые фактические поля → все выбранные текущие evidence → отсутствующие обязательные сведения → основной action. Каждая секция имеет «Изменить» с возвратом в тот же draft.

**Действие/ввод:** новый скрытый ввод не создаётся. Online — «Отправить отчёт»; offline с допустимой очередью — понятное «Отправить при подключении». Это фиксирует одно намерение и переводит в MP-11, пока нет server confirmation. Double tap не создаёт новый logical report.

**Состояния/переходы:** ready, invalid proof, preparing, queued, link pending, acknowledged submitted, failed/unknown outcome. Нельзя написать «Отправлено», если сохранён только local intent. Submit ожидает подтверждённые зависимости attach; пользователь видит, что ждёт.

**RBAC/различия:** только собственный разрешённый report в допустимом status. iOS Form/Review используют один draft aggregate; Android отображает свой поддерживаемый набор полей. Back сохраняет текст и revision.

**Задачи:** V2-IOS-05, V2-IOS-06, V2-IOS-07, V2-AND-03, V2-AND-04, V2-CON-01, V2-CON-03. **AC:** Manager затем видит тот же состав; queue success не маскируется под server success; input остаётся после error.

### MP-11. Очередь и восстановление — локально сохранено, сервер ещё проверяется

**G05 · Android portrait.** Иерархия: итог по собственной незавершённой работе → строки report/task → понятный этап каждой операции → причина ожидания → адресное восстановление. IDs, cursor и raw payload остаются в безопасной диагностике.

**Действие/ввод:** «Продолжить отправку», «Повторить» только допустимого шага, явные «Приостановить/Возобновить», «Открыть черновик». Retry неизвестного результата сначала проверяет прежнее намерение. Для невозможного безопасного повтора — объяснимое ожидание/обращение, не новая session/report.

**Состояния/переходы:** сохранено на устройстве, ждёт сети, загружается, прикрепляется, проверяется результат, требуется вход, запрещено, принято сервером. Процент — только если есть измеряемый byte progress; иначе этап без числа. Auth ведёт MP-05 с owner recovery; ошибка — MP-23; accepted возвращает MP-07.

**RBAC/различия:** owner partition, paused old-account work, никакого replay с новым bearer. Android runner/WorkManager и iOS background session могут отличаться; отображаемая гарантия одинакова. Manager Worker-sync queue не использует.

**Задачи:** V2-CON-01, V2-IOS-02, V2-IOS-07, V2-IOS-08, V2-AND-01, V2-AND-03, V2-AND-04, V2-AND-05. **AC:** restart продолжает тот же шаг; permanent failure не крутит hot loop; B не видит A; ошибка secondary refresh не повторяет удачный submit.

### MP-12. Исправление отчёта — прежняя identity, новое доказательство

**G05 · iOS portrait.** Иерархия: тот же report/task → причина возврата менеджера и дата → прежняя заметка/источники → новое correction note/evidence → primary «Отправить исправление». Original и добавление визуально различимы.

**Ввод/действие:** correction note и, когда требуется или полезно, новое фото через MP-09. Note-only correction разрешена при достаточном старом proof и согласованной policy. Новая фотография не удаляет тихо linked original. Финальная отправка использует существующую очередь submit того же reportId.

**Состояния/переходы:** editable changes_requested, local save, upload/attach partial success, queued, accepted, status changed elsewhere. При новом canonical status сохранить неотправленный ввод и объяснить, почему действие больше недоступно. Отправка — MP-11; история/Back — MP-07.

**RBAC/различия:** own report; approved/rejected detail read-only. Android добавляет correction media в текущий minimum, но не бесконечный исторический архив. Историю показывать только из существующего разрешённого источника.

**Задачи:** V2-IOS-14, V2-AND-07, V2-CON-01, V2-CON-03. **AC:** Manager получает correction в прежнем report; kill после attach не теряет результат; submit R1 не очищает pending R2; нет обязательного нового фото без policy.

### MP-13. Manager inbox — полный разрешённый scope

**G06 · Web wide.** Иерархия: scope All/Project/Unassigned → status/search/filter chips → точный count либо честное количество загруженных → список → выбранная строка/контекст. В строке объект, задача/автор, дата, status и ожидаемое действие.

**Действие/ввод:** выбрать scope/status, ввести поиск, очистить filters, загрузить следующую страницу, открыть конкретный report в MP-14. Back из detail сохраняет фильтр и позицию. Approved report исчезает из submitted-only после canonical refresh.

**Состояния/переходы:** initial loading, ready, empty scope, no search results, denied, stale list+refresh error, page loading/error. Нельзя выдавать ограниченную очередь из 15 записей за полное число ожидающих.

**RBAC/различия:** All означает все разрешённые данные, а не весь tenant для любой роли. Unassigned виден только разрешённому reviewer. Manager на REST. Native — фильтр/sheet и список, без сжатой desktop-таблицы; Android не получает новое управление проектами.

**Задачи:** V2-CON-04, V2-AND-09, V2-IOS-19, V2-WEB-12, V2-ARCH-06. **AC:** hidden rows доступны через continuation; filter A не смешивается с B; count имеет scope; detail открывает выбранную identity.

### MP-14. Manager evidence — полный источник до решения

**G06 · iOS portrait.** Иерархия: report context → worker note → активное фото и все thumbnails/источники → допустимые quantities/unit/source → review history → отдельный AI processing/result block → переход к решению. AI failure не блокирует чтение доказательства.

**Действие/ввод:** выбрать любой source, открыть его fullscreen, следующий/предыдущий, повторить недоступный preview, прочитать note/history. Before/After только при сохранённой категории/паре; одна картинка остаётся одним evidence. «Принять решение» ведёт MP-15.

**Состояния/переходы:** session-only media, image loading/expired/denied, 1/2/7+ attachments, no AI job, queued/failed/no usable result, source stale. URL renewal не меняет source identity. Не показывать 50%/70% как fallback-confidence.

**RBAC/различия:** report read и review capability различаются. Web — широкий viewer+inspector, keyboard navigation; Android обязан читать `file_url` и worker note из report, без зависимости от первых 50 project media. Private originals не становятся публичными.

**Задачи:** V2-WEB-12, V2-IOS-19, V2-IOS-22, V2-AND-08, V2-CON-03, V2-ARCH-05. **AC:** каждый source доступен при наличии права; fullscreen следует выбору; исходная note не потеряна; технический job status не называется строительным риском.

### MP-15. Manager decision — действие и подтверждённый результат

**G06 · Android portrait.** Иерархия: что проверяется → разрешённые варианты решения → требуемая заметка → краткое подтверждение выбранного действия → primary submit → server result. Цвет сопровождает текст «Утвердить / Запросить правки / Отклонить».

**Ввод/действие:** action и note. Для reject/changes непустая note обязательна по существующему контракту; approve может без неё. Primary label соответствует выбранному действию. Сохранённое решение приводит к refreshed detail/inbox, причина возврата появляется у Worker MP-12.

**Состояния/переходы:** allowed/read-only, validation, pending, accepted, 403 after capability change, stale status, ambiguous timeout. Не повторять successful PATCH из-за failed reload. Unknown outcome показывает проверку результата прежнего решения.

**RBAC/различия:** capability от того же server policy, что write; app name Manager не даёт прав. Web/iOS используют адаптивный decision sheet/panel. Android current minimum не получает кнопку публикации в Customer. В web/iOS публикация после approval — отдельный MP-16, не side effect.

**Задачи:** V2-AND-02, V2-AND-08, V2-IOS-19, V2-WEB-12, V2-ARCH-07, V2-CON-01. **AC:** отказ не становится success; note сохранена; два taps не создают два решения; approval не публикует фото автоматически.

### MP-16. Публикация — выбранные источники для конкретной аудитории

**G07 · Web wide.** Иерархия: audience/project → пригодные sources и текущая version → выбранный набор → preview того, что увидит Customer → явное действие публикации/отзыва → server state. По умолчанию не выбирать новый набор за пользователя.

**Ввод/действие:** выбрать разрешённые items, проверить preview, «Опубликовать выбранное». Уже опубликованный набор показывает version и отдельное «Отозвать публикацию». Empty selection объясняется до submit. Изменение approval и публикация остаются разными actions.

**Состояния/переходы:** unpublished, selection, pending, published, conflict expected_version, source unavailable/stale, revoked. Conflict перечитывает актуальный состав и не перезаписывает его молча. Authorized Customer read открывает соответствующий MP-17.

**RBAC/различия:** server publication capability и safe source resolver. Web/iOS Manager имеют существующий workflow; Android publication не добавляется. Original открывается через согласованный защищённый gateway, не raw storage link.

**Задачи:** V2-IOS-19, V2-IOS-26, V2-WEB-12, V2-WEB-23, V2-WEB-31, V2-CON-03, V2-ARCH-07. **AC:** только выбранное доступно Customer; stale version получает явный conflict; revoke закрывает последующий разрешаемый read, не обещает удалить внешние скачанные копии.

### MP-17. Customer project — разрешённый контекст и следующий ответ

**G08 · iOS portrait.** Иерархия: проект → ожидающие разрешённые ответы → опубликованные фото/документы/сметы → доступные milestones и история → контекст помощи/профиля. Internal diagnostics и contractor finance отсутствуют во всём read model.

**Действие/ввод:** открыть документ MP-18, смету MP-19, опубликованное фото; «Все»/continuation доступно за пределами первой группы. Project selection сохраняет scope, Back — позицию. Read-only actor получает просмотр, а не неработающие CTA ответа.

**Состояния/переходы:** no projects, ready, pending response, empty published section, partial section failure, revoked membership, item removed. Один denied preview не стирает разрешённые соседние сведения. Не показывать неизвестную готовность проекта как 0% или 100%.

**RBAC/различия:** stakeholder/customer-safe projection; internal preview отдельно обозначен и не определяет реальные права Customer. Web portal имеет собственные разрешённые navigation/logout/help; native не получает новый Messages tab без workflow. Android Customer отсутствует в scope.

**Задачи:** V2-IOS-24, V2-IOS-26, V2-WEB-10, V2-WEB-23, V2-ARCH-06, V2-ARCH-07. **AC:** девятый документ и десятое фото доступны через явный путь; нет internal routes; revoked последующий read закрыт; полнота соответствует server continuation.

### MP-18. Документ заказчика — содержание конкретной версии

**G08 · Web wide.** Иерархия: документ/проект → version и статус запроса → инструкция/срок, если заданы → readable content → связанные разрешённые источники → «Ответить». Viewer не подменяется одной строкой названия документа.

**Ввод/действие:** чтение/навигация по содержанию; open authorized original; переход MP-20 с request/source/version. Комментарий вводится в форме ответа. Не вводить фиктивную галочку, которая якобы доказывает чтение всего файла.

**Состояния/переходы:** content loading, ready, unsupported preview, download permitted, denied, stale/new revision, request expired, read-only. Если safe content/version endpoint не подтверждён, дизайн показывает понятный unavailable/retry и помечает интеграцию BLOCKED_CONTRACT в аннотации, не в пользовательском тексте.

**RBAC/различия:** Customer request и project-owner document approval — разные права/flows. Tenant admin не получает project-owner action по названию роли. iOS использует native preview/detail; Android counterpart не проектируется.

**Задачи:** V2-IOS-25, V2-WEB-09, V2-WEB-23, V2-WEB-24, V2-ARCH-04, V2-ARCH-07. **AC:** response связан с показанной версией; при изменении состава старое согласие не применяется; разрешённое содержание доступно до решения.

### MP-19. Смета заказчика — состав, сумма и условия версии

**G08 · iOS portrait.** Иерархия: название/версия сметы → customer-visible total и currency → разрешённый состав/description → customer note, validity/due date при наличии → понятное действие ответа. Исходник суммы и версия относятся к одному документу.

**Действие/ввод:** «Ответить по смете» открывает MP-20; open related permitted document ведёт MP-18. Редактирование цены, internal budget или маржи заказчику не предлагается. Missing optional note/date не мешает показать остальное.

**Состояния/переходы:** sent/current, expired, responded, revised, readonly, incomplete safe content, network error. При отсутствии допустимой суммы показывается unavailable, а не 0. Не смешивать валюты в единую вымышленную сумму.

**RBAC/различия:** response доступен только для разрешённого actor и actionMode. Web — wider composition/readable sidebar; mobile — сумма/валюта и версия видны до CTA, без плотной desktop-таблицы. Срок и правила берутся из source, не генерируются моделью.

**Задачи:** V2-IOS-25, V2-WEB-23, V2-WEB-24, V2-WEB-17, V2-ARCH-04, V2-ARCH-07. **AC:** пользователь видит существующие description/note/expiry до ответа; internal finances не появляются даже в annotation fixture payload; новая версия требует нового просмотра.

### MP-20. Ответ заказчика — выбранное действие по известной версии

**G08 · Web compact.** Иерархия: краткий безопасный контекст source/version → доступное действие → комментарий/выбор, когда предусмотрен → финальное подтверждение смысла → primary CTA → подтверждённый результат. Estimate response и decision request используют свои существующие API, а не новый общий write endpoint.

**Ввод/действие:** разрешённые approve/reject/document review/feedback/acknowledge/choice варианты отображаются по actionMode/capability. Choice options приходят с запросом. Primary label отражает фактическое согласование/ответ; не использовать универсальное «Готово» с неясным последствием.

**Состояния/переходы:** ready, invalid required comment/choice, sending, confirmed, stale revision, access changed, outcome unknown, offline. Offline сохраняет собственный ввод; автоматическое юридически значимое согласие без принятого version/idempotency contract не обещается. Stale ведёт назад в MP-18/19 с сохранённым комментарием, но требует нового осознанного действия.

**RBAC/различия:** server actor/source/version gate; readonly получает объяснение. iOS native form/confirmation сохраняет тот же смысл. После success MP-17 и Manager follow-up получают canonical result.

**Задачи:** V2-IOS-25, V2-WEB-23, V2-WEB-24, V2-ARCH-04, V2-ARCH-07. **AC:** комментарий не теряется при error; старый response не относится к новой цене; повтор сначала проверяет принятое решение; deny не выглядит успешным ответом.

### MP-21. Settings — реальные настройки и собственная работа

**G09 · iOS portrait.** Иерархия: identity/организация/роль → язык и display settings → реальные camera/data-saver/notification effects → sync controls → безопасная диагностика/помощь → выход. App toggle и OS permission отображаются раздельно.

**Действие/ввод:** изменить существующую настройку, открыть системные Settings при необходимости, явные Pause/Resume sync, refresh отдельно, logout. Если есть собственная неотправленная работа, объяснить принятую retention policy перед выходом; не обещать восстановление, пока оно не реализовано.

**Состояния/переходы:** saved/failed preference, OS denied, waiting return, paused/running queue, expired session, pending work at logout. После выхода old-account queue не выполняется под новым пользователем. Help — MP-22; recovery — MP-23.

**RBAC/различия:** настройки текущего app/owner; никакого tenant-role editing из профиля Worker. Android показывает только работающие preferences. Web billing/security остаются отдельными разрешёнными областями, не меняются mobile settings-макетом.

**Задачи:** V2-IOS-02, V2-IOS-13, V2-IOS-28, V2-IOS-29, V2-AND-01, V2-AND-10, V2-WEB-28. **AC:** label совпадает с эффектом; notification toggle не обещает permission; logout не показывает A данные B; diagnostics не содержит tokens/media URLs.

### MP-22. Контекстная помощь — следующий поддерживаемый шаг

**G09 · Android portrait.** Иерархия: текущая задача/проблема → короткая инструкция для роли и платформы → подходящее существующее действие → safe diagnostics/support при необходимости. Guide вторичен по отношению к основному job и может сворачиваться.

**Действие/ввод:** выбрать проблему, открыть собственную очередь/отчёт/вход, прочитать статью; «Сообщить о проблеме» передаёт безопасный context в разрешённый support path. Не рисовать action из непроверенного arbitrary href. Step count соответствует реально видимым достижимым действиям.

**Состояния/переходы:** local help ready, optional server hint loading/error, collapsed guide, unsupported suggestion, wrong role context. Ошибка help не блокирует MP-07/13. Heuristic score не подписывается «Уверенность ИИ».

**RBAC/различия:** Worker guide не предлагает Manager task/team creation. Android не получает отсутствующие native routes. iOS/web адаптация сохраняет свой action router и audience; portal-only получает безопасный support/документацию.

**Задачи:** V2-AND-11, V2-IOS-28, V2-PUB-07, V2-WEB-28, V2-ARCH-01, V2-ARCH-07. **AC:** каждый CTA приводит в разрешённый текущий экран; fallback локальный и полезный; нет нового LLM как обязательной зависимости помощи.

### MP-23. Ошибка и восстановление — сохранить контекст

**G09 · Web compact, reusable local panel/native adaptation.** Иерархия: что не завершилось → что сохранено/что известно → одно безопасное действие → secondary Back/help. Это библиотека контекстных error-panel states, а не один глобальный экран для каждого отказа.

**Действие/ввод:** Retry чтения, восстановить вход, перечитать версию, открыть сохранённый draft, вернуться к исходному фильтру. Ввод новой конфиденциальной информации не требуется. Технический request ID доступен в безопасных деталях только при наличии.

**Состояния/переходы:** network, 401, 403/revoke, 404, 409/version conflict, 429/retry later, 5xx, storage full, unknown mutation result, partial success. Для conflict/unknown не предлагать безусловный повтор записи. Abort/Back не отмечать как серверную ошибку.

**RBAC/различия:** ошибка не расширяет права; приватное содержимое не остаётся в denied panel. Native использует подходящий inline/banner/sheet и возврат фокуса. Partial failure одного виджета оставляет другие разрешённые блоки.

**Задачи:** V2-ARCH-02, V2-CON-01, V2-WEB-07, V2-WEB-19, V2-IOS-07, V2-IOS-29, V2-AND-10. **AC:** пользователь понимает, потерян ли ввод и что безопасно повторить; нет catch→empty success; recovery возвращает ту же identity/query, не случайный Home.

## 5. Общая матрица состояний

Технические ключи ниже — для annotations/state contracts. Пользователь видит короткий обычный текст. В прототипе состояния переключаются синтетическими fixtures; их наличие не доказывает обработку backend.

| Ключ | Когда применяется | Что человек видит | Допустимый следующий шаг | Обязательная сохранность |
|---|---|---|---|---|
| S01 Loading | Первое чтение/identity | Что загружается; структурный placeholder без fake values | Back; retry после failure | next, role/project context |
| S02 Empty | Успешно получен пустой scope | Почему здесь пока нет данных | Разрешённое create/refresh/help | scope/filter |
| S03 No results | Фильтр не нашёл записи | Активные условия и «Сбросить» | Очистить filter | остальные выбранные параметры |
| S04 Refresh failed | Старые разрешённые данные есть | Сохранённый список и время; обновление не удалось | Повторить чтение | старые records того же owner |
| S05 Offline cached | Сеть недоступна, own cache есть | Доступный локальный scope и свежесть | Продолжить разрешённый local draft | owner, local files, cursor namespace |
| S06 Local save failed | Недостаточно места/ошибка записи | Ввод ещё не сохранён | Освободить место/повторить/осознанно отменить | текущий ввод, исходное фото |
| S07 Queued | Намерение сохранено, не принято сервером | «Ожидает отправки/сети» | Открыть draft; pause/resume по policy | тот же operation intent |
| S08 In progress | Upload/finalize/link/send | Реальный этап; число только при измеряемом progress | Дождаться; безопасная отмена разрешённого шага | revision и step result |
| S09 Confirmed | Авторитетный server outcome получен | Конкретно что принято и следующий шаг | Обновлённый detail/inbox | server ID/version/result |
| S10 Outcome unknown | Ответ потерян после возможной записи | «Проверяем, сохранился ли результат» | Reconcile прежнюю операцию | note, media, logical identity |
| S11 Needs auth | Token expired/invalid | «Войдите снова, чтобы продолжить» | MP-05, затем тот же owner context | собственный draft без replay чужой сессией |
| S12 Forbidden/revoked | Право отсутствует/отозвано | Действие недоступно; безопасная причина | Сменить допустимый context/help | только разрешённое политикой локальное состояние |
| S13 Not found | Сущность удалена/недоступна | Конкретный item не открыт | Назад к исходному списку | list filter/position |
| S14 Version conflict | Источник/решение изменились | «Версия изменилась» и новое содержание | Перечитать и решить заново | комментарий; прежнее согласие не переносится |
| S15 Permission denied | Camera/photos/notifications OS | Какое системное разрешение нужно | Альтернатива; Settings; Cancel | прежний ввод/выбранное фото |
| S16 Partial success | Create принят, upload/assign не завершён | Что уже создано и что осталось | Повторить только незавершённый шаг | принятый entity ID |
| S17 AI pending/absent | Нет usable результата | Реальный статус обработки/недостаточность данных | Смотреть evidence; retry если разрешён | source identity, отсутствие fake risk |
| S18 AI/source stale | Исходник обновлён после результата | Результат относится к прежней версии | Открыть источники/разрешённый re-analysis | version lineage и human review отдельно |
| S19 Read-only | Read разрешён, write нет | Содержание без misleading action | Читать/Back/help | customer-safe projection |
| S20 Cancel | Picker/provider/sheet закрыт | Возврат без ложного failure | Продолжить прежний экран | draft, focus, выбранный source |

Для primary control подготовить default/focus/pressed/loading/disabled; для destructive control — явное действие и последствие. Disabled причина доступна рядом, если пользователь может её устранить. Inline error связан с полем; state change объявляется доступным способом; после modal/preview focus возвращается к вызвавшему элементу.

## 6. Кликабельные прототипы

Все transitions используют синтетические данные и state fixtures. Никаких настоящих API writes, отправки обращений, provider calls или загрузки private media. Смена роли в сценарии выполняется test harness вне интерфейса продукта. Внутри каждого app сохраняются нативные navigation/back patterns; desktop/mobile адаптации — состояния того же frame contract.

### P1. Отчёт, потерянный ответ и исправление

| Шаг | Фрейм и состояние | Клик/событие | Ожидаемый наблюдаемый результат прототипа |
|---|---|---|---|
| 1 | MP-05 → MP-06 → MP-07 | Войти как synthetic Worker с assigned task | Правильная организация/задача; нет ручного повышения роли |
| 2 | MP-07 → MP-08 → MP-09 | Начать draft, ввести note, выбрать A, затем B до link | B в preview; старый callback A не меняет выбранное фото |
| 3 | MP-09 → MP-08 → MP-10 | Добавить требуемые proof, проверить состав | Тот же draft/note/media revision; unknown quantity не заполнена автоматически |
| 4 | MP-10 → MP-11 | «Отправить при подключении», затем восстановить сеть | Сначала local queued, затем реальный моделируемый этап; не раннее «Отправлено» |
| 5 | MP-11 S10 | Synthetic server accepted, client response lost, reopen | Сохранённый intent; проверка прежнего результата; один R-DEMO-01 |
| 6 | Test harness → MP-13 → MP-14 → MP-15 | Отдельная authorized Manager fixture; запросить правки с note | Manager видит B и worker note; причина возврата связана с прежним report |
| 7 | Test harness → MP-07 → MP-12 | Worker открывает собственный feedback/deep link | Причина видна, ввод исправления сохраняется, original evidence остаётся |
| 8 | MP-12 → MP-09 → MP-11 | Добавить correction C и отправить | C добавлено к R-DEMO-01; pending другой draft не исчезает |
| 9 | Test harness → MP-14 → MP-15 | Manager читает correction и утверждает | Approved подтверждён; фото ещё не опубликованы Customer |

**Обязательные ветки:** denied camera с gallery alternative; logout A→B при pending upload; recurring409 с остановленным повтором; status changed перед correction submit. Эти ветки показывают UX, не заменяют будущие crash/ownership/device тесты V2-CON-01/03, IOS-30, AND-13.

### P2. Публикация и ответ заказчика по версии

| Шаг | Фрейм | Клик/событие | Ожидаемый результат |
|---|---|---|---|
| 1 | MP-14 → MP-15 | Authorized Manager утверждает отчёт | Approval отдельно от публикации |
| 2 | MP-16 | Manager web/iOS выбирает разрешённый набор и публикует | Только выбранные источники, explicit audience и version |
| 3 | Test harness → MP-17 | Вход отдельного Customer actor | Customer-safe project; виден разрешённый набор, нет internal budget |
| 4 | MP-17 → MP-18 → MP-20 | Открыть документ и начать допустимый ответ | Видимая version связана с form; содержание доступно до решения |
| 5 | MP-20 S14 → MP-18 | Synthetic source revision changed до submit | Старое согласие не отправлено к новому документу; comment сохранён |
| 6 | MP-17 → MP-19 → MP-20 | Открыть sent estimate и подтвердить по актуальной версии | Видны safe total/currency/description; server-confirmed response |
| 7 | Test harness → MP-16; затем MP-17 | Отозвать publication, выполнить новый Customer read | Removed/denied state; старый preview обработан по policy |

**Ветки:** readonly Customer, wrong project, expired request, original denied, lost response. Отзыв не изображает удаление внешних ранее скачанных копий. Сценарий не добавляет publication в Android Manager и Customer в Android.

### P3. Enterprise или support без потери intent

MP-01 → MP-02 → MP-03: выбрать действующий Enterprise plan, заполнить шаг1, перейти к шагу2; focus начинает новый шаг, Back сохраняет поля. Смоделировать error submit, затем успешный результат с прежними intent/plan. Отдельная ветка MP-04 → MP-03 support: описать проблему существующего пользователя без анкеты нового пилота. Проверить клавиатурой все поля, error focus, язык/next, повтор и return.

Success в этом прототипе означает только смену fixture-state; факт приёма реального обращения проверяется отдельным разрешённым тестом PUB-05/06, не отправкой в рабочий канал во время дизайна.

## 7. Передача в Cursor

### Единица передачи

Для каждого принятого frame/state записать: design ID; фактические MagicPath project/component/revision IDs; platform/role; исходный `V2-*` ticket; primary action; input/validation; current/proposed content; empty/loading/error/offline/permission/conflict варианты; source/entity/version fields; allowed next/back; accessibility/i18n заметки; screenshot/reference provenance; список непроверенных backend/native предпосылок.

Вместо нового набора задач использовать 97-пакетный manifest. `detail_path` и `source_refs` ведут к текущим исходникам и полному платформенному заданию. Для backend-изменения один owner; native/web — consumers. MP IDs не заменяют canonical AIS/Phase IDs.

| Design slice | Cursor начинает с | Что должно существовать для функционального PASS |
|---|---|---|
| MP-01–04 | PUB-01–07, WEB-20/30 | Rendered public states; intent payload/readback, safe approved content |
| MP-05–06 | CON-02, ARCH-07, IOS-02/03, AND-01/02, WEB-05 | Identity/role/callback/owner fixtures; no-membership и deny behavior |
| MP-07–12 | ARCH-04, CON-01/03, IOS-04–14, AND-03–07 | Durable draft/media/outcome; apply-before-ACK; proof/day/revision contracts |
| MP-13, список отчётов | CON-04, IOS-19, AND-09, ARCH-06 | Complete scoped report list; continuation, filters и exact-or-loaded counts |
| MP-14–15, отдельный отчёт | IOS-19, AND-08, WEB-12, CON-03, ARCH-07 | All evidence; authoritative decision/capability/readback |
| MP-16–20 | ARCH-07, CON-03, IOS-24–27, WEB-10/23/24/31 | Safe version/content, expected_version, publication/response/revoke proof |
| MP-14 AI state | ARCH-05, IOS-22, WEB-11 | Durable usable result/current source, lease/retry lifecycle; no job-success shortcut |
| MP-21–23 | ARCH-02, IOS-28/29, AND-10/11/12, WEB-19/28 | Реальные settings/recovery/router, a11y/locales/device permission behavior |

Сокращённые IDs в таблице обозначают существующий префикс `V2-`. Матрица показывает связанные срезы, а не требует реализовать весь диапазон до первой визуальной правки. Замороженный manifest определяет фактический порядок dependencies. CON-04 ограничен списком отчётов и его scoped counts: домашний экран Manager, проекты, задачи, Customer-коллекции и просмотр отдельного источника не получают общей блокирующей зависимости от этого контракта. Их собственные read-model изменения относятся к соответствующим платформенным срезам и ARCH-06.

### Условия завершения

**Design-ready:** все 23 frame contracts заполнены; controls имеют targets и состояния; 3 prototype сценария и ветки проходимы на synthetic fixtures; неясные контракты помечены в annotations; нет вымышленных бизнес/AI данных.

**Implementation-ready:** owner принял конкретные component revisions; Cursor видит точные source files и contract versions; приняты минимальные additive API изменения либо честные blocked states; rollback не уничтожает accepted data/drafts.

**Verified:** выполнены соответствующие targeted tests на production types и current SHA; сохранность/offline/permissions/push проверены на нужных native устройствах; web responsive/focus/contrast проверены после сборки CSS. Prototype transition не отмечается как эти тесты.

**Released:** отдельный release manifest с build/schema/environment/runtime evidence и разрешёнными gates. Готовый MagicPath canvas не авторизует code merge, DB migration, store submission или deployment.

## 8. Полный prompt для будущего выполнения в MagicPath

Следующий текст готов к передаче дизайнеру/ассистенту, когда для AISTROYKA будет отдельно назначен или разрешён canvas. Он ссылается на полный frame contract выше; передавать prompt вместе с настоящим документом и принятой копией consolidated manifest, не только последнюю страницу.

```text
Задача: подготовить дизайн-предложение AISTROYKA по приложенному
AISTROYKA_V2_MagicPath_Design_Brief_RU.md и замороженному V2 manifest.
Нужны 23 основных фрейма MP-01–MP-23, 9 семейств G01–G09,
общие component states и 3 кликабельных synthetic сценария P1–P3.
Не писать продуктовый код и не выполнять реальные бизнес-операции.

PHASE 0 — контекст и права на canvas
Используй актуальный MagicPath skill и production MCP integration.
Проверь, какой AISTROYKA projectId явно назначен для этой работы.
Если есть подтверждённый контекст того же canvas — переиспользуй его,
не открывай заново для каждого действия. Сохраняй точные componentId,
revisionId и targets. Не заменяй pinned revision молча новой.
В исходном аудите AISTROYKA canvas не был найден, active=[];
проект и numeric IDs считать неизвестными, пока нет нового подтверждения.
Если canvas не назначен и создание не поручено — верни BLOCKED_CANVAS
для внешней генерации и готовую структуру локального brief, без создания.
Если создание нового проекта отдельно поручено — сначала create и open
возвращённого projectId, затем design generation. Не используй beta CLI,
локальные .magicpath shortcuts или фиктивные project links.

PHASE 1 — исходная правда, структура и tokens
Отметь target как DESIGN PROPOSAL. Closed web/native before frames UNKNOWN.
Не воссоздавай их как якобы увиденные screenshots. Исторические PNG не
считай свежим native proof. Synthetic fixture values помечай в annotations.
Сохрани отдельные iOS Worker/Manager/Customer и Android Worker/Manager.
Android Customer, social/QR/camera extras и Manager publication/full AI
не добавляй в текущий Android minimum.
Сохрани dark/yellow AISTROYKA, existing V4.1/V4.3/Canon direction/assets.
Public tokens: #030b16 background, #09182a surface, #eef4ff text,
#ffc400 accent, #ffe36a hover. App tokens: #040a18 background,
#101b33 surface, #f8fbff text, #F5C518 accent, #050b1c inverse text.
Это исходная палитра, не доказательство contrast PASS.
Первый вариант строится на existing native/web components и semantics.
Не вводи glass/decoration, мешающие чтению поля, action и source evidence.

PHASE 2 — ровно 23 основных frame contracts
MP-01 Public Home: отдельные hero copy/image области; pilot intent,
        platform anchor, pricing и login имеют действующие цели.
MP-02 Pricing: 4 catalog plans, feature+4plan comparison; сохранять plan/next.
MP-03 Contact: один intent-aware двухшаговый flow, input/focus/Back/retry.
MP-04 Support/docs: помощь существующему пользователю, 7 article links,
        safe context, отдельный support intent без обязательного пилота.
MP-05 Auth: проверенные методы своей платформы, recovery/cancel/next.
MP-06 Bootstrap/role: identity, tenant, invite/no-access/wrong-app/ready;
        никаких ручных role grants и auto-tenant из read helper.
MP-07 Worker Today: current task/resume draft/feedback прежде optional guide;
        честная shift identity и cached freshness.
MP-08 Draft: один owner/task-bound aggregate, note, допустимые requirements,
        unknown quantities, media slots, durable save state.
MP-09 Photo: real selected preview, local revision, permission/cancel/storage;
        linked original не удаляется мнимым replace.
MP-10 Review: тот же draft/revision, Edit возвращает в него;
        queued не называется submitted.
MP-11 Outbox: сохранено/ждёт сети/загрузка/прикрепление/проверка результата/
        auth/denied/confirmed; безопасный retry прежнего intent.
MP-12 Correction: тот же reportId, manager reason, original+new evidence;
        existing valid proof может позволять note-only correction.
MP-13 Manager Inbox: разрешённый All/Project/Unassigned, status/search,
        pagination и exact-or-loaded counts, preserved Back.
MP-14 Evidence: worker note, все sources, active fullscreen, honest AI state;
        Before/After только по сохранённой семантике, URL не identity.
MP-15 Decision: authoritative capability; reject/changes require note;
        pending/timeout/denied/readback; approval не публикует автоматически.
MP-16 Publication: web/iOS explicit audience, selected sources, version,
        expected_version conflict, publish/revoke; Android не расширять.
MP-17 Customer Project: safe full/continued collections и next response;
        никаких contractor budgets, внутренних routes или raw storage IDs.
MP-18 Document Version: разрешённое читаемое содержание конкретной версии
        до response; missing safe contract — annotated blocked integration.
MP-19 Estimate Version: safe amount/currency/composition/note/expiry;
        никаких invented totals/internal cost/margin.
MP-20 Customer Response: допустимый mode/options/comment, явный смысл,
        version conflict, timeout reconciliation и сохранённый ввод.
MP-21 Settings: реальные preference effects, OS permission отдельно,
        Pause/Resume отдельно от Refresh, scoped logout и safe diagnostics.
MP-22 Context Help: роль+платформа+текущий job, только supported actions,
        collapsible/local fallback, никаких fake AI confidence percentages.
MP-23 Error/Recovery: contextual inline/panel states 401/403/404/409/429/5xx,
        offline/partial/outcome unknown, сохранность ввода и safe next.
Для каждого следуй hierarchy/content/action/input/states/transitions/RBAC/
platform differences/task IDs/AC из полного brief. Не сокращай его до картинок.
Mobile/desktop и error variants — состояния соответствующих компонентов.
Если нужны дополнительные физические frame copies, отдельно перечисли их
и честно сообщи фактическое число items; не меняй count23 незаметно.

PHASE 3 — состояния и данные
Реализуй S01–S20 из brief. Empty, no-results, denied и failed load различаются.
В UI обычные слова, implementation terms только в annotations.
Никаких 48/26mm defaults, fake probability/confidence, physical progress
из budget ratio, fictitious pricing/ROI/success claims.
Local save, queued, uploaded, linked и server-confirmed — разные состояния.
При lost response сначала проверяется результат прежнего intent.
При logout A→B не показывай A cache и не отправляй A работу токеном B.
Новая source revision делает нужный derived result stale; human review отдельно.
Permission cancel не ошибка; focus возвращается; большой текст не закрывает CTA.
RU основной текст; заложи EN/ES/IT, длинные строки, dates/currencies/units.

PHASE 4 — click prototype
P1: Worker auth→Today→draft→photo A заменить B→review→offline queue→
lost response/reopen→same report→отдельная Manager fixture→changes requested→
Worker correction C того же report→Manager approved, без автопубликации.
P2: отдельная authorized Manager web/iOS fixture→explicit publish→
Customer project→document current version→stale response conflict→
new version review→estimate response confirmed→revoke→new read denied.
P3: Public pricing enterprise→intent form step1/2→Back→error→retry→
confirmation with same plan/intent; support branch без анкеты нового пилота.
Смена synthetic actor делается harness вне продукта, не кнопкой выдачи ролей.
Никаких реальных API writes, lead/support sends, uploads или provider calls.
Каждый CTA, Back, Cancel и error recovery имеет проверяемый target.

PHASE 5 — handoff и границы доказательств
Для каждого принятого frame сохрани реальные project/component/revision IDs,
frame ID, roles/platform, V2 ticket IDs, fields/source/version, interaction map,
states, accessibility/i18n requirements, assumptions и blocked contracts.
Используй consolidated manifest как единственный execution order для Cursor.
Backend owners: CON-01 durable outcome, CON-02 Worker identity/allow-list,
CON-03 media/revision/correction, CON-04 paged Manager report lists/counts;
ARCH-04 owns shared task/day/proof/sync schema, ARCH-05 AI retained completion,
ARCH-07 audience/permissions. Клиенты являются consumers, не вторыми backend.
CON-04 не блокирует home/projects/tasks/Customer collections или single viewer;
у прочих коллекций отдельные domain read-model contracts в ARCH-06.
Conditional server help не нужен, если честной локальной помощи достаточно.
Отдели Design-ready, Implementation-ready, Verified и Released.
MagicPath prototype не доказывает SwiftUI/Compose runtime, process-death safety,
camera/permissions/push delivery, backend RBAC или real provider quality.
Для этого Cursor выполняет targeted production-type/contract/device tests
на актуальном SHA. Не объявляй native UX PASS без нового native rendering.
Не выполняй code edits, PR/merge, deploy, migration, store upload из этой задачи.
В финале перечисли созданные реальные frame/revision IDs, пути P1–P3,
проверенные interactions и оставшиеся UNKNOWN/BLOCKED, без вымышленных PASS.
```

## 9. Критерии приёмки самого brief

В задании 23 frame IDs и 9 семейств; каждый содержит hierarchy, action/input, states/transitions, RBAC, platform differences, task IDs и AC. Приведены S01–S20, три сквозных пути и контрактные границы Cursor. Все новые UI/структурные решения обозначены PROPOSAL; закрытые/native before UNKNOWN; внешнее создание canvas и runtime-проверки не заявлены выполненными.

При последующем изменении manifest/контрактов обновлять затронутые frame annotations и acceptance, сохраняя исходный decision trail. Не переносить старый prototype PASS на новый source/build только потому, что визуальное изображение выглядит одинаково.
