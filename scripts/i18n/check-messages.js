#!/usr/bin/env node
/**
 * Verifies apps/web message bundles stay aligned with en.json.
 *
 * Default (recommended for CI): only namespaces touched by dashboard/onboarding flows —
 * `activation` and `dashboard` — must exist identically in ru/es/it (leaf keys).
 *
 * Full parity: I18N_CHECK_ALL=1 — compare entire locale trees (may flag legacy drift).
 */

const fs = require("fs");
const path = require("path");

const MESSAGES_DIR = path.join(__dirname, "../../apps/web/messages");
const SOURCE_LOCALE = "en";
const TARGET_LOCALES = ["ru", "es", "it"];

/** Namespaces required for dashboard + activation UX */
const DEFAULT_NAMESPACE_PREFIXES = ["activation.", "dashboard.", "dashboardDetail."];
const fullTreeCheck = process.env.I18N_CHECK_ALL === "1";

/**
 * @param {Record<string, unknown>} obj
 * @param {string} [prefix]
 */
function flattenKeys(obj, prefix = "") {
  /** @type {string[]} */
  const out = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flattenKeys(v, p));
    } else {
      out.push(p);
    }
  }
  return out;
}

/** @param {Set<string>} keys */
/** @param {string[]} prefixes */
function filterByPrefixes(keys, prefixes) {
  return [...keys].filter((k) => prefixes.some((pre) => k.startsWith(pre)));
}

/** @param {string} locale */
function loadLocale(locale) {
  const fp = path.join(MESSAGES_DIR, `${locale}.json`);
  const raw = fs.readFileSync(fp, "utf8");
  return JSON.parse(raw);
}

function main() {
  let exit = 0;
  const en = loadLocale(SOURCE_LOCALE);
  let enKeys = new Set(flattenKeys(en));
  let prefixes = DEFAULT_NAMESPACE_PREFIXES;

  if (!fullTreeCheck) {
    enKeys = new Set(filterByPrefixes(enKeys, prefixes));
    console.log(
      `[i18n] Checking namespaces: activation.*, dashboard.*, dashboardDetail.* (${enKeys.size} leaf keys in ${SOURCE_LOCALE}). Set I18N_CHECK_ALL=1 for full-tree parity.`,
    );
  } else {
    console.log(`[i18n] Full-tree parity (${enKeys.size} leaf keys in ${SOURCE_LOCALE}).`);
  }

  for (const locale of TARGET_LOCALES) {
    let data;
    try {
      data = loadLocale(locale);
    } catch (e) {
      console.error(`Failed to read or parse ${locale}.json:`, e);
      exit = 1;
      continue;
    }
    let locKeys = new Set(flattenKeys(data));
    if (!fullTreeCheck) {
      locKeys = new Set(filterByPrefixes(locKeys, prefixes));
    }

    for (const k of enKeys) {
      if (!locKeys.has(k)) {
        console.error(`[i18n] Missing in ${locale}.json (present in ${SOURCE_LOCALE}): ${k}`);
        exit = 1;
      }
    }
    for (const k of locKeys) {
      if (!enKeys.has(k)) {
        console.error(`[i18n] Extra in ${locale}.json (not in ${SOURCE_LOCALE}): ${k}`);
        exit = 1;
      }
    }
  }

  if (exit === 0) {
    console.log(`[i18n] OK: ${TARGET_LOCALES.join(", ")} match ${SOURCE_LOCALE}.json for checked namespaces.`);
  }

  process.exit(exit);
}

main();
