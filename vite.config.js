import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { parse } from "yaml";

const DRAWINGS = fileURLToPath(new URL("./src/drawings", import.meta.url));
const WORDS = fileURLToPath(new URL("./src/lib", import.meta.url));
const EVALUATE_DRAWING = new URL("./tools/evaluate-drawing.mjs", import.meta.url);

// YAML becomes a module at build time rather than something the browser has to
// fetch and parse. The page ships the content, not a parser: `yaml` stays a
// build dependency and never reaches the bundle.
function yaml() {
  return {
    name: "yaml",
    transform(code, id) {
      if (!id.endsWith(".yaml") && !id.endsWith(".yml")) return null;
      return {
        code: `export default ${JSON.stringify(parse(code))}`,
        map: { mappings: "" },
      };
    },
  };
}

const listFiles = (folder) => fs.readdirSync(folder).map((name) => path.join(folder, name));

const evaluateDrawing = (file) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(EVALUATE_DRAWING, { workerData: pathToFileURL(file).href });
    worker.once("message", resolve);
    // Vite adds to the stack of an error of a plugin, and the stack of an
    // error that comes out of a worker is read-only.
    worker.once("error", (thrown) => reject(new Error(thrown.message)));
  });

// A module of src/drawings builds its drawing with the words of
// src/lib/drawing.js, and a word throws when it is called wrongly. Each module
// is evaluated here, when the page is built and in the dev server, and the
// page imports the finished drawing as data. A wrongly written drawing fails
// the build, and the words are not part of the bundle.
function drawings() {
  return {
    name: "drawings",
    async load(id) {
      const [file] = id.split("?");
      if (path.dirname(file) !== DRAWINGS || path.extname(file) !== ".js") return null;
      // A drawing is evaluated again after an edit to a word or to the
      // geometry it reads.
      for (const source of [...listFiles(DRAWINGS), ...listFiles(WORDS)]) this.addWatchFile(source);
      return `export default ${JSON.stringify(await evaluateDrawing(file))}`;
    },
  };
}

export default defineConfig({
  plugins: [vue(), yaml(), drawings()],
  build: {
    // Named for what it is, and committed: the server takes the site with
    // `git pull` and runs nothing, so the built page has to be in the repo.
    outDir: "dist",
    emptyOutDir: true,
  },
});
