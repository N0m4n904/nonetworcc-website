// What Instagram's embed expects of a page and writes into it.
//
// A post is embedded as a blockquote with the class `instagram-media` and the
// address of the post. Instagram's script puts a frame with the post in the
// place of every such blockquote that is in the document when it runs.

const EMBED_SCRIPT = "https://www.instagram.com/embed.js";

// The value of `data-instgrm-version` in the embed markup Instagram hands out
// for a post.
export const EMBED_VERSION = "14";

// Read off the frames Instagram's script made on 2026-11-11. Once a post is
// in its frame, the script gives the frame this class and writes its height
// as an attribute. It writes these two widths on the frame as the least and
// the most, in pixels.
export const POST_SHOWN_CLASS = "instagram-media-rendered";
export const POST_NARROWEST = 326;
export const POST_WIDEST = 540;

// Loads Instagram's script, which sends the address of the visitor to Meta.
// Returns whether the script arrived: a content blocker, the tracking
// protection of a browser or a missing connection stops it.
export const loadEmbedScript = () =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = EMBED_SCRIPT;
    script.addEventListener("load", () => resolve(true), { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove();
        resolve(false);
      },
      { once: true }
    );
    document.body.append(script);
  });
