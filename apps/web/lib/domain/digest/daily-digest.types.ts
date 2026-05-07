export type DailyDigestAudience = "manager" | "owner";

export type DailyDigestSeverity = "info" | "warning" | "critical";

/** next-intl `getTranslations('dailyDigest')` callback shape */
export type DailyDigestTranslate = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

export interface DailyDigestLine {
  id: string;
  text: string;
  severity: DailyDigestSeverity;
  href?: string;
}

export interface DailyDigestPayload {
  audience: DailyDigestAudience;
  headline: string;
  generated_at: string;
  project_id: string;
  project_name: string;
  lines: DailyDigestLine[];
}
