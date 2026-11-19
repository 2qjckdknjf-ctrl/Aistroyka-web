import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccessCheckUnavailablePage() {
  const t = await getTranslations("errors");
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">{t("accessCheckUnavailableTitle")}</h1>
      <p className="text-base opacity-80">{t("accessCheckUnavailableMessage")}</p>
      <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm font-medium" prefetch={false}>
        {t("accessCheckUnavailableRetry")}
      </Link>
    </main>
  );
}
