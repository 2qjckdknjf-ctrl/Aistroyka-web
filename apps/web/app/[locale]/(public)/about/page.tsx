import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41_ASSETS } from "@/components/public/v41";
import { ConstructionMedia, FinalPilotCta, InternalPageHero, PilotTimeline } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v43.about" });
  return { title: t("title"), description: t("lead") };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.v43.about");
  const tV41 = await getTranslations("public.v41");

  return (
    <>
      <InternalPageHero
        eyebrow={t("eyebrow")}
        title={t("h1")}
        lead={t("lead")}
        primaryLabel={t("platformCta")}
        primaryHref="/platform"
        visual={<ConstructionMedia src={V41_ASSETS.hero} alt={tV41("heroAlt")} />}
      />
      <PilotTimeline
        title={t("pathTitle")}
        steps={[
          { n: "1", title: t("p1Title"), text: t("p1Text") },
          { n: "2", title: t("p2Title"), text: t("p2Text") },
          { n: "3", title: t("p3Title"), text: t("p3Text") },
          { n: "4", title: t("p4Title"), text: t("p4Text") },
        ]}
      />
      <section className="v41-page v41-section">
        <p className="v41-eyebrow">{t("principlesEyebrow")}</p>
        <div className="v43-about-principles">
          {(["f1", "f2", "f3"] as const).map((key) => (
            <article key={key} className="v43-plan-card v41-glass">
              <h2>{t(`${key}Title`)}</h2>
              <p>{t(`${key}Text`)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="v41-page v41-section v43-two-col">
        <div>
          <p className="v41-eyebrow">{t("buildEyebrow")}</p>
          <h2>{t("buildTitle")}</h2>
          <p>{t("buildLead")}</p>
        </div>
        <ConstructionMedia src={V41_ASSETS.commandCenter} alt={tV41("commandCenterAlt")} />
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
