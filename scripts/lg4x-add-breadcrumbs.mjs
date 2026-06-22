#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "../apps/web/app/[locale]/(public)");

const pages = [
  { file: "platform/page.tsx", path: "/platform" },
  { file: "features/page.tsx", path: "/features" },
  { file: "solutions/page.tsx", path: "/solutions" },
  { file: "mobile/page.tsx", path: "/mobile" },
  { file: "copilot/page.tsx", path: "/copilot" },
  { file: "ai-construction-control/page.tsx", path: "/ai-construction-control" },
  { file: "ai-demo/page.tsx", path: "/ai-demo" },
  { file: "pricing/page.tsx", path: "/pricing" },
  { file: "enterprise/page.tsx", path: "/enterprise" },
  { file: "integrations/page.tsx", path: "/integrations" },
  { file: "security/page.tsx", path: "/security" },
  { file: "implementation/page.tsx", path: "/implementation" },
  { file: "faq/page.tsx", path: "/faq" },
  { file: "about/page.tsx", path: "/about" },
  { file: "contact/page.tsx", path: "/contact" },
  { file: "api/page.tsx", path: "/api" },
  { file: "workflows/page.tsx", path: "/workflows" },
  { file: "partners/page.tsx", path: "/partners" },
];

for (const { file, path } of pages) {
  const full = join(root, file);
  let src = readFileSync(full, "utf8");
  if (src.includes("PublicJsonLd")) {
    console.log(`skip: ${file}`);
    continue;
  }

  if (!src.includes("buildStandardPublicBreadcrumb")) {
    src = src.replace(
      'from "@/lib/seo/public-page-metadata";',
      'from "@/lib/seo/public-page-metadata";\nimport { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";',
    );
    if (!src.includes("buildStandardPublicBreadcrumb")) {
      src = src.replace(
        'import { routing } from "@/i18n/routing";',
        'import { routing } from "@/i18n/routing";\nimport { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";',
      );
    }
  }

  src = src.replace(
    /import \{([^}]+)\} from "@\/components\/public";/,
    (_, inner) => {
      const names = inner.split(",").map((s) => s.trim());
      if (!names.includes("PublicJsonLd")) names.push("PublicJsonLd");
      return `import { ${names.join(", ")} } from "@/components/public";`;
    },
  );

  const breadcrumbBlock = `  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "${path}",
    t("title"),
    tLayout("breadcrumbHome"),
  );
`;

  src = src.replace(
    /const tCta = await getTranslations\("public\.cta"\);\n/,
    `const tCta = await getTranslations("public.cta");\n${breadcrumbBlock}`,
  );

  if (!src.includes("breadcrumbJsonLd")) {
    src = src.replace(
      /(const t = await getTranslations\("[^"]+"\);\n)/,
      `$1${breadcrumbBlock}`,
    );
  }

  src = src.replace(
    /return \(\n    <>\n(?!\s*<PublicJsonLd)/,
    "return (\n    <>\n      <PublicJsonLd data={breadcrumbJsonLd} />\n",
  );

  writeFileSync(full, src);
  console.log(`patched: ${file}`);
}
