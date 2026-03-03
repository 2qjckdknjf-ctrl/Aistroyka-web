#!/usr/bin/env node
/**
 * Удаляет конфликтующие Worker Routes для aistroyka.ai в зоне, чтобы потом деплой мог привязать домен к aistroyka-web-production.
 * Требует: CLOUDFLARE_API_TOKEN (с правами Zone:Read, Workers Routes:Edit).
 * Запуск: CLOUDFLARE_API_TOKEN=xxx node scripts/cf-fix-domain-aistroyka.mjs
 */

const API = "https://api.cloudflare.com/client/v4";
const ZONE_NAME = "aistroyka.ai";

let token = process.env.CLOUDFLARE_API_TOKEN;
if (!token?.trim()) {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const envPath = path.join(process.cwd(), ".env.cf");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const m = content.match(/CLOUDFLARE_API_TOKEN\s*=\s*(\S+)/);
      if (m) token = m[1].trim();
    }
  } catch (_) {}
}
if (!token?.trim()) {
  console.error("Задайте CLOUDFLARE_API_TOKEN в env или в файле .env.cf в каталоге apps/web (не коммитить!)");
  console.error("Токен: Dashboard → My Profile → API Tokens → Create Token → шаблон Edit zone DNS + Workers Routes.");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function main() {
  const zonesRes = await fetch(`${API}/zones?name=${ZONE_NAME}`, { headers });
  if (!zonesRes.ok) {
    console.error("Zones API error:", zonesRes.status, await zonesRes.text());
    process.exit(1);
  }
  const zonesData = await zonesRes.json();
  if (!zonesData.result?.length) {
    console.error(`Зона ${ZONE_NAME} не найдена в аккаунте Cloudflare. Добавьте сайт aistroyka.ai в Dashboard.`);
    process.exit(1);
  }
  const zoneId = zonesData.result[0].id;
  console.log("Zone ID:", zoneId);

  const routesRes = await fetch(`${API}/zones/${zoneId}/workers/routes`, { headers });
  if (!routesRes.ok) {
    console.error("Routes API error:", routesRes.status, await routesRes.text());
    process.exit(1);
  }
  const routesData = await routesRes.json();
  const routes = routesData.result || [];
  const toRemove = routes.filter((r) => r.pattern?.includes("aistroyka.ai"));
  if (toRemove.length === 0) {
    console.log("Конфликтующих маршрутов нет. Можно деплоить: npm run cf:deploy:prod");
    return;
  }
  for (const route of toRemove) {
    const delRes = await fetch(`${API}/zones/${zoneId}/workers/routes/${route.id}`, {
      method: "DELETE",
      headers,
    });
    if (!delRes.ok) {
      console.error("Delete route error:", route.pattern, delRes.status, await delRes.text());
      process.exit(1);
    }
    console.log("Удалён маршрут:", route.pattern, "->", route.script || "(null)");
  }
  console.log("Готово. Запустите: npm run cf:deploy:prod");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
