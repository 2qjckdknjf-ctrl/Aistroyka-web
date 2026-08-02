/**
 * Release identity helpers for health/deploy provenance.
 * Cloudflare Workers is canonical — do not treat Vercel commit SHA as Cloudflare runtime truth.
 */

export type BuildStampSource = "next_public" | "github_ci" | "none";

export type BuildStamp = {
  /** Full SHA when available (7–40 hex). Empty when absent. */
  sha: string;
  buildTime: string;
  source: BuildStampSource;
};

const SHA_RE = /^[a-f0-9]{7,40}$/i;

export function isValidBuildSha(sha: string): boolean {
  return SHA_RE.test(sha.trim());
}

/**
 * Resolve build stamp from env.
 * Preference: NEXT_PUBLIC_BUILD_SHA (Cloudflare/OpenNext canonical) → GITHUB_SHA only when CI=true.
 * VERCEL_GIT_COMMIT_SHA is intentionally ignored (non-canonical for this runtime).
 */
export function resolveBuildStamp(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): BuildStamp {
  const buildTime = (env.NEXT_PUBLIC_BUILD_TIME ?? "").trim();
  const nextPublic = (env.NEXT_PUBLIC_BUILD_SHA ?? "").trim();
  if (nextPublic) {
    return { sha: nextPublic, buildTime, source: "next_public" };
  }
  const ci = (env.CI ?? "").trim().toLowerCase();
  const inCi = ci === "1" || ci === "true" || ci === "yes";
  const github = (env.GITHUB_SHA ?? "").trim();
  if (inCi && github) {
    return { sha: github, buildTime, source: "github_ci" };
  }
  return { sha: "", buildTime, source: "none" };
}

export function toHealthBuildStamp(stamp: BuildStamp): {
  sha7: string;
  buildTime: string;
  sha?: string;
} | null {
  if (!stamp.sha || !isValidBuildSha(stamp.sha) || !stamp.buildTime) {
    return null;
  }
  const sha = stamp.sha.trim().toLowerCase();
  return {
    sha7: sha.slice(0, 7),
    buildTime: stamp.buildTime,
    ...(sha.length >= 7 ? { sha: sha.length === 40 ? sha : undefined } : {}),
  };
}

/** Staging/production require a valid immutable stamp; local/dev may omit. */
export function isReleaseStampRequired(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): boolean {
  const appEnv = (env.NEXT_PUBLIC_APP_ENV ?? "").trim().toLowerCase();
  return appEnv === "staging" || appEnv === "production";
}
