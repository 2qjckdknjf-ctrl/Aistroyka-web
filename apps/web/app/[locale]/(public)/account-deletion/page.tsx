import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.accountDeletion" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function AccountDeletionPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.accountDeletion");
  const tNav = await getTranslations("public.nav");

  return (
    <SimpleMarketingPage
      title={t("title")}
      lead={t("lead")}
      primaryLabel={tNav("login")}
      primaryHref="/login"
      secondaryLabel={t("settingsCta")}
      secondaryHref="/dashboard/settings/auth"
    >
      <section className="v41-page v41-section">
        <article className="v43-plan-card v41-glass">
          <h2>{t("webTitle")}</h2>
          <p>{t("webBody")}</p>
        </article>
        <article className="v43-plan-card v41-glass">
          <h2>{t("appTitle")}</h2>
          <p>{t("appBody")}</p>
        </article>
        <article className="v43-plan-card v41-glass">
          <h2>{t("scopeTitle")}</h2>
          <p>{t("scopeBody")}</p>
        </article>
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
