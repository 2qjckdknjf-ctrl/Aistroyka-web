"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";

const STORAGE_KEY = "aistroyka:first-launch-guide:v1";

export function FirstLaunchGuide() {
  const t = useTranslations("helpCenter.guide");
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      setOpen(false);
    } finally {
      setReady(true);
    }
  }, []);

  function closeGuide() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage write errors (private mode, policy restrictions)
    }
    setOpen(false);
  }

  if (!ready) return null;

  return (
    <Modal open={open} onClose={closeGuide} title={t("title")}>
      <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{t("subtitle")}</p>
      <ol className="mt-4 space-y-3 pl-5 text-aistroyka-subheadline text-aistroyka-text-primary">
        <li className="list-decimal">{t("step1")}</li>
        <li className="list-decimal">{t("step2")}</li>
        <li className="list-decimal">{t("step3")}</li>
      </ol>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/dashboard/help">
          <Button variant="secondary">{t("openHelp")}</Button>
        </Link>
        <Button variant="primary" onClick={closeGuide}>
          {t("startWorking")}
        </Button>
      </div>
    </Modal>
  );
}
