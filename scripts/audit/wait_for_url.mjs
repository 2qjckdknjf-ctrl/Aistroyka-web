const url = process.argv[2];
const timeoutMs = Number(process.argv[3] ?? 90_000);

if (!url) {
  console.error("Usage: node scripts/audit/wait_for_url.mjs <url> [timeoutMs]");
  process.exit(2);
}

const deadline = Date.now() + timeoutMs;
let lastError = "";

while (Date.now() < deadline) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    if (res.status > 0 && res.status < 500) {
      console.log(`Ready: ${url} returned ${res.status}`);
      process.exit(0);
    }
    lastError = `status ${res.status}`;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

console.error(`Timed out waiting for ${url}: ${lastError}`);
process.exit(1);
