// Renders src/mark.svg to public/images/favicon.png.
//
// A tab has no page to take its colour from, so the one place the mark is not
// currentColor is here: it is drawn in the accent, which reads on a light tab
// strip and a dark one alike. Run `npm run favicon` after `npm run mark`; the
// result is committed, since nothing runs on the server.

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "public", "images", "favicon.png");
const PORT = 8198;

// Rendered at 128 and left there: a browser downsamples to the 16 or 32 it
// wants, and the extra pixels cost a few kilobytes once.
const SIZE = 128;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const mark = fs.readFileSync(path.join(ROOT, "src", "mark.svg"), "utf8");
const accent = /--seed-accent:\s*([^;]+);/.exec(
  fs.readFileSync(path.join(ROOT, "public", "palette.css"), "utf8")
)[1].trim();

const page = `<!DOCTYPE html><meta charset="utf-8" />
<style>
  html, body { margin: 0; background: transparent; }
  /* The stroke is drawn to a 100 grid with round caps, so it reaches a little
     past the box it is given; the padding keeps it off the edges of the icon. */
  body { width: ${SIZE}px; height: ${SIZE}px; padding: ${SIZE * 0.06}px;
         box-sizing: border-box; color: ${accent}; }
  svg { width: 100%; height: 100%; display: block; }
</style>
${mark}`;

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

const server = http.createServer((_, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(page);
});
await new Promise((r) => server.listen(PORT, r));

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "favicon-"));
const chrome = spawn("chromium", ["--headless=new", "--remote-debugging-port=9601",
  `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars",
  "--force-color-profile=srgb"], { stdio: "ignore" });

await wait(2000);
const { webSocketDebuggerUrl } = await fetch("http://localhost:9601/json/version").then((r) => r.json());
const cdp = connect(webSocketDebuggerUrl);
await cdp.ready;

const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
const call = (method, params) => cdp.send(method, params, sessionId);

await call("Emulation.setDeviceMetricsOverride",
  { width: SIZE, height: SIZE, deviceScaleFactor: 1, mobile: false });
// An icon sits on whatever the browser's chrome is, so the ground stays out:
// without this the shot comes back on opaque white, which is a white square on
// a dark tab strip.
await call("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
await call("Page.navigate", { url: `http://localhost:${PORT}/` });
await wait(600);

const { data } = await call("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(OUT, Buffer.from(data, "base64"));

const size = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`public/images/favicon.png written — ${SIZE}x${SIZE}, ${size} kB, in ${accent}`);

server.close();
chrome.kill();
process.exit(0);
