import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { RomaQaCenterSectionClient } from "@/components/platform-admin/RomaQaCenterSectionClient";
import {
  buildRomaQaCenterModel,
  getRomaQaCenterSection,
  isRomaQaCenterRouteSectionId,
  ROMA_QA_CENTER_ROUTE_SECTION_IDS,
} from "@/lib/platform-admin/roma-qa-center.model";
import { getRomaLegacyRedirectTarget } from "@/lib/platform-admin/roma-qa-center-routes";

type PageProps = {
  params: Promise<{ locale: string; section: string }>;
};

export async function generateStaticParams() {
  return ROMA_QA_CENTER_ROUTE_SECTION_IDS.map((section) => ({ section }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section: sectionId } = await params;
  const legacyTarget = getRomaLegacyRedirectTarget(sectionId);
  if (legacyTarget) {
    return { title: "Operations Center" };
  }
  if (!isRomaQaCenterRouteSectionId(sectionId)) {
    return { title: "Operations Center" };
  }
  const model = buildRomaQaCenterModel();
  const section = getRomaQaCenterSection(model, sectionId);
  return {
    title: section ? `Operations Center · ${section.title}` : "Operations Center",
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function RomaQaCenterSectionPage({ params }: PageProps) {
  const { locale, section: sectionId } = await params;

  const legacyTarget = getRomaLegacyRedirectTarget(sectionId);
  if (legacyTarget) {
    redirect(`/${locale}${legacyTarget}`);
  }

  if (!isRomaQaCenterRouteSectionId(sectionId)) {
    notFound();
  }

  const model = buildRomaQaCenterModel();
  const section = getRomaQaCenterSection(model, sectionId);
  if (!section) {
    notFound();
  }

  return <RomaQaCenterSectionClient section={section} />;
}
