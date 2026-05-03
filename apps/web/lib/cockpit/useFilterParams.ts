"use client";

import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCallback, useMemo } from "react";

export interface FilterParams {
  project_id: string;
  worker_id: string;
  from: string;
  to: string;
  status: string;
  q: string;
  page: string;
  pageSize: string;
}

const DEFAULT_FROM = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
})();
const DEFAULT_TO = new Date().toISOString().slice(0, 10);

const defaults: FilterParams = {
  project_id: "",
  worker_id: "",
  from: DEFAULT_FROM,
  to: DEFAULT_TO,
  status: "",
  q: "",
  page: "1",
  pageSize: "25",
};

function getParam(sp: Pick<URLSearchParams, "get">, key: keyof FilterParams): string {
  const v = sp.get(key);
  return v ?? defaults[key];
}

export function useFilterParams(): {
  params: FilterParams;
  setParam: (key: keyof FilterParams, value: string) => void;
  setParams: (updates: Partial<FilterParams>) => void;
  toQueryString: () => string;
} {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const params = useMemo<FilterParams>(() => {
    const sp = searchParams ?? new URLSearchParams();
    return {
      project_id: getParam(sp, "project_id"),
      worker_id: getParam(sp, "worker_id"),
      from: getParam(sp, "from"),
      to: getParam(sp, "to"),
      status: getParam(sp, "status"),
      q: getParam(sp, "q"),
      page: getParam(sp, "page"),
      pageSize: getParam(sp, "pageSize"),
    };
  }, [searchParams]);

  const setParam = useCallback((key: keyof FilterParams, value: string) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    const def = defaults[key];
    if (value === def || !value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key === "project_id" || key === "worker_id" || key === "from" || key === "to" || key === "status" || key === "q") {
      next.set("page", "1");
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const setParams = useCallback((updates: Partial<FilterParams>) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    let resetPage = false;
    for (const [k, v] of Object.entries(updates)) {
      const key = k as keyof FilterParams;
      const val = String(v ?? "");
      const def = defaults[key];
      if (val === def || !val) {
        next.delete(key);
      } else {
        next.set(key, val);
      }
      if (["project_id", "worker_id", "from", "to", "status", "q"].includes(key)) resetPage = true;
    }
    if (resetPage) next.set("page", "1");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const toQueryString = useCallback(() => searchParams?.toString() ?? "", [searchParams]);

  return { params, setParam, setParams, toQueryString };
}
