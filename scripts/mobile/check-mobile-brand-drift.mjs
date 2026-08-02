#!/usr/bin/env node
/**
 * Mobile brand drift gate — fails when feature UI uses raw system/feature colors
 * instead of BrandTokens / semantic wrappers.
 *
 * Self-test: node scripts/mobile/check-mobile-brand-drift.mjs --self-test
 * Allowlist: docs/design-system/mobile-raw-color-allowlist.md
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "../..");

const ALLOWLIST_PATHS = new Set([
  "ios/Shared/Sources/Shared/Design/BrandTokens.swift",
  "ios/Shared/Sources/Shared/Design/BrandPrimitives.swift",
  "ios/AiStroykaManager/AiStroykaManager/Design/ManagerSemanticColors.swift",
  "ios/AiStroykaWorker/AiStroykaWorker/WorkerSemanticColors.swift",
  "android/shared/src/main/java/ai/aistroyka/shared/design/BrandTokens.kt",
  "android/shared/src/main/java/ai/aistroyka/shared/design/BrandComponents.kt",
  "android/shared/src/main/java/ai/aistroyka/shared/design/BrandColors.kt",
  "android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/AiStroykaManagerTheme.kt",
  "android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/AiStroykaWorkerTheme.kt",
  "android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerSemanticColors.kt",
  "android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerSemanticColors.kt",
  "android/AiStroykaManager/src/main/res/values/colors.xml",
  "android/AiStroykaWorker/src/main/res/values/colors.xml",
  "android/AiStroykaManager/src/main/res/values/themes.xml",
  "android/AiStroykaWorker/src/main/res/values/themes.xml",
]);

/** Line-level allow patterns (platform-required; documented in allowlist). */
const LINE_ALLOW = [
  // Official Sign in with Apple control — style must be Apple's enum, not custom paint.
  /signInWithAppleButtonStyle\(\.(white|black|whiteOutline)\)/,
  /brandAppleSignInStyle\(\)/,
  /SignInWithAppleButton/,
];

export const IOS_BANNED = [
  /Color\(\.systemGroupedBackground\)/,
  /Color\(\.secondarySystemGroupedBackground\)/,
  /Color\(\.secondarySystemBackground\)/,
  /Color\(\.tertiarySystemBackground\)/,
  /Color\(\.tertiarySystemFill\)/,
  /Color\(\.systemBackground\)/,
  /Color\(\.systemGray\d*\)/,
  /Color\(\.systemFill\)/,
  /Color\.red\b/,
  /Color\.green\b/,
  /Color\.orange\b/,
  /Color\.blue\b/,
  /Color\.gray\b/,
  /Color\.white\b/,
  /Color\.black\b/,
  /Color\.primary\b/,
  /Color\.secondary\b/,
  /Color\.accentColor\b/,
  /\.foregroundStyle\(\.(red|green|orange|blue|gray|white|black|primary|secondary|tertiary)\)/,
  /\.foregroundColor\(\.(red|green|orange|blue|gray|white|black|primary|secondary|tertiary)\)/,
  // Ternary system colors: selected ? .white : .primary (not enum labels like variant: .primary)
  /\?\s*\.(white|primary|secondary|green|orange|red|blue|gray)\s*:\s*\.(white|primary|secondary|green|orange|red|blue|gray)\b/,
  // Bare Color returns in switch arms: return .green
  /return\s*\.(green|orange|red|blue|gray|white|primary|secondary)\b/,
  /Color\(red:\s*\d/,
];

export const ANDROID_BANNED = [
  /MaterialTheme\.colorScheme\./,
  /Color\(0x[0-9A-Fa-f]+\)/,
  /androidx\.compose\.ui\.graphics\.Color\(0x/,
];

/** Fixtures that MUST be rejected by the scanner (self-test). */
export const SELF_TEST_MUST_REJECT = [
  { id: "fgColor-green", line: 'Text("x").foregroundColor(.green)', platform: "ios" },
  { id: "fgColor-orange", line: 'Text("x").foregroundColor(.orange)', platform: "ios" },
  { id: "fgColor-secondary", line: 'Text("x").foregroundColor(.secondary)', platform: "ios" },
  { id: "fgStyle-orange", line: 'Text("x").foregroundStyle(.orange)', platform: "ios" },
  { id: "fgStyle-secondary", line: 'Text("x").foregroundStyle(.secondary)', platform: "ios" },
  { id: "fgStyle-primary", line: 'Text("x").foregroundStyle(.primary)', platform: "ios" },
  { id: "secondarySystemBackground", line: ".background(Color(.secondarySystemBackground))", platform: "ios" },
  { id: "tertiarySystemFill", line: ".background(Color(.tertiarySystemFill))", platform: "ios" },
  { id: "systemGrouped", line: ".background(Color(.systemGroupedBackground))", platform: "ios" },
  { id: "selected-white-primary", line: ".foregroundColor(selected ? .white : .primary)", platform: "ios" },
  { id: "return-green", line: "case .synced: return .green", platform: "ios" },
  { id: "ternary-green-secondary", line: ".foregroundColor(ok ? .green : .secondary)", platform: "ios" },
  { id: "Color-white", line: "let c = Color.white", platform: "ios" },
  { id: "material-scheme", line: "color = MaterialTheme.colorScheme.error", platform: "android" },
  { id: "raw-compose-color", line: "Color(0xFFF5C518)", platform: "android" },
];

/** Fixtures that MUST be allowed. */
export const SELF_TEST_MUST_ALLOW = [
  { id: "brand-fg", line: ".foregroundStyle(BrandTokens.textSecondary)", platform: "ios" },
  { id: "semantic-success", line: ".foregroundStyle(ManagerSemanticColors.success)", platform: "ios" },
  { id: "apple-white", line: ".signInWithAppleButtonStyle(.white)", platform: "ios" },
  { id: "apple-outline", line: ".signInWithAppleButtonStyle(.whiteOutline)", platform: "ios" },
  { id: "apple-brand-mod", line: ".brandAppleSignInStyle()", platform: "ios" },
  { id: "shared-brand-color", line: "color = BrandColors.error()", platform: "android" },
];

function lineHitsBanned(line, banned) {
  const trimmed = line.trim();
  if (trimmed.startsWith("//") || trimmed.startsWith("*")) return false;
  if (LINE_ALLOW.some((re) => re.test(line))) return false;
  return banned.some((re) => re.test(line));
}

export function scanLine(line, platform) {
  const banned = platform === "android" ? ANDROID_BANNED : IOS_BANNED;
  return lineHitsBanned(line, banned);
}

function walk(dir, pred, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "build" || e.name === ".build" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, pred, out);
    else if (pred(e.name)) out.push(p);
  }
  return out;
}

