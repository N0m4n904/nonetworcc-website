// What src/content.yaml may name, and the check it passes when the page is
// built.
//
// The `yaml` plugin of vite.config.js hands the parsed file to readContent
// and the page imports what that returns. A treatment or an icon that is not
// listed here, a date in another form or a tool without a name fails the
// build with the place it was read at.

// How a logo is shown, as an entry writes it under `media.treatment`.
export const Treatment = Object.freeze({ Plate: "plate", Past: "past", Rounded: "rounded", Wordmark: "wordmark" });

// The icons a link can have, as an entry writes one under `links[].icon`.
// src/components/IconSprite.vue has a symbol for each.
export const Icon = Object.freeze({ GitHub: "github", GitLab: "gitlab", Instagram: "instagram" });

function checkMember(set, name, where) {
  const members = Object.values(set);
  if (!members.includes(name)) {
    throw new Error(`src/content.yaml: ${where} is "${name}", and has to be one of: ${members.join(", ")}.`);
  }
}

const DATE = /^(?<since>\d{4}) -(?: (?<until>\d{4}))?$/;

// The content writes "2022 -" for what goes on since a year and "2022 - 2026"
// for what went on from a year until a year. The page sets both with a dash.
function formatDate(date, where) {
  const years = DATE.exec(date)?.groups;
  if (!years) {
    throw new Error(`src/content.yaml: ${where} is "${date}", and has to be written as "2022 -" or as "2022 - 2026".`);
  }
  return years.until ? `${years.since} – ${years.until}` : `${years.since} –`;
}

function readEntry(entry, where) {
  const { date, media, links = [] } = entry;
  if (media?.treatment !== undefined) checkMember(Treatment, media.treatment, `${where}.media.treatment`);
  links.forEach((link, n) => {
    if (link.icon !== undefined) checkMember(Icon, link.icon, `${where}.links[${n}].icon`);
  });
  return date === undefined ? entry : { ...entry, date: formatDate(date, `${where}.date`) };
}

// A tool is a name and where that name leads. The address may be left out,
// and a tool without one may be written as its name alone.
function readTool(tool, where) {
  const named = typeof tool === "string" ? { name: tool } : tool;
  if (typeof named?.name !== "string") {
    throw new Error(`src/content.yaml: ${where} is ${JSON.stringify(tool)}, and has to be a name, or a name and an href.`);
  }
  return named;
}

const readList = (list, name, read) => list.map((item, place) => read(item, `${name}[${place}]`));

// The content as the page shows it: every name checked, every date formatted.
export const readContent = ({ work, projects, tools, ...others }) => ({
  ...others,
  work: readList(work, "work", readEntry),
  projects: readList(projects, "projects", readEntry),
  tools: readList(tools, "tools", readTool),
});
