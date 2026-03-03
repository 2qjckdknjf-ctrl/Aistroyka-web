# Настройка DNS и имён серверов для aistroyka.ai

Чтобы сайт открывался по **https://aistroyka.ai** и **https://www.aistroyka.ai**, нужно:

1. Зона **aistroyka.ai** в Cloudflare (уже есть, раз деплой с маршрутами прошёл).
2. В зоне — DNS-записи для корня и www (скрипт ниже).
3. У регистратора домена — NS направлены на Cloudflare (вручную).

---

## 1. Записи DNS в Cloudflare (скрипт)

Токен должен иметь права **Zone: Read** и **Zone: Edit** (или **Edit zone DNS**).

```bash
cd apps/web
# Положи в .env.cf строку: CLOUDFLARE_API_TOKEN=твой_токен
npm run cf:dns-setup
```

Скрипт создаёт, если их ещё нет:

- **A** для корня (`@`) → 192.0.2.1, proxied
- **CNAME** для `www` → aistroyka.ai, proxied

В выводе скрипта будут **nameservers** зоны — они нужны для шага 2.

---

## 2. Имена серверов (NS) у регистратора

Пока у домена у регистратора стоят не Cloudflare’овские NS, мир будет ходить в старый DNS и домен не откроется.

1. Зайди в панель, где куплен домен (Reg.ru, Namecheap, nic.ru, Cloudflare Registrar и т.п.).
2. Найди настройки **aistroyka.ai** → **DNS** / **Nameservers** / **Делегирование**.
3. Смени NS на те, что показал скрипт (или смотри в Cloudflare: **Websites** → **aistroyka.ai** → **DNS** → вверху блок **Nameservers**). Обычно что-то вроде:
   - `ada.ns.cloudflare.com`
   - `bob.ns.cloudflare.com`
4. Сохрани. Распространение NS — от нескольких минут до 24–48 часов (часто 15–30 минут).

После смены NS запросы к aistroyka.ai и www.aistroyka.ai пойдут в Cloudflare, подхватятся маршруты Worker’а — сайт начнёт открываться.

---

## 3. Проверка

```bash
host aistroyka.ai
host www.aistroyka.ai
```

Когда NS обновятся, должны вернуться адреса Cloudflare (или CNAME для www). Затем открой в браузере:

- https://aistroyka.ai  
- https://www.aistroyka.ai  

---

## Если зоны aistroyka.ai ещё нет в Cloudflare

Тогда скрипт напишет: «Зона не найдена». Сначала добавь сайт:

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Websites** → **Add a site**.
2. Введи **aistroyka.ai** → выбери тариф → следуй шагам.
3. Cloudflare покажет два NS — их и пропиши у регистратора (шаг 2 выше).
4. После добавления зоны запусти снова: `npm run cf:dns-setup`.
