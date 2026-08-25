import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41InnerPage, V41_ASSETS } from "@/components/public/v41";

type Props = { params: Promise<{ locale: string }> };

const ITEM_KEYS = ["webPlatform", "managerApp", "workerApp", "aiEngine", "integrations"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.platform" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function PlatformPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.platform");
  const tV41 = await getTranslations("public.v41");

  return (
    <V41InnerPage
      eyebrow={t("title")}
      title={t("title")}
      lead={t("metaDescription")}
      ctaLabel={tV41("launchPilot")}
      secondaryHref="/features"
      secondaryLabel={tV41("storyLink")}
      visual={
        <img
          src={V41_ASSETS.commandCenter}
          alt={tV41("commandCenterAlt")}
          width={1280}
          height={800}
        />
      }
    >
      <div className="v41-inner-grid">
        {ITEM_KEYS.map((key) => (
          <article key={key} className="v41-inner-card v41-glass">
            <h2>{t(key)}</h2>
            <p>{t(`${key}Desc`)}</p>
          </article>
        ))}
      </div>
    </V41InnerPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
