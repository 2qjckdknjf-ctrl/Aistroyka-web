#!/usr/bin/env node
/**
 * List DNS records for zone aistroyka.ai (before/after snapshot).
 * Requires: CLOUDFLARE_API_TOKEN with Zone:Read.
 * Usage: CLOUDFLARE_API_TOKEN=xxx node apps/web/scripts/cf-dns-list-aistroyka.mjs
 */
const API = "https://api.cloudflare.com/client/v4";
const ZONE_NAME = "aistroyka.ai";

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!token) {
  console.error("Set CLOUDFLARE_API_TOKEN to list DNS records.");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function main() {
  const zonesRes = await fetch(`${API}/zones?name=${ZONE_NAME}`, { headers });
  if (!zonesRes.ok) {
    console.error("Zones API error:", zonesRes.status, await zonesRes.text());
    process.exit(1);
  }
  const { result: zones } = await zonesRes.json();
  if (!zones?.length) {
    console.error(`Zone ${ZONE_NAME} not found.`);
    process.exit(1);
  }
  const zoneId = zones[0].id;
  const listRes = await fetch(`${API}/zones/${zoneId}/dns_records`, { headers });
  if (!listRes.ok) {
    console.error("DNS list error:", listRes.status, await listRes.text());
    process.exit(1);
  }
  const list = (await listRes.json()).result || [];
  console.log("Type\tName\tContent\tProxy\tTTL");
  for (const r of list) {
    console.log(`${r.type}\t${r.name}\t${r.content}\t${r.proxied ?? false}\t${r.ttl}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
