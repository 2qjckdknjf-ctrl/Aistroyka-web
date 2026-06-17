const path = require("path");
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
// Standalone tracing is required for Cloudflare/OpenNext builds only.
// Keeping default local/CI build non-standalone avoids flaky trace ENOENTs.
const isStandaloneOutput =
  process.env.NEXT_PRIVATE_STANDALONE === "true" ||
  process.env.NEXT_PRIVATE_STANDALONE === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Keep root tracing context stable in monorepo even for non-standalone builds.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  ...(isStandaloneOutput
    ? {
        output: "standalone",
      }
    : {}),
  transpilePackages: ["@aistroyka/contracts"],
  webpack: (config, { dev }) => {
    // Plain `next build`: disable webpack disk cache (PackFileCacheStrategy races).
    // Standalone (`cf:build`): keep defaults so pages/app manifests emit reliably.
    if (!dev && !isStandaloneOutput) {
      config.cache = false;
    }
    // Do not set `config.resolve.alias` from `{ ...config.resolve.alias }` — Next 15 may use an
    // array for internal aliases (`private-next-pages/*`); spreading breaks builds.
    // Zod resolves via apps/web package.json for `@aistroyka/contracts`.
    return config;
  },
};

// Vercel build: plain Next.js, no Cloudflare adapter (avoids wrangler dependency).
// Cloudflare/OpenNext path: init only when not deploying to Vercel.
const isVercelDeploy =
  process.env.VERCEL === "1" || process.env.DEPLOY_TARGET === "vercel";
// initOpenNextCloudflareForDev is for `next dev` only (Wrangler proxy + vm patch).
// Running it during `next build` can race with the compiler and yield ENOENT on
// `.next/server/pages-manifest.json` and similar artifacts.
if (!isVercelDeploy && process.env.NODE_ENV === "development") {
  try {
    const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
    initOpenNextCloudflareForDev();
  } catch {
    // @opennextjs/cloudflare not installed or not needed (e.g. plain next build)
  }
}

module.exports = withNextIntl(nextConfig);
