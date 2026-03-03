import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "en", "es", "it"],
  defaultLocale: "ru",
  localePrefix: "always",
});
