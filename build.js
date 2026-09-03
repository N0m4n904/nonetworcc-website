// Draws the lists in index.html from src/content.yaml.
//
// The page is served as static files and pulled onto the server with git, so
// nothing runs there: this runs here, and its output is committed like any
// other source. Run it with `npm run build` after editing the YAML.
//
// index.html is rewritten in place rather than generated from a template.
// A template would be a second copy of the whole page to keep in step with
// this one; instead the file stays the page, and only the regions between the
// markers below belong to this script. Running it twice changes nothing.

const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const ROOT = __dirname;
const PAGE = path.join(ROOT, "index.html");
const CONTENT = path.join(ROOT, "src", "content.yaml");

const WRAP = 96; // where generated prose folds, to match the hand-written file

const escapeText = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (value) => escapeText(value).replace(/"/g, "&quot;");

// Long prose folds across lines the way the hand-written markup does; short
// prose stays on one. HTML collapses the difference, so this is only so the
// generated file reads like the rest of it.
function paragraph(className, content, indent) {
  const pad = " ".repeat(indent);
  const text = escapeText(content).replace(/\s+/g, " ").trim();
  const oneLine = `${pad}<p class="${className}">${text}</p>`;
  if (oneLine.length <= WRAP + indent) return [oneLine];

  const inner = " ".repeat(indent + 2);
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (inner + line + " " + word).length > WRAP) {
      lines.push(inner + line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(inner + line);
  return [`${pad}<p class="${className}">`, ...lines, `${pad}</p>`];
}

function link(entry, indent) {
  const pad = " ".repeat(indent);
  const href = escapeAttr(entry.href);
  const text = escapeText(entry.text);
  if (!entry.icon) return [`${pad}<a href="${href}">${text}</a>`];
  return [
    `${pad}<a href="${href}">`,
    `${pad}  <svg class="icon" aria-hidden="true"><use href="#icon-${escapeAttr(entry.icon)}"></use></svg>${text}`,
    `${pad}</a>`,
  ];
}

// One card. No media means no mark column, which is what tile--plain says.
function tile(entry, indent) {
  const pad = " ".repeat(indent);
  const out = [];

  out.push(`${pad}<article class="tile${entry.media ? "" : " tile--plain"}" data-reveal data-live>`);

  if (entry.media) {
    const treatment = entry.media.treatment ? ` tile__media--${escapeAttr(entry.media.treatment)}` : "";
    out.push(`${pad}  <div class="tile__media${treatment}">`);
    out.push(`${pad}    <img src="${escapeAttr(entry.media.src)}" alt="${escapeAttr(entry.media.alt || "")}" />`);
    out.push(`${pad}  </div>`);
  }

  out.push(`${pad}  <div>`);
  const badge = entry.badge ? ` <span class="badge">${escapeText(entry.badge)}</span>` : "";
  out.push(`${pad}    <h3 class="heading tile__title">${escapeText(entry.title)}${badge}</h3>`);
  out.push(...paragraph("tile__body", entry.body, indent + 4));
  if (entry.note) out.push(...paragraph("tile__note", entry.note, indent + 4));

  if (entry.links && entry.links.length) {
    out.push(`${pad}    <div class="meta">`);
    for (const one of entry.links) out.push(...link(one, indent + 6));
    out.push(`${pad}    </div>`);
  }

  out.push(`${pad}  </div>`);
  out.push(`${pad}</article>`);
  return out;
}

// A stand-in until a visitor asks for the posts. It carries the permalink the
// script needs and nothing that would contact Meta.
function stub(permalink, indent) {
  const pad = " ".repeat(indent);
  return [
    `${pad}<div class="post-stub" data-reveal data-live data-permalink="${escapeAttr(permalink)}">`,
    `${pad}  <svg aria-hidden="true"><use href="#icon-instagram"></use></svg>`,
    `${pad}  <strong>Instagram post</strong>`,
    `${pad}</div>`,
  ];
}

function handle(garage) {
  const at = `@${escapeText(garage.handle)}`;
  return [
    `<a class="accent" data-live href="${escapeAttr(garage.profile)}"` +
      `><span class="accent__face">${at}</span>` +
      `<span class="accent__face accent__face--alt" aria-hidden="true">${at}</span></a>`,
  ];
}

// Replaces what sits between a marker pair, keeping the markers. Blank when a
// region generates nothing, so an emptied list empties the page rather than
// leaving the last build's tiles behind.
function fill(page, name, lines) {
  const open = `<!-- content:${name} -->`;
  const close = `<!-- /content:${name} -->`;
  const from = page.indexOf(open);
  const to = page.indexOf(close);
  if (from === -1 || to === -1) throw new Error(`index.html has no ${open} ... ${close} region`);
  if (to < from) throw new Error(`${close} comes before ${open} in index.html`);

  const body = lines.length ? `\n${lines.join("\n")}\n` + " ".repeat(columnOf(page, from)) : "";
  return page.slice(0, from + open.length) + body + page.slice(to);
}

// How far the opening marker is indented, so the closing one lands under it.
function columnOf(page, index) {
  const lineStart = page.lastIndexOf("\n", index) + 1;
  return index - lineStart;
}

// Inline regions sit inside a sentence: no newlines, no indentation.
function fillInline(page, name, html) {
  const open = `<!-- content:${name} -->`;
  const close = `<!-- /content:${name} -->`;
  const from = page.indexOf(open);
  const to = page.indexOf(close);
  if (from === -1 || to === -1) throw new Error(`index.html has no ${open} ... ${close} region`);
  return page.slice(0, from + open.length) + html + page.slice(to);
}

function main() {
  const content = YAML.parse(fs.readFileSync(CONTENT, "utf8"));
  const before = fs.readFileSync(PAGE, "utf8");

  // Tiles are separated by a blank line the way they were written by hand;
  // stubs run together, as they did.
  const spaced = (entries) =>
    entries.flatMap((entry, i) => (i ? ["", ...tile(entry, 10)] : tile(entry, 10)));

  const sections = [
    ["work", spaced(content.work || [])],
    ["projects", spaced(content.projects || [])],
    ["garage", ((content.garage && content.garage.posts) || []).flatMap((url) => stub(url, 12))],
  ];

  let after = before;
  for (const [name, lines] of sections) after = fill(after, name, lines);
  if (content.garage && content.garage.handle) {
    after = fillInline(after, "garage-handle", handle(content.garage).join(""));
  }

  const counts = sections.map(([name], i) => {
    const list = i === 2 ? content.garage.posts : content[name];
    return `${(list || []).length} ${name}`;
  });

  if (after === before) {
    console.log(`index.html already matches src/content.yaml (${counts.join(", ")})`);
    return;
  }
  fs.writeFileSync(PAGE, after);
  console.log(`index.html rebuilt from src/content.yaml (${counts.join(", ")})`);
}

main();
