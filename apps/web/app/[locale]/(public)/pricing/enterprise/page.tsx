import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { V41_ASSETS } from "@/components/public/v41";
import { V41PilotButton } from "@/components/public/v41/V41PilotButton";
import { ConstructionMedia, FaqAccordion, InternalPageHero, PilotTimeline, ProductWindow } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v43.enterprise" });
  return { title: t("title"), description: t("lead") };
}

export default async function EnterprisePlanPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.v43.enterprise");
  const tV41 = await getTranslations("public.v41");
  const cards = ["portfolio", "roles", "audit", "integrations"] as const;

  return (
    <>
      <InternalPageHero
        eyebrow={t("eyebrow")}
        title={t("h1")}
        lead={t("lead")}
        primaryLabel={t("quoteCta")}
        pilotPlan="enterprise"
        secondaryHref="/security"
        secondaryLabel={t("architectureCta")}
        kicker={
          <p className="v43-kicker">
            <Link href="/pricing">{t("breadcrumb")}</Link>
          </p>
        }
        visual={<ProductWindow src={V41_ASSETS.commandCenter} alt={tV41("commandCenterAlt")} />}
      />
      <section className="v41-page v43-value-row">
        {["v1", "v2", "v3", "v4"].map((key) => (
          <article key={key} className="v43-plan-card v41-glass">
            <h2>{t(`${key}Title`)}</h2>
            <p>{t(`${key}Text`)}</p>
          </article>
        ))}
      </section>
      <section className="v41-page v41-section v43-module-grid">
        {cards.map((key) => (
          <article key={key} className="v43-plan-card v41-glass">
            <h2>{t(`${key}Title`)}</h2>
            <p>{t(`${key}Text`)}</p>
          </article>
        ))}
      </section>
      <section className="v41-page v41-section v43-two-col">
        <div>
          <h2>{t("archTitle")}</h2>
          <p>{t("archLead")}</p>
        </div>
        <ConstructionMedia src={V41_ASSETS.hero} alt={tV41("heroAlt")} />
      </section>
      <PilotTimeline
        title={t("rolloutTitle")}
        steps={[
          { n: "1", title: t("d1Title"), text: t("d1Text") },
          { n: "2", title: t("d2Title"), text: t("d2Text") },
          { n: "3", title: t("d3Title"), text: t("d3Text") },
          { n: "4", title: t("d4Title"), text: t("d4Text") },
        ]}
      />
      <section className="v41-page v41-section">
        <V41PilotButton plan="enterprise">
          {t("quoteCta")}
        </V41PilotButton>
      </section>
      <FaqAccordion
        title={t("faqTitle")}
        items={[
          { q: t("faq1Q"), a: t("faq1A") },
          { q: t("faq2Q"), a: t("faq2A") },
        ]}
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
