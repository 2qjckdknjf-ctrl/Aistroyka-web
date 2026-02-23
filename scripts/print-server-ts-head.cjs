const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "..", "lib", "supabase", "server.ts");
const s = fs.readFileSync(p, "utf8").split("\n").slice(0, 60).join("\n");
const out = "===SERVER.TS HEAD===\n" + s + "\n===END===";
const logFile = path.join(__dirname, "..", "build-server-ts-head.log");
fs.writeFileSync(logFile, out, "utf8");
console.log(out);
