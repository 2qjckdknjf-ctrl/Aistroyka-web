import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const webRoot = path.join(root, "apps/web");
const outputJson = path.join(root, "docs/audit/button_inventory.json");
const outputCsv = path.join(root, "docs/audit/button_inventory.csv");

const scanRoots = [
  path.join(webRoot, "app"),
  path.join(webRoot, "components"),
  path.join(webRoot, "lib"),
].filter((dir) => fs.existsSync(dir));

const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const dashboardPathToken = `${path.sep}(dashboard)${path.sep}`;
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    if (full.includes(`${path.sep}app${path.sep}`) && !full.includes(dashboardPathToken)) continue;
    files.push(full);
  }
}

for (const dir of scanRoots) walk(dir);

const clickableNames = new Set([
  "Link",
  "a",
  "button",
  "Button",
  "IconButton",
  "MenuItem",
  "DropdownMenuItem",
  "CommandItem",
]);

function attrText(attrs, name) {
  const found = attrs.properties.find((prop) => ts.isJsxAttribute(prop) && prop.name.getText() === name);
  if (!found || !found.initializer) return "";
  if (ts.isStringLiteral(found.initializer)) return found.initializer.text;
  if (ts.isJsxExpression(found.initializer) && found.initializer.expression) {
    const expression = found.initializer.expression;
    if (ts.isStringLiteral(expression)) return expression.text;
    if (ts.isConditionalExpression(expression) && ts.isStringLiteral(expression.whenTrue)) return expression.whenTrue.text;
    return expression.getText();
  }
  return found.initializer.getText();
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function bestLabel(node) {
  const attrs = node.openingElement?.attributes ?? node.attributes;
  const aria = attrText(attrs, "aria-label") || attrText(attrs, "title");
  if (aria) return cleanText(aria);
  if (!node.children) return "";
  const text = node.children
    .map((child) => {
      if (ts.isJsxText(child)) return child.getText();
      if (ts.isJsxExpression(child) && child.expression) return child.expression.getText();
      return "";
    })
    .join(" ");
  return cleanText(text);
}

function cleanText(value) {
  return value.replace(/\s+/g, " ").replace(/[{}"`']/g, "").trim().slice(0, 160);
}

function routeFromFile(absPath) {
  const rel = path.relative(webRoot, absPath);
  if (!rel.startsWith(`app${path.sep}`)) return "dashboard-shared";
  const parts = rel.split(path.sep);
  const localeIdx = parts.indexOf("[locale]");
  if (localeIdx === -1) return "dashboard-app";
  const routeParts = parts
    .slice(localeIdx + 1, -1)
    .filter((part) => !part.startsWith("("))
    .map((part) => (part.startsWith("[") && part.endsWith("]") ? `:${part.slice(1, -1)}` : part));
  return `/{locale}/${routeParts.join("/")}`.replace(/\/$/, "") || "/{locale}";
}

function kindFor(tag, attrs) {
  const type = attrText(attrs, "type");
  if (tag === "Link" || tag === "a") return "Link";
  if (/menu/i.test(tag)) return "menuItem";
  if (type === "submit") return "formSubmit";
  if (/icon/i.test(tag) || attrText(attrs, "aria-label")) return "iconButton";
  return "button";
}

const entries = [];
const seen = new Set();

function addEntry(entry) {
  const key = `${entry.sourceFile}:${entry.line}:${entry.kind}:${entry.target}:${entry.labelText}`;
  if (seen.has(key)) return;
  seen.add(key);
  entries.push(entry);
}

for (const absPath of files) {
  const rel = path.relative(root, absPath);
  const text = fs.readFileSync(absPath, "utf8");
  const sf = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  function visit(node) {
    if (ts.isJsxElement(node)) {
      const opening = node.openingElement;
      const tag = opening.tagName.getText(sf);
      if (clickableNames.has(tag)) {
        const attrs = opening.attributes;
        const line = lineOf(sf, opening);
        const href = attrText(attrs, "href");
        const onClick = attrText(attrs, "onClick");
        const type = attrText(attrs, "type");
        const testId = attrText(attrs, "data-testid");
        addEntry({
          id: testId || `generated.${rel.replace(/[^a-zA-Z0-9]+/g, ".")}.${line}`,
          kind: kindFor(tag, attrs),
          labelText: bestLabel(node),
          pageRoute: routeFromFile(absPath),
          target: href || onClick || (type === "submit" ? "form submit" : ""),
          sourceFile: rel,
          line,
          notes: testId ? "" : "generated id; no data-testid",
        });
      }
    }

    if (ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf);
      if (clickableNames.has(tag)) {
        const attrs = node.attributes;
        const line = lineOf(sf, node);
        const href = attrText(attrs, "href");
        const onClick = attrText(attrs, "onClick");
        const type = attrText(attrs, "type");
        const testId = attrText(attrs, "data-testid");
        addEntry({
          id: testId || `generated.${rel.replace(/[^a-zA-Z0-9]+/g, ".")}.${line}`,
          kind: kindFor(tag, attrs),
          labelText: attrText(attrs, "aria-label") || attrText(attrs, "title") || attrText(attrs, "children"),
          pageRoute: routeFromFile(absPath),
          target: href || onClick || (type === "submit" ? "form submit" : ""),
          sourceFile: rel,
          line,
          notes: testId ? "" : "generated id; no data-testid",
        });
      }
    }

    if (ts.isCallExpression(node)) {
      const expression = node.expression.getText(sf);
      if (expression.endsWith(".push") || expression === "router.push") {
        const line = lineOf(sf, node);
        addEntry({
          id: `generated.${rel.replace(/[^a-zA-Z0-9]+/g, ".")}.router-push.${line}`,
          kind: "button",
          labelText: "",
          pageRoute: routeFromFile(absPath),
          target: `router.push(${node.arguments.map((arg) => arg.getText(sf)).join(", ")})`,
          sourceFile: rel,
          line,
          notes: "fallback router.push call; source CTA may be nearby",
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);

  for (const token of ["data-testid=", "onClick=", "href=", "router.push(", "Link href"]) {
    let idx = text.indexOf(token);
    while (idx !== -1) {
      const line = text.slice(0, idx).split("\n").length;
      const existing = entries.some((entry) => entry.sourceFile === rel && Math.abs(entry.line - line) <= 1);
      if (!existing) {
        addEntry({
          id: `generated.${rel.replace(/[^a-zA-Z0-9]+/g, ".")}.fallback.${line}`,
          kind: token.includes("href") || token.includes("Link") ? "Link" : "button",
          labelText: "",
          pageRoute: routeFromFile(absPath),
          target: token,
          sourceFile: rel,
          line,
          notes: "fallback text scan",
        });
      }
      idx = text.indexOf(token, idx + token.length);
    }
  }
}

entries.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile) || a.line - b.line);

fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(entries, null, 2)}\n`);

function csv(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const header = ["id", "kind", "labelText", "pageRoute", "target", "sourceFile", "line", "notes"];
const rows = [header.join(","), ...entries.map((entry) => header.map((key) => csv(entry[key])).join(","))];
fs.writeFileSync(outputCsv, `${rows.join("\n")}\n`);

console.log(`Wrote ${entries.length} dashboard CTA inventory entries`);
console.log(outputJson);
console.log(outputCsv);
