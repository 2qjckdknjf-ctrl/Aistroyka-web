import net from "node:net";

const start = Number(process.argv[2] ?? 3100);
const end = Number(process.argv[3] ?? start + 200);

function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

for (let port = start; port <= end; port += 1) {
  if (await isFree(port)) {
    console.log(port);
    process.exit(0);
  }
}

console.error(`No free port found in range ${start}-${end}`);
process.exit(1);
