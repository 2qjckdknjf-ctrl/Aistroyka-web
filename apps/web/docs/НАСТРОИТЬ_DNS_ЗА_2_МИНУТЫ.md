# Настроить DNS для aistroyka.ai за 2 минуты (вручную)

Сделай это в Cloudflare Dashboard — тогда **aistroyka.ai** начнёт открываться.

---

## Шаг 1

Открой: **https://dash.cloudflare.com** → войди в аккаунт.

---

## Шаг 2

Слева нажми **Websites** (Сайты) → в списке выбери **aistroyka.ai**.

(Если aistroyka.ai нет в списке — нажми **Add a site**, введи **aistroyka.ai**, пройди шаги и вернись сюда.)

---

## Шаг 3

Слева открой **DNS** → **Records** (или вкладка **DNS**).

---

## Шаг 4 — запись для корня (aistroyka.ai)

1. Нажми **Add record** (Добавить запись).
2. Заполни:
   - **Type:** `A`
   - **Name:** `@`
   - **IPv4 address:** `192.0.2.1`
   - **Proxy status:** включи (оранжевое облако **Proxied**).
3. Нажми **Save**.

---

## Шаг 5 — запись для www (www.aistroyka.ai)

1. Снова нажми **Add record**.
2. Заполни:
   - **Type:** `CNAME`
   - **Name:** `www`
   - **Target:** `aistroyka.ai`
   - **Proxy status:** включи (оранжевое облако **Proxied**).
3. Нажми **Save**.

---

## Шаг 6

Подожди 1–2 минуты и открой в браузере: **https://aistroyka.ai**.

Должен открыться сайт. Если всё ещё NXDOMAIN — убедись, что домен в статусе **Active** и что у домена в Cloudflare указаны те же Nameservers, что показываются в блоке Nameservers на этой странице.
