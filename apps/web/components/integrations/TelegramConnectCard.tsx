"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

async function getStatus(): Promise<{ linked: boolean; botConfigured: boolean }> {
  const res = await fetch("/api/v1/integrations/telegram/link", { credentials: "include" });
  if (!res.ok) throw new Error("status");
  return res.json();
}

async function postLink(): Promise<{ deepLink: string }> {
  const res = await fetch("/api/v1/integrations/telegram/link", { method: "POST", credentials: "include" });
  if (res.status === 503) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "telegram_bot_not_configured");
  }
  if (!res.ok) throw new Error("link_failed");
  return res.json();
}

async function unlink(): Promise<void> {
  const res = await fetch("/api/v1/integrations/telegram/link", { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("unlink_failed");
}

export function TelegramConnectCard({ className }: { className?: string }) {
  const t = useTranslations("dashboardDetail");
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["telegram-link-status"],
    queryFn: getStatus,
  });

  const mint = useMutation({
    mutationFn: postLink,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["telegram-link-status"] });
    },
  });

  const disconnect = useMutation({
    mutationFn: unlink,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["telegram-link-status"] });
    },
  });

  if (q.isPending) {
    return (
      <DashboardGlassCard className={className}>
        <p className="text-sm text-aistroyka-text-tertiary">{t("loadingUpdates")}</p>
      </DashboardGlassCard>
    );
  }

  if (q.isError) return null;

  const { linked, botConfigured } = q.data ?? { linked: false, botConfigured: false };

  if (!botConfigured) {
    return (
      <DashboardGlassCard className={`p-4 border-l-4 border-l-aistroyka-text-tertiary ${className ?? ""}`}>
        <h3 className="font-semibold text-aistroyka-text-primary">{t("telegramAlertsTitle")}</h3>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("telegramNotConfigured")}</p>
      </DashboardGlassCard>
    );
  }

  return (
    <DashboardGlassCard className={`p-4 border-l-4 border-l-aistroyka-info ${className ?? ""}`}>
      <h3 className="font-semibold text-aistroyka-text-primary">{t("telegramAlertsTitle")}</h3>
      <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("telegramAlertsHint")}</p>
      {linked ? (
        <p className="mt-3 text-sm font-medium text-aistroyka-success">{t("telegramLinked")}</p>
      ) : null}
      {mint.data?.deepLink ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-aistroyka-text-tertiary">{t("telegramDeepLinkHint")}</p>
          <a
            href={mint.data.deepLink}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-sm text-aistroyka-accent hover:underline"
          >
            {mint.data.deepLink}
          </a>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(mint.data!.deepLink);
            }}
          >
            {t("telegramCopyLink")}
          </Button>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {!linked ? (
          <Button type="button" size="sm" loading={mint.isPending} onClick={() => mint.mutate()}>
            {t("telegramConnect")}
          </Button>
        ) : null}
        {linked ? (
          <Button type="button" size="sm" variant="secondary" loading={disconnect.isPending} onClick={() => disconnect.mutate()}>
            {t("telegramDisconnect")}
          </Button>
        ) : null}
      </div>
    </DashboardGlassCard>
  );
}
