const LOCALE_PREFIX = /^\/(ru|en|es|it)(?=\/|$)/;

/** Strip a locale prefix so next-intl `Link locale=` does not emit `/ru/en/pricing`. */
export function localeAgnosticPath(pathname: string): string {
  const stripped = pathname.replace(LOCALE_PREFIX, "");
  return stripped.length > 0 ? stripped : "/";
}
