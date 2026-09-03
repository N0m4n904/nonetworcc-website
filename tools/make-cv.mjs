// Renders the site's print view to a PDF, in both languages.
//
// The print stylesheet already turns the page into a one-page CV; this saves
// the result to a file so it can be handed to someone rather than only
// existing if they think to press Ctrl-P. Nothing here designs anything — the
// layout is src/print.css and the words are the page's, so the CV cannot drift
// away from the site.
//
// Run `npm run cv`. It builds first, because it renders the built site, and
// builds again afterwards so the PDFs it just wrote into public/ are copied
// into dist.

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const DIST = path.join(ROOT, "dist");
const PORT = 8198;

const EDITIONS = [
  { file: "noah-anleitner-cv.pdf", accept: "en-GB,en" },
  { file: "noah-anleitner-lebenslauf.pdf", accept: "de-DE,de" },
];

const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".woff2": "font/woff2", ".txt": "text/plain", ".vcf": "text/vcard",
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error("dist/index.html is missing — run `npm run build` first.");
  process.exit(1);
}

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://localhost");
      const file = path.join(DIST, url.pathname === "/" ? "index.html" : url.pathname);
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

// Chromium embeds a variable font as Type 3 glyphs, which triples the size of
// a document that is only words. Ghostscript rewrites it to a third of that
// and the text stays extractable, which matters — a CV gets read by software
// before it is read by a person. Skipped without complaint where gs is absent;
// the PDF is correct either way, only larger.
function shrink(file) {
  const original = fs.statSync(file).size;
  const temp = `${file}.small`;
  try {
    execFileSync("gs", [
      "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.7", "-dPDFSETTINGS=/ebook",
      "-dNOPAUSE", "-dQUIET", "-dBATCH", `-sOutputFile=${temp}`, file,
    ], { stdio: "ignore" });
    const shrunk = fs.statSync(temp).size;
    if (shrunk > 0 && shrunk < original) {
      fs.renameSync(temp, file);
      return shrunk;
    }
    fs.rmSync(temp, { force: true });
  } catch {
    fs.rmSync(temp, { force: true });
  }
  return original;
}

const server = await serve();
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cv-"));
const chrome = spawn("chromium", ["--headless=new", "--remote-debugging-port=9601",
  `--user-data-dir=${profile}`, "--no-first-run"], { stdio: "ignore" });

await wait(2000);
const { webSocketDebuggerUrl } = await fetch("http://localhost:9601/json/version").then((r) => r.json());
const cdp = connect(webSocketDebuggerUrl);
await cdp.ready;

for (const { file, accept } of EDITIONS) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const call = (method, params) => cdp.send(method, params, sessionId);

  // The language is chosen from the browser's setting, so this is how the page
  // is asked for the other one.
  await call("Emulation.setUserAgentOverride", { userAgent: "", acceptLanguage: accept });
  await call("Page.navigate", { url: `http://localhost:${PORT}/` });
  await wait(2500);
  // The handwriting has to have arrived, or the CV is set in the fallback face.
  await call("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
  await wait(400);

  const { data } = await call("Page.printToPDF", {
    // The margins belong to @page in src/print.css, so they are set in one
    // place rather than two that can disagree.
    preferCSSPageSize: true,
    printBackground: false,
    displayHeaderFooter: false,
  });

  const out = path.join(ROOT, "public", file);
  fs.writeFileSync(out, Buffer.from(data, "base64"));
  const before = fs.statSync(out).size;
  const after = shrink(out);
  console.log(
    `public/${file} — ${(after / 1024).toFixed(0)} kB (${accept})` +
      (after < before ? `, down from ${(before / 1024).toFixed(0)} kB` : "")
  );

  await cdp.send("Target.closeTarget", { targetId });
}

server.close();
chrome.kill();
process.exit(0);
