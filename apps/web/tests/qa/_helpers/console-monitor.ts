import type { Page } from "@playwright/test";

const IGNORE_PATTERNS = [
  /\[login\]/,
  /favicon/i,
  /unsafe-eval.*Content Security Policy/i,
  /Failed to load resource.*\b404\b/i,
];

export function attachConsoleMonitor(page: Page) {
  const errors: string[] = [];
  const warnings: string[] = [];

  const onConsole = (msg: { type(): string; text(): string }) => {
    const text = msg.text();
    if (IGNORE_PATTERNS.some((p) => p.test(text))) return;
    if (msg.type() === "error") errors.push(text);
    if (msg.type() === "warning") warnings.push(text);
  };

  const onPageError = (err: Error) => {
    errors.push(err.message);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  return {
    drain() {
      return { errors: [...errors], warnings: [...warnings] };
    },
    detach() {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    },
  };
}
