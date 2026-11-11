// Every drawing of src/drawings, by the name of its module, and the widths
// the tests draw it at: the width it is composed for and two smaller ones,
// since the hand is steadier and finer on a drawing shown smaller.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const FOLDER = fileURLToPath(new URL("../src/drawings", import.meta.url));
const SHARES_OF_COMPOSED_WIDTH = [1, 0.62, 0.3];

const modules = fs.readdirSync(FOLDER).filter((file) => path.extname(file) === ".js").sort();

export const drawings = await Promise.all(
  modules.map(async (file) => {
    const { default: drawing } = await import(pathToFileURL(path.join(FOLDER, file)).href);
    return { name: path.basename(file, ".js"), drawing };
  })
);

export const listWidths = (drawing) => SHARES_OF_COMPOSED_WIDTH.map((share) => Math.round(drawing.composedWidth * share));
