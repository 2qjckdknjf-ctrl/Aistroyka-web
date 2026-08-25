import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { V41_ASSETS } from "@/components/public/v41";
import { ConstructionMedia, FinalPilotCta, InternalPageHero, ProductWindow, WorkflowRail } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

const STAGES = [
  { id: "planning", n: "01", product: "commandCenter" as const },
  { id: "site", n: "02", product: "hero" as const },
  { id: "control", n: "03", product: "commandCenter" as const },
  { id: "ai", n: "04", product: "aiAnalytics" as const },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v43.features" });
  return { title: t("title"), description: t("lead") };
}

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.v43.features");
  const tV41 = await getTranslations("public.v41");

  return (
    <>
      <InternalPageHero
        eyebrow={t("eyebrow")}
        title={t("h1")}
        lead={t("lead")}
        primaryLabel={t("watchCta")}
        primaryHref="#site"
        secondaryHref="/platform"
        secondaryLabel={tV41("storyLink")}
        visual={<ConstructionMedia src={V41_ASSETS.hero} alt={tV41("heroAlt")} />}
      />
      <nav className="v41-page v43-stage-nav v41-glass" aria-label={t("stageNav")}>
        {STAGES.map((stage) => (
          <Link key={stage.id} href={`#${stage.id}`}>
            {stage.n} {t(`${stage.id}Nav`)}
          </Link>
        ))}
      </nav>
      {STAGES.map((stage) => (
        <section key={stage.id} id={stage.id} className="v41-page v41-section v43-feature-stage">
          <div>
            <p className="v41-eyebrow">
              {stage.n} {t(`${stage.id}Nav`)}
            </p>
            <h2>{t(`${stage.id}Title`)}</h2>
            <p>{t(`${stage.id}Lead`)}</p>
            <WorkflowRail
              steps={[
                { n: "1", title: t(`${stage.id}Step1Title`), text: t(`${stage.id}Step1Text`) },
                { n: "2", title: t(`${stage.id}Step2Title`), text: t(`${stage.id}Step2Text`) },
                { n: "3", title: t(`${stage.id}Step3Title`), text: t(`${stage.id}Step3Text`) },
              ]}
            />
            <p>
              <Link href={stage.id === "ai" ? "/ai-construction-control" : "/platform"}>{t(`${stage.id}Link`)}</Link>
            </p>
          </div>
          <div>
            <ProductWindow
              src={stage.product === "hero" ? V41_ASSETS.hero : V41_ASSETS[stage.product]}
              alt={t(`${stage.id}ProductAlt`)}
            />
            <ConstructionMedia src={V41_ASSETS.hero} alt={t(`${stage.id}PhotoAlt`)} />
          </div>
        </section>
      ))}
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
