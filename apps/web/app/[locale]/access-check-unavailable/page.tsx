import { getLocale, getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Served via middleware rewrite while the browser URL stays on the blocked path.
 * Use a plain <a> with an absolute locale path so "Try again" forces a full
 * document load and re-runs the role check (next-intl Link would soft-navigate).
 */
export default async function AccessCheckUnavailablePage() {
  const t = await getTranslations("errors");
  const locale = await getLocale();
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">{t("accessCheckUnavailableTitle")}</h1>
      <p className="text-base opacity-80">{t("accessCheckUnavailableMessage")}</p>
      <a href={`/${locale}/dashboard`} className="rounded-md border px-4 py-2 text-sm font-medium">
        {t("accessCheckUnavailableRetry")}
      </a>
    </main>
  );
}
