import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const KERNEL_SRC = fileURLToPath(new URL(".", import.meta.url));

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("roma-kernel boundary", () => {
  it("does not import from apps/web or platform-admin", () => {
    const forbidden = [/platform-admin/, /apps\/web/, /@\/lib/, /next\//, /react/];
    const files = collectTsFiles(KERNEL_SRC);
    expect(files.length).toBeGreaterThan(10);
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(src, file).not.toMatch(pattern);
      }
    }
  });
});
