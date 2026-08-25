"use client";

import { useTranslations } from "next-intl";
import { CanonPageHeader } from "@/components/canon/CanonPageHeader";

export function TeamCanonPageHeader() {
  const t = useTranslations("team");

  return <CanonPageHeader title={t("title")} subtitle={t("subtitle")} showFavorite={false} />;
}
