import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/public-paths";
import robots from "./robots";

function disallowList(): string[] {
  const rules = robots().rules;
  const rule = Array.isArray(rules) ? rules[0] : rules;
  const disallow = rule?.disallow ?? [];
  return Array.isArray(disallow) ? disallow : [disallow];
}

describe("robots", () => {
  it("disallows cabinets and service pages under every locale", () => {
    const disallow = disallowList();
    for (const loc of routing.locales) {
      for (const path of ["/dashboard", "/admin", "/portal", "/platform-admin", "/owner", "/login", "/smoke", "/share"]) {
        expect(disallow).toContain(`/${loc}${path}`);
      }
    }
  });

  it("never blocks a public sitemap page", () => {
    const disallow = disallowList();
    for (const loc of routing.locales) {
      for (const path of PUBLIC_SITEMAP_PATHS) {
        const url = `/${loc}${path}`;
        expect(disallow.filter((prefix) => url.startsWith(prefix))).toEqual([]);
      }
    }
  });
});
