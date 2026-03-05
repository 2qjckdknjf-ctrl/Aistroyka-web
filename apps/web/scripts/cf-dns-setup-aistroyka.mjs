#!/usr/bin/env node
/**
 * Создаёт в зоне aistroyka.ai DNS-записи для корня и www (если их ещё нет).
 * Требует: CLOUDFLARE_API_TOKEN с правами Zone:Read, Zone:Edit (DNS).
 * Запуск: npm run cf:dns-setup (или CLOUDFLARE_API_TOKEN=xxx node scripts/cf-dns-setup-aistroyka.mjs)
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
  console.error("Задайте CLOUDFLARE_API_TOKEN в env или в файле .env.cf (не коммитить!)");
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
    console.error(`Зона ${ZONE_NAME} не найдена. Добавьте сайт в Cloudflare Dashboard → Add a site.`);
    process.exit(1);
  }
  const zone = zonesData.result[0];
  const zoneId = zone.id;
  const nameServers = zone.name_servers || [];
  console.log("Zone ID:", zoneId);
  if (nameServers.length) {
    console.log("Nameservers (пропишите их у регистратора домена):");
    nameServers.forEach((ns) => console.log(" ", ns));
  }

  const listRes = await fetch(`${API}/zones/${zoneId}/dns_records`, { headers });
  if (!listRes.ok) {
    console.error("DNS list error:", listRes.status, await listRes.text());
    process.exit(1);
  }
  const list = (await listRes.json()).result || [];
  const hasApex = list.some((r) => r.type === "A" && (r.name === ZONE_NAME || r.name === "@" || r.name === ""));
  const hasWww = list.some((r) => r.type === "CNAME" && (r.name === "www." + ZONE_NAME || r.name === "www"));

  if (!hasApex) {
    const create = await fetch(`${API}/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "A",
        name: "@",
        content: "192.0.2.1",
        proxied: true,
        ttl: 1,
      }),
    });
    if (!create.ok) {
      console.error("Create A @ error:", create.status, await create.text());
      process.exit(1);
    }
    console.log("Создана запись: A @ → 192.0.2.1 (proxied)");
  } else {
    console.log("Запись A для корня уже есть.");
  }

  if (!hasWww) {
    const create = await fetch(`${API}/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "CNAME",
        name: "www",
        content: ZONE_NAME,
        proxied: true,
        ttl: 1,
      }),
    });
    if (!create.ok) {
      console.error("Create CNAME www error:", create.status, await create.text());
      process.exit(1);
    }
    console.log("Создана запись: CNAME www →", ZONE_NAME, "(proxied)");
  } else {
    console.log("Запись CNAME www уже есть.");
  }

  const stagingTarget = process.env.STAGING_CNAME_TARGET?.trim();
  const hasStaging = list.some(
    (r) => r.type === "CNAME" && (r.name === "staging" || r.name === "staging." + ZONE_NAME)
  );
  if (!hasStaging) {
    if (stagingTarget) {
      const create = await fetch(`${API}/zones/${zoneId}/dns_records`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "CNAME",
          name: "staging",
          content: stagingTarget,
          proxied: true,
          ttl: 1,
        }),
      });
      if (!create.ok) {
        console.error("Create CNAME staging error:", create.status, await create.text());
        process.exit(1);
      }
      console.log("Создана запись: CNAME staging →", stagingTarget, "(proxied)");
    } else {
      console.log(
        "\nStaging: запись CNAME staging не найдена. Добавьте custom domain staging.aistroyka.ai в Worker aistroyka-web-staging (Dashboard), либо задайте STAGING_CNAME_TARGET и перезапустите скрипт."
      );
    }
  } else {
    console.log("Запись CNAME staging уже есть.");
  }

  console.log("\nГотово. Если домен ещё не открывается — смените NS у регистратора на указанные выше.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
