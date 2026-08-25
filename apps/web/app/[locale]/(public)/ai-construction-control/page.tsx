import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41_ASSETS } from "@/components/public/v41";
import { ConstructionMedia, FinalPilotCta, InternalPageHero, ProductWindow, WorkflowRail } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v43.ai" });
  return { title: t("title"), description: t("lead") };
}

export default async function AiConstructionControlPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.v43.ai");
  const tV41 = await getTranslations("public.v41");

  return (
    <>
      <InternalPageHero
        eyebrow={t("eyebrow")}
        title={t("h1")}
        lead={t("lead")}
        primaryLabel={tV41("launchPilot")}
        secondaryHref="/security"
        secondaryLabel={t("secondaryCta")}
        visual={<ProductWindow src={V41_ASSETS.aiAnalytics} alt={tV41("aiImageAlt")} />}
      />
      <section className="v41-page v41-section">
        <h2>{t("chainTitle")}</h2>
        <WorkflowRail
          steps={[
            { n: "1", title: t("s1Title"), text: t("s1Text") },
            { n: "2", title: t("s2Title"), text: t("s2Text") },
            { n: "3", title: t("s3Title"), text: t("s3Text") },
            { n: "4", title: t("s4Title"), text: t("s4Text") },
            { n: "5", title: t("s5Title"), text: t("s5Text") },
          ]}
        />
      </section>
      <section className="v41-page v41-section v43-two-col">
        <div>
          <h2>{t("caseTitle")}</h2>
          <p>{t("caseLead")}</p>
          <p>{t("humanNote")}</p>
        </div>
        <ConstructionMedia src={V41_ASSETS.hero} alt={tV41("heroAlt")} />
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
