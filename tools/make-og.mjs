// Renders tools/og.html to public/og.png at the size link previews expect.
//
// The card is built from the page's own parts, so it is drawn rather than
// designed twice. Run `npm run og` after changing tools/og.html; the result is
// committed, since nothing runs on the server.

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "public", "og.png");
const PORT = 8199;

// 1200x630 is what Open Graph readers crop to; anything else gets letterboxed.
const WIDTH = 1200;
const HEIGHT = 630;

const TYPES = { ".html": "text/html", ".woff2": "font/woff2", ".css": "text/css" };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://localhost");
      const file = path.join(ROOT, url.pathname === "/" ? "tools/og.html" : url.pathname);
      fs.readFile(file, (err, body) => {
        if (err) return res.writeHead(404).end();
        res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
        res.end(body);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let next = 1;
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  });
  return {
    ready: new Promise((r) => ws.addEventListener("open", r)),
    send(method, params = {}, sessionId) {
      const id = next++;
      ws.send(JSON.stringify({ id, method, params, sessionId }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
  };
}

const server = await serve();
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "og-"));
const chrome = spawn("chromium", ["--headless=new", "--remote-debugging-port=9600",
  `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars",
  "--force-color-profile=srgb"], { stdio: "ignore" });

await wait(2000);
const { webSocketDebuggerUrl } = await fetch("http://localhost:9600/json/version").then((r) => r.json());
const cdp = connect(webSocketDebuggerUrl);
await cdp.ready;

const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
const call = (method, params) => cdp.send(method, params, sessionId);

await call("Emulation.setDeviceMetricsOverride",
  { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
// The card is the site's dark theme, and the palette keys that off the media
// query. Headless Chromium answers it with "light" unless it is told otherwise.
await call("Emulation.setEmulatedMedia",
  { features: [{ name: "prefers-color-scheme", value: "dark" }] });
await call("Page.navigate", { url: `http://localhost:${PORT}/` });
// The handwriting has to have arrived, or the card is rendered in the fallback.
await wait(1500);
await call("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
await wait(300);

const { data } = await call("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(OUT, Buffer.from(data, "base64"));

const size = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`public/og.png written — ${WIDTH}x${HEIGHT}, ${size} kB`);

server.close();
chrome.kill();
process.exit(0);
