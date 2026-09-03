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

// The handwriting is only discovered once the stylesheet has been parsed, so
// on a first visit the page is read in the fallback face for a moment and then
// snaps. Telling the browser about it in the head starts that download with
// everything else.
//
// It has to be a plugin: the file is fingerprinted, so its name is not known
// until the bundle exists. Only the latin cut is preloaded — it carries the
// German umlauts too, and latin-ext would be 37kB nobody is waiting on.
function preloadFont() {
  return {
    name: "preload-font",
    enforce: "post",
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html;
      const font = Object.keys(ctx.bundle).find(
        (name) => name.includes("shantell-sans-latin-") && name.endsWith(".woff2")
      );
      if (!font) return html;
      return {
        html,
        tags: [{
          tag: "link",
          attrs: {
            rel: "preload",
            href: `/${font}`,
            as: "font",
            type: "font/woff2",
            crossorigin: "anonymous",
          },
          injectTo: "head-prepend",
        }],
      };
    },
  };
}

export default defineConfig({
  plugins: [vue(), yaml(), preloadFont()],
  build: {
    // Named for what it is, and committed: the server takes the site with
    // `git pull` and runs nothing, so the built page has to be in the repo.
    outDir: "dist",
    emptyOutDir: true,
  },
});
