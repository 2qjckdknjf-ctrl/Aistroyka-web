/**
 * Inference retention declaration (Codex/Cursor delta 2026-11-24 D3a).
 * Operator must declare how provider inference is retained. Vendor ZDR proof
 * remains OWNER_GATE — this module only enforces an explicit declaration gate.
 */

export type InferenceRetentionMode =
  | "undeclared"
  | "ephemeral_no_train_declared"
  | "zero_retention_declared"
  | "blocked";

const ALLOWED: ReadonlySet<string> = new Set([
  "undeclared",
  "ephemeral_no_train_declared",
  "zero_retention_declared",
  "blocked",
]);

export function getInferenceRetentionMode(
  env: NodeJS.ProcessEnv = process.env
): InferenceRetentionMode {
  const raw = (env.AI_INFERENCE_RETENTION_MODE ?? "").trim().toLowerCase();
  if (!raw) return "undeclared";
  if (!ALLOWED.has(raw)) return "undeclared";
  return raw as InferenceRetentionMode;
}

export function requireRetentionDeclaration(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const raw = (env.AI_REQUIRE_RETENTION_DECLARATION ?? "").trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

/**
 * When strict mode is on, only explicit non-undeclared / non-blocked modes allow egress.
 * Default (strict off): undeclared still allows — records observability via rule hit only.
 */
export function retentionBlocksEgress(
  mode: InferenceRetentionMode = getInferenceRetentionMode(),
  strict: boolean = requireRetentionDeclaration()
): boolean {
  if (mode === "blocked") return true;
  if (!strict) return false;
  return mode === "undeclared";
}

export function retentionRuleHit(mode: InferenceRetentionMode = getInferenceRetentionMode()): string {
  return `retention_mode:${mode}`;
}
