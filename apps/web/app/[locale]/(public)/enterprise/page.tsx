import { setRequestLocale } from "next-intl/server";
import { permanentRedirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { enterpriseDetailPath } from "@/lib/public/pricing-catalog";

type Props = { params: Promise<{ locale: string }> };

export default async function LegacyEnterpriseRedirect({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  permanentRedirect(enterpriseDetailPath(locale));
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
