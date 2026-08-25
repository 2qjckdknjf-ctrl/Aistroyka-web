import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41_ASSETS } from "@/components/public/v41";
import { ConstructionMedia, FinalPilotCta, InternalPageHero, PilotTimeline } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v43.partners" });
  return { title: t("title"), description: t("lead") };
}

export default async function PartnersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.v43.partners");
  const tV41 = await getTranslations("public.v41");
  const types = ["integration", "implementation", "expert"] as const;

  return (
    <>
      <InternalPageHero
        eyebrow={t("eyebrow")}
        title={t("h1")}
        lead={t("lead")}
        primaryLabel={t("becomeCta")}
        secondaryHref="/contact"
        secondaryLabel={t("discussCta")}
        visual={<ConstructionMedia src={V41_ASSETS.hero} alt={tV41("heroAlt")} />}
      />
      <section className="v41-page v43-partner-grid">
        {types.map((key) => (
          <article key={key} className="v43-plan-card v41-glass">
            <h2>{t(`${key}Title`)}</h2>
            <p>{t(`${key}Who`)}</p>
            <p>{t(`${key}Together`)}</p>
            <p>{t(`${key}Next`)}</p>
          </article>
        ))}
      </section>
      <PilotTimeline
        title={t("processTitle")}
        steps={[
          { n: "1", title: t("s1Title"), text: t("s1Text") },
          { n: "2", title: t("s2Title"), text: t("s2Text") },
          { n: "3", title: t("s3Title"), text: t("s3Text") },
          { n: "4", title: t("s4Title"), text: t("s4Text") },
          { n: "5", title: t("s5Title"), text: t("s5Text") },
        ]}
      />
      <section className="v41-page v41-section v43-benefit-grid">
        {(["b1", "b2", "b3"] as const).map((key) => (
          <article key={key} className="v43-plan-card v41-glass">
            <h2>{t(`${key}Title`)}</h2>
            <p>{t(`${key}Text`)}</p>
          </article>
        ))}
      </section>
      <FinalPilotCta
        copy={{
          eyebrow: tV41("pilotEyebrow"),
          title: tV41("pilotTitle"),
          lead: tV41("pilotLead"),
          launchPilot: tV41("launchPilot"),
          contact: tV41("contactUs"),
          note: tV41("pilotNote"),
        }}
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