function isAllowlisted(rel) {
  if (ALLOWLIST_PATHS.has(rel)) return true;
  if (rel.endsWith("BrandTokens.swift") || rel.endsWith("BrandTokens.kt")) return true;
  if (rel.endsWith("BrandPrimitives.swift") || rel.endsWith("BrandComponents.kt")) return true;
  if (rel.endsWith("BrandColors.kt")) return true;
  // Legacy per-app brand forks removed; ignore if leftover empty dirs
  if (rel.includes("/ui/brand/BrandComponents.kt")) return true;
  return false;
}

function scanFile(abs, banned) {
  const rel = relative(ROOT, abs);
  if (isAllowlisted(rel)) return [];
  const lines = readFileSync(abs, "utf8").split(/\r?\n/);
  const hits = [];
  lines.forEach((line, idx) => {
    if (LINE_ALLOW.some((re) => re.test(line))) return;
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
    for (const re of banned) {
      if (re.test(line)) {
        hits.push({ rel, line: idx + 1, match: line.trim(), rule: String(re) });
        break;
      }
    }
  });
  return hits;
}

function runSelfTest() {
  const failures = [];
  for (const f of SELF_TEST_MUST_REJECT) {
    if (!scanLine(f.line, f.platform)) {
      failures.push(`MUST_REJECT missed: ${f.id} → ${f.line}`);
    }
  }
  for (const f of SELF_TEST_MUST_ALLOW) {
    if (scanLine(f.line, f.platform)) {
      failures.push(`MUST_ALLOW false-positive: ${f.id} → ${f.line}`);
    }
  }
  if (failures.length) {
    console.error("check-mobile-brand-drift self-test FAILED:\n");
    for (const x of failures) console.error(`  - ${x}`);
    process.exit(1);
  }
  console.log(`check-mobile-brand-drift self-test: PASS (${SELF_TEST_MUST_REJECT.length} reject + ${SELF_TEST_MUST_ALLOW.length} allow fixtures)`);
}

function scanSourceTree() {
  const hits = [];
  for (const f of walk(join(ROOT, "ios/AiStroykaManager"), (n) => n.endsWith(".swift"))) {
    hits.push(...scanFile(f, IOS_BANNED));
  }
  for (const f of walk(join(ROOT, "ios/AiStroykaWorker"), (n) => n.endsWith(".swift"))) {
    hits.push(...scanFile(f, IOS_BANNED));
  }
  for (const f of walk(join(ROOT, "ios/Shared/Sources"), (n) => n.endsWith(".swift"))) {
    hits.push(...scanFile(f, IOS_BANNED));
  }
  for (const f of walk(join(ROOT, "android/AiStroykaManager/src"), (n) => n.endsWith(".kt"))) {
    hits.push(...scanFile(f, ANDROID_BANNED));
  }
  for (const f of walk(join(ROOT, "android/AiStroykaWorker/src"), (n) => n.endsWith(".kt"))) {
    hits.push(...scanFile(f, ANDROID_BANNED));
  }
  for (const f of walk(join(ROOT, "android/shared/src"), (n) => n.endsWith(".kt"))) {
    hits.push(...scanFile(f, ANDROID_BANNED));
  }

  if (hits.length) {
    console.error("Mobile brand drift gate FAILED — raw/system colors in feature UI:\n");
    for (const h of hits) {
      console.error(`  ${h.rel}:${h.line}: ${h.match}`);
    }
    console.error("\nUse BrandTokens / ManagerSemanticColors / WorkerSemanticColors / BrandColors.");
    console.error("Allowlist: docs/design-system/mobile-raw-color-allowlist.md");
    process.exit(1);
  }
  console.log("check-mobile-brand-drift: PASS");
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    runSelfTest();
    return;
  }
  // Always run self-test first so a false PASS cannot skip fixture coverage.
  runSelfTest();
  scanSourceTree();
}

main();
