import { getTranslations } from "next-intl/server";
import { TelegramLoginWidget } from "@/components/auth/TelegramLoginWidget";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TelegramStartPage({ searchParams }: Props) {
  const t = await getTranslations("auth");
  const params = (await searchParams) ?? {};
  const next = typeof params.next === "string" ? params.next : "/dashboard";
  const botUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim() ||
    process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim() ||
    null;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md items-center px-aistroyka-4 py-aistroyka-8">
      <div className="w-full card-elevated">
        <h1 className="text-aistroyka-title2 font-bold text-aistroyka-text-primary">
          {t("continueWithTelegram")}
        </h1>
        <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("telegramLoginSubhint")}</p>
        <div className="mt-5">
          <TelegramLoginWidget botUsername={botUsername} nextPath={next} />
        </div>
      </div>
    </div>
  );
}
