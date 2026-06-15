#!/usr/bin/env node
/**
 * Proxied DNS for aistroyka.com redirect zone (@ + www). Does NOT touch aistroyka.ai.
 * Requires CLOUDFLARE_API_TOKEN with Zone DNS Edit (see apps/web/.env.cf locally).
 */
const API = "https://api.cloudflare.com/client/v4";
const ZONE_NAME = "aistroyka.com";
const APEX_IP = "192.0.2.1";

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
  console.error("Set CLOUDFLARE_API_TOKEN or apps/web/.env.cf");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { headers, ...opts });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${path} non-JSON ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!data.success) {
    throw new Error(`${path} failed: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

function apexName(record) {
  return record.name === ZONE_NAME || record.name === "@" || record.name === "";
}

function wwwName(record) {
  return record.type === "CNAME" && (record.name === `www.${ZONE_NAME}` || record.name === "www");
}

async function main() {
  const zoneId =
    process.env.CLOUDFLARE_ZONE_ID_AISTROYKA_COM?.trim() ||
    (await api(`/zones?name=${ZONE_NAME}`)).result[0].id;

  console.log(`Zone ${ZONE_NAME}: id=${zoneId.slice(0, 4)}...${zoneId.slice(-4)}`);

  const list = (await api(`/zones/${zoneId}/dns_records?per_page=200`)).result || [];

  for (const r of list) {
    const prox = r.proxied ? "proxied" : "dns-only";
    console.log(`  ${r.type} ${r.name} -> ${r.content} [${prox}]`);
  }

  const apex = list.find((r) => r.type === "A" && apexName(r));
  const www = list.find(wwwName);

  if (!apex) {
    await api(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type: "A",
        name: "@",
        content: APEX_IP,
        proxied: true,
        ttl: 1,
      }),
    });
    console.log(`Created A @ -> ${APEX_IP} (proxied)`);
  } else if (!apex.proxied || apex.content !== APEX_IP) {
    await api(`/zones/${zoneId}/dns_records/${apex.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        type: "A",
        name: "@",
        content: APEX_IP,
        proxied: true,
        ttl: 1,
      }),
    });
    console.log(`Updated A @ -> ${APEX_IP} (proxied)`);
  } else {
    console.log("Apex A already proxied.");
  }

  if (!www) {
    await api(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type: "CNAME",
        name: "www",
        content: ZONE_NAME,
        proxied: true,
        ttl: 1,
      }),
    });
    console.log(`Created CNAME www -> ${ZONE_NAME} (proxied)`);
  } else if (!www.proxied || www.content !== ZONE_NAME) {
    await api(`/zones/${zoneId}/dns_records/${www.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        type: "CNAME",
        name: "www",
        content: ZONE_NAME,
        proxied: true,
        ttl: 1,
      }),
    });
    console.log(`Updated CNAME www -> ${ZONE_NAME} (proxied)`);
  } else {
    console.log("www CNAME already proxied.");
  }

  console.log("\nDNS ready for redirect Worker / Redirect Rules.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
