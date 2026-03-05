"use client";

/**
 * Build stamp for deploy verification: shows first 7 chars of BUILD_SHA + build time.
 * Values come from NEXT_PUBLIC_BUILD_SHA / NEXT_PUBLIC_BUILD_TIME set in CI before build.
 * When NEXT_PUBLIC_APP_ENV=staging, shows "staging" for clarity.
 */
export function BuildStamp() {
  const sha = process.env.NEXT_PUBLIC_BUILD_SHA ?? "unknown";
  const sha7 = sha.slice(0, 7);
  const time = process.env.NEXT_PUBLIC_BUILD_TIME ?? "unknown";
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV ?? "").trim().toLowerCase();
  const envLabel = appEnv === "staging" ? " [staging]" : "";
  return (
    <span
      className="text-aistroyka-caption text-aistroyka-text-tertiary whitespace-nowrap"
      title={`Build: ${sha} · ${time}${envLabel}`}
    >
      build: {sha7} · {time}{envLabel}
    </span>
  );
}
