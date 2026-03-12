const path = require("path");
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const { SECURITY_HEADERS } = require("./lib/security-headers");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@aistroyka/contracts"],
  webpack: (config, { isServer }) => {
    // Resolve zod from app context when bundling @aistroyka/contracts (monorepo workspace)
    const zodPath = path.dirname(require.resolve("zod/package.json", { paths: [__dirname] }));
    config.resolve.alias = {
      ...config.resolve.alias,
      zod: zodPath,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...SECURITY_HEADERS],
      },
    ];
  },
};

// Vercel build: plain Next.js, no Cloudflare adapter (avoids wrangler dependency).
// Cloudflare/OpenNext path: init only when not deploying to Vercel.
const isVercelDeploy =
  process.env.VERCEL === "1" || process.env.DEPLOY_TARGET === "vercel";
if (!isVercelDeploy) {
  try {
    const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
    initOpenNextCloudflareForDev();
  } catch {
    // @opennextjs/cloudflare not installed or not needed (e.g. plain next build)
  }
}

module.exports = withNextIntl(nextConfig);
