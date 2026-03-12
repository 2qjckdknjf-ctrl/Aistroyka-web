/**
 * prepare script: run husky only when not in CI/Vercel.
 * In CI and on Vercel, skip husky so install does not fail (husky not needed there).
 * Locally, run husky to install git hooks.
 */
const { execSync } = require("child_process");

const isCI =
  process.env.CI === "1" ||
  process.env.CI === "true" ||
  process.env.VERCEL === "1" ||
  process.env.VERCEL === "true";

if (isCI) {
  process.exit(0);
}

try {
  execSync("npx husky", { stdio: "inherit", cwd: __dirname + "/.." });
} catch (e) {
  process.exit(e.status ?? 1);
}
