const { writeFileSync } = require("node:fs");

if (!process.argv[2]) throw new Error("Pass the private deployment secret file");
const secrets = {};
for (const name of ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"]) {
  const value = process.env[name];
  if (value) secrets[name] = value;
}
writeFileSync(process.argv[2], JSON.stringify(secrets), { mode: 0o600 });
