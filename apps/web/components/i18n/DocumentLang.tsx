"use client";

import { useEffect } from "react";

/** Root `app/layout.tsx` is shared across static locale shells, so `<html lang>` can bake as `ru`. */
export function DocumentLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
