import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41_ASSETS } from "@/components/public/v41";
import { ConstructionMedia, InternalPageHero, PilotForm, WorkflowRail } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v43.contact" });
  return { title: t("title"), description: t("lead") };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.v43.contact");
  const tV41 = await getTranslations("public.v41");

  return (
    <>
      <InternalPageHero
        eyebrow={t("eyebrow")}
        title={t("h1")}
        lead={t("lead")}
        visual={<ConstructionMedia src={V41_ASSETS.hero} alt={tV41("heroAlt")} />}
      />
      <section className="v41-page v43-contact-layout">
        <div>
          <h2>{t("nextTitle")}</h2>
          <WorkflowRail
            steps={[
              { n: "1", title: t("n1Title"), text: t("n1Text") },
              { n: "2", title: t("n2Title"), text: t("n2Text") },
              { n: "3", title: t("n3Title"), text: t("n3Text") },
            ]}
          />
        </div>
        <Suspense>
          <PilotForm />
        </Suspense>
      </section>
      <section className="v41-page v41-section v43-module-grid">
        {(["g1", "g2", "g3"] as const).map((key) => (
          <article key={key} className="v43-plan-card v41-glass">
            <h2>{t(`${key}Title`)}</h2>
            <p>{t(`${key}Text`)}</p>
          </article>
        ))}
      </section>
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
