import { NextResponse } from "next/server";
import { HELP_KNOWLEDGE_BASE, keywordsMatchBlob, type HelpLocale } from "@/lib/help/help-knowledge";
import type { HelpRole } from "@/lib/help/help-catalog";

type HelpQueryRequest = {
  query?: string;
  locale?: string;
  role?: string;
};

const KNOWN_LOCALES = new Set<HelpLocale>(["en", "ru", "es", "it"]);
const KNOWN_ROLES = new Set<HelpRole>(["manager", "admin", "client", "owner"]);

export async function POST(request: Request) {
  let payload: HelpQueryRequest;
  try {
    payload = (await request.json()) as HelpQueryRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const query = (payload.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "query_required" }, { status: 400 });
  }

  const locale: HelpLocale = KNOWN_LOCALES.has(payload.locale as HelpLocale)
    ? (payload.locale as HelpLocale)
    : "en";
  const role: HelpRole = KNOWN_ROLES.has(payload.role as HelpRole) ? (payload.role as HelpRole) : "manager";
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  const ranked = HELP_KNOWLEDGE_BASE.map((item) => {
    const text = `${item.title[locale]} ${item.summary[locale]} ${item.answer[locale]} ${keywordsMatchBlob(item, locale)}`.toLowerCase();
    const matches = words.reduce((sum, word) => (text.includes(word) ? sum + 1 : sum), 0);
    const roleBonus = item.roles.includes("all") || item.roles.includes(role) ? 1 : 0;
    const score = matches * 2 + roleBonus;
    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!ranked.length) {
    return NextResponse.json({ answer: null, suggestions: [] });
  }

  const [top, ...rest] = ranked;

  return NextResponse.json({
    answer: {
      id: top.item.id,
      title: top.item.title[locale],
      summary: top.item.summary[locale],
      answer: top.item.answer[locale],
      href: top.item.href,
    },
    suggestions: rest.map((entry) => ({
      id: entry.item.id,
      title: entry.item.title[locale],
      href: entry.item.href,
    })),
  });
}

