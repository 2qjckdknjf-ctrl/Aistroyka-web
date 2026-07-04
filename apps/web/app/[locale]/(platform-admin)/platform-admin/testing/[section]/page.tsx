import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RomaQaCenterSectionClient } from "@/components/platform-admin/RomaQaCenterSectionClient";
import {
  buildRomaQaCenterModel,
  getRomaQaCenterSection,
  ROMA_QA_CENTER_ROUTE_SECTION_IDS,
  isRomaQaCenterRouteSectionId,
} from "@/lib/platform-admin/roma-qa-center.model";

type PageProps = {
  params: Promise<{ locale: string; section: string }>;
};

export async function generateStaticParams() {
  return ROMA_QA_CENTER_ROUTE_SECTION_IDS.map((section) => ({ section }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section: sectionId } = await params;
  if (!isRomaQaCenterRouteSectionId(sectionId)) {
    return { title: "ROMA QA Center" };
  }
  const model = buildRomaQaCenterModel();
  const section = getRomaQaCenterSection(model, sectionId);
  return {
    title: section ? `ROMA QA Center · ${section.title}` : "ROMA QA Center",
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function RomaQaCenterSectionPage({ params }: PageProps) {
  const { section: sectionId } = await params;
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
