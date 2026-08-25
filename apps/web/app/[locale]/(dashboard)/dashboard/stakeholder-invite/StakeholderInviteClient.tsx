"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { CanonSurface } from "@/components/canon/CanonSurface";

export function StakeholderInviteClient({ skin = "default" }: { skin?: "default" | "canon" }) {
  const tDetail = useTranslations("dashboardDetail");
  const isCanon = skin === "canon";
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp?.get("token") ?? "";

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/stakeholder-invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? tDetail("failedAcceptInvite"));
      }
      return res.json() as Promise<{ data: { redirect_path?: string } }>;
    },
    onSuccess: (json) => {
      const path = json.data?.redirect_path;
      if (path) router.push(path);
    },
  });

  return (
    <CanonSurface isCanon={isCanon} className="border-l-4 border-l-aistroyka-info p-6 max-w-lg mx-auto mt-8">
      <h1 className="text-lg font-semibold text-aistroyka-text-primary">{tDetail("projectInvitation")}</h1>
      <p className="mt-2 text-sm text-aistroyka-text-secondary">
        {tDetail("projectInvitationHint")}
      </p>
      {!token ? (
        <p className="mt-4 text-sm text-aistroyka-error">{tDetail("missingTokenInUrl")}</p>
      ) : (
        <Button type="button" className="mt-4" onClick={() => mutation.mutate()} loading={mutation.isPending}>
          {tDetail("acceptInvitation")}
        </Button>
      )}
      {mutation.isError ? (
        <p className="mt-2 text-sm text-aistroyka-error" role="alert">
          {mutation.error instanceof Error ? mutation.error.message : tDetail("error")}
        </p>
      ) : null}
      <p className="mt-4 text-sm text-aistroyka-text-secondary">
        <Link href="/login" className="text-aistroyka-accent hover:underline">
          {tDetail("signIn")}
        </Link>
      </p>
    </CanonSurface>
  );
}
