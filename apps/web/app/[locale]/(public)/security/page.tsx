import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41_ASSETS } from "@/components/public/v41";
import { FaqAccordion, FinalPilotCta, InternalPageHero, ProductWindow, WorkflowRail } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v43.security" });
  return { title: t("title"), description: t("lead") };
}

export default async function SecurityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.v43.security");
  const tV41 = await getTranslations("public.v41");

  return (
    <>
      <InternalPageHero
        eyebrow={t("eyebrow")}
        title={t("h1")}
        lead={t("lead")}
        primaryLabel={t("discussCta")}
        secondaryHref="/pricing/enterprise"
        secondaryLabel={t("modelCta")}
        visual={<ProductWindow src={V41_ASSETS.commandCenter} alt={tV41("commandCenterAlt")} />}
      />
      <section className="v41-page v41-section">
        <h2>{t("layersTitle")}</h2>
        <WorkflowRail
          steps={[
            { n: "1", title: t("l1Title"), text: t("l1Text") },
            { n: "2", title: t("l2Title"), text: t("l2Text") },
            { n: "3", title: t("l3Title"), text: t("l3Text") },
            { n: "4", title: t("l4Title"), text: t("l4Text") },
          ]}
        />
      </section>
      <section className="v41-page v43-security-panels">
        <article className="v43-plan-card v41-glass">
          <h2>{t("matrixTitle")}</h2>
          <table className="v43-matrix">
            <thead>
              <tr>
                <th>{t("role")}</th>
                <th>{t("view")}</th>
                <th>{t("edit")}</th>
                <th>{t("manage")}</th>
              </tr>
            </thead>
            <tbody>
              {(["admin", "manager", "field"] as const).map((row) => (
                <tr key={row}>
                  <th scope="row">{t(`${row}Role`)}</th>
                  <td>{t(`${row}View`)}</td>
                  <td>{t(`${row}Edit`)}</td>
                  <td>{t(`${row}Manage`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>{t("matrixNote")}</p>
        </article>
        <article className="v43-plan-card v41-glass">
          <h2>{t("auditTitle")}</h2>
          <p>{t("auditText")}</p>
        </article>
        <article className="v43-plan-card v41-glass">
          <h2>{t("materialsTitle")}</h2>
          <p>{t("materialsText")}</p>
        </article>
      </section>
      <FaqAccordion
        title={t("faqTitle")}
        items={[
          { q: t("faq1Q"), a: t("faq1A") },
          { q: t("faq2Q"), a: t("faq2A") },
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
