// A note for whoever opens the console.
//
// The audience for a developer's site is largely other developers, and a fair
// number of them will look. Cheap to leave for them: a few strings, printed
// once, and nothing running afterwards.

import { hasFinePointer } from "./pointer.js";

const BRAND = "#8c0be8";
const CYAN = "#00c6ff";

export function greet() {
  const heading = [
    "font-family: 'Shantell Sans', cursive, sans-serif",
    "font-size: 20px",
    "font-weight: 700",
    `color: ${BRAND}`,
    "padding: 6px 0 2px",
  ].join(";");

  const quiet = "color:#8b85a3;font-size:12px;line-height:1.6";
  const key = `color:${CYAN};font-weight:700`;

  console.log("%cNoah Anleitner", heading);
  console.log(
    "%cThe outlines and the rings are not drawn by hand — they are generated:\n" +
      "a seeded shake along every edge, so each reload draws the same wobble.\n\n" +
      "%cBuilt with  %cVue 3 on Vite\n" +
      "%cSource      %chttps://github.com/N0m4n904\n" +
      "%cThe pointer %chttps://github.com/N0m4n904/smartcursor%c — its own thing,\n" +
      "            two files and no dependencies",
    quiet,
    quiet, key,
    quiet, key,
    quiet, key, quiet
  );

  // The only way in, so it is the only place it is written down. Not mentioned
  // where there is no keyboard to press it on.
  if (hasFinePointer) {
    console.log(
      "%cPress %cP%c to pick up a pencil and draw on the page. Escape puts it down.",
      quiet, key, quiet
    );
  }
}
