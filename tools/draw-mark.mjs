// Writes the mark drawn in tools/mark.mjs into src/mark.svg. Run by
// `npm run mark`.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { writeMark } from "./mark.mjs";

const MARK_FILE = new URL("../src/mark.svg", import.meta.url);

await writeFile(MARK_FILE, await writeMark());
console.log(`${fileURLToPath(MARK_FILE)} written`);
