import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41_ASSETS } from "@/components/public/v41";
import { EnterpriseTeaser, FinalPilotCta, InternalPageHero, RoleSolutionSwitcher } from "@/components/public/v43";
import type { RoleSolutionCopy } from "@/components/public/v43/RoleSolutionSwitcher";
import type { SolutionRole } from "@/lib/public/solutions-roles";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v43.solutions" });
  return { title: t("title"), description: t("lead") };
}

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.v43.solutions");
  const tV41 = await getTranslations("public.v41");

  const roles = {
    business: roleCopy(t, "business"),
    manager: roleCopy(t, "manager"),
    field: roleCopy(t, "field"),
  } satisfies Record<SolutionRole, RoleSolutionCopy>;

  return (
    <>
      <InternalPageHero
        eyebrow={t("eyebrow")}
        title={t("h1")}
        lead={t("lead")}
        primaryLabel={tV41("launchPilot")}
      />
      <Suspense>
        <RoleSolutionSwitcher
          tablistLabel={t("tablist")}
          roles={roles}
          visuals={{
            business: { kind: "product", src: V41_ASSETS.aiAnalytics, alt: tV41("aiImageAlt") },
            manager: { kind: "product", src: V41_ASSETS.commandCenter, objectPosition: "50% 38%", alt: tV41("commandCenterAlt") },
            field: { kind: "photo", src: V41_ASSETS.hero, alt: tV41("heroAlt") },
          }}
        />
      </Suspense>
      <EnterpriseTeaser title={t("enterpriseTitle")} lead={t("enterpriseLead")} cta={t("enterpriseCta")} />
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

function roleCopy(t: (key: string) => string, role: SolutionRole): RoleSolutionCopy {
  return {
    label: t(`${role}Label`),
    title: t(`${role}Title`),
    problem: t(`${role}Problem`),
    benefitsTitle: t("benefitsTitle"),
    benefits: [t(`${role}Benefit1`), t(`${role}Benefit2`), t(`${role}Benefit3`)],
    workflowTitle: t("workflowTitle"),
    workflow: [
      { n: "1", title: t(`${role}Step1Title`), text: t(`${role}Step1Text`) },
      { n: "2", title: t(`${role}Step2Title`), text: t(`${role}Step2Text`) },
      { n: "3", title: t(`${role}Step3Title`), text: t(`${role}Step3Text`) },
    ],
    productAlt: t("productAlt"),
    photoAlt: t("photoAlt"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
