"use client";

/**
 * Build stamp for deploy verification: shows first 7 chars of BUILD_SHA + build time.
 * Values come from NEXT_PUBLIC_BUILD_SHA / NEXT_PUBLIC_BUILD_TIME set in CI before build.
 */
export function BuildStamp() {
  const sha = process.env.NEXT_PUBLIC_BUILD_SHA ?? "unknown";
  const sha7 = sha.slice(0, 7);
  const time = process.env.NEXT_PUBLIC_BUILD_TIME ?? "unknown";
  return (
    <span
      className="text-aistroyka-caption text-aistroyka-text-tertiary whitespace-nowrap"
      title={`Build: ${sha} · ${time}`}
    >
      build: {sha7} · {time}
    </span>
  );
}
