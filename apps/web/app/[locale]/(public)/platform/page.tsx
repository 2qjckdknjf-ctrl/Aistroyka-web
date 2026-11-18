import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41_ASSETS } from "@/components/public/v41";
import {
  FaqAccordion,
  FinalPilotCta,
  InternalPageHero,
  ProductWindow,
  WorkflowRail,
} from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v43.platform" });
  return { title: t("title"), description: t("lead") };
}

export default async function PlatformPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.v43.platform");
  const tV41 = await getTranslations("public.v41");
  const modules = ["command", "field", "docs", "ai", "portfolio"] as const;
  const surfaces = ["web", "manager", "fieldApp"] as const;

  return (
    <>
      <InternalPageHero
        eyebrow={t("eyebrow")}
        title={t("h1")}
        lead={t("lead")}
        primaryLabel={tV41("launchPilot")}
        secondaryHref="/features"
        secondaryLabel={t("secondaryCta")}
        visual={<ProductWindow src={V41_ASSETS.commandCenter} alt={tV41("commandCenterAlt")} />}
      />
      <section className="v41-page v41-section">
        <h2>{t("flowTitle")}</h2>
        <WorkflowRail
          steps={[
            { n: "01", title: t("flow1Title"), text: t("flow1Text") },
            { n: "02", title: t("flow2Title"), text: t("flow2Text") },
            { n: "03", title: t("flow3Title"), text: t("flow3Text") },
          ]}
        />
      </section>
      <section className="v41-page v41-section">
        <h2>{t("modulesTitle")}</h2>
        <div className="v43-module-grid">
          {modules.map((key) => (
            <article key={key} className="v43-plan-card v41-glass">
              <h3>{t(`${key}Title`)}</h3>
              <p>{t(`${key}Text`)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="v41-page v41-section">
        <h2>{t("surfacesTitle")}</h2>
        <div className="v43-module-grid">
          {surfaces.map((key) => (
            <article key={key} className="v43-plan-card v41-glass">
              <h3>{t(`${key}Title`)}</h3>
              <p>{t(`${key}Text`)}</p>
            </article>
          ))}
        </div>
      </section>
      <FaqAccordion
        title={t("faqTitle")}
        items={[
          { q: t("faq1Q"), a: t("faq1A") },
          { q: t("faq2Q"), a: t("faq2A") },
          { q: t("faq3Q"), a: t("faq3A") },
        ]}
      />
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
