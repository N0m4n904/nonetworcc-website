import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { parse } from "yaml";

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

export default defineConfig({
  plugins: [vue(), yaml()],
  build: {
    // Named for what it is, and committed: the server takes the site with
    // `git pull` and runs nothing, so the built page has to be in the repo.
    outDir: "dist",
    emptyOutDir: true,
  },
});
