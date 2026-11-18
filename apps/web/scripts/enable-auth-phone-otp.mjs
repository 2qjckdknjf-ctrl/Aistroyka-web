#!/usr/bin/env node
/**
 * Optional Worker SMS OTP Auth flag — NOT a launch, CI, or production gate.
 *
 * Phone OTP stays disabled until a real SMS provider is intentionally configured
 * in the Supabase Auth dashboard. This script does not add Twilio as a dependency,
 * does not invent TWILIO_* secrets, and never prints credential values.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=xxx node apps/web/scripts/enable-auth-phone-otp.mjs
 *   SUPABASE_ACCESS_TOKEN=xxx node apps/web/scripts/enable-auth-phone-otp.mjs --status
 *   SUPABASE_ACCESS_TOKEN=xxx node apps/web/scripts/enable-auth-phone-otp.mjs --disable
 *   SUPABASE_ACCESS_TOKEN=xxx node apps/web/scripts/enable-auth-phone-otp.mjs --enable
 *
 * No flags / --status is read-only. --enable refuses unless SMS credentials
 * are already present in Auth config. Never prints secret values.
 */

const PROJECT_REF = "vthfrxehrursfloevnlp";
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const mode = process.argv.includes("--enable")
  ? "enable"
  : process.argv.includes("--disable")
    ? "disable"
    : "status";

if (!token) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)",
  );
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function smsCredentialsPresent(data) {
  const provider = String(data?.sms_provider ?? "").toLowerCase();
  if (provider === "twilio") {
    return hasText(data?.sms_twilio_account_sid) && hasText(data?.sms_twilio_auth_token);
  }
  if (provider === "messagebird") {
    return hasText(data?.sms_messagebird_access_key);
  }
  if (provider === "textlocal") {
    return hasText(data?.sms_textlocal_account_sid) && hasText(data?.sms_textlocal_auth_token);
  }
  if (provider === "vonage") {
    return hasText(data?.sms_vonage_api_key) && hasText(data?.sms_vonage_api_secret);
  }
  return false;
}

function phoneAuthSummary(data) {
  return {
    external_phone_enabled: Boolean(data?.external_phone_enabled),
    sms_provider: data?.sms_provider ?? null,
    sms_credentials_present: smsCredentialsPresent(data),
  };
}

const getRes = await fetch(url, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  },
});

if (!getRes.ok) {
  console.error("Supabase API error:", getRes.status, await getRes.text());
  process.exit(1);
}

const current = await getRes.json().catch(() => ({}));
console.log("Auth phone snapshot:", phoneAuthSummary(current));

if (mode === "status") {
  process.exit(0);
}

const desired = mode === "enable";
if (desired && !smsCredentialsPresent(current)) {
  console.error(
    "Refusing --enable: SMS credentials are not present. Configure a real SMS provider first, or use --disable.",
  );
  process.exit(1);
}

if (Boolean(current?.external_phone_enabled) === desired) {
  console.log(`external_phone_enabled already ${desired}. No change.`);
  process.exit(0);
}

const patchRes = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({ external_phone_enabled: desired }),
});

if (!patchRes.ok) {
  console.error("Supabase API error:", patchRes.status, await patchRes.text());
  process.exit(1);
}

const data = await patchRes.json().catch(() => ({}));
console.log("Auth config updated:", phoneAuthSummary(data));
if (Boolean(data?.external_phone_enabled) !== desired) {
  console.error(`external_phone_enabled did not become ${desired}.`);
  process.exit(1);
}
