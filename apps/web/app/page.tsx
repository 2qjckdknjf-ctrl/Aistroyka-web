import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * Корень сайта (/) — редирект на локаль по умолчанию,
 * чтобы не было 404 при открытии https://aistroyka.ai/
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
