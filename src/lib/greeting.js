// A note for whoever opens the console.
//
// The audience for a developer's site is largely other developers, and a fair
// number of them will look. Cheap to leave for them: a few strings, printed
// once, and nothing running afterwards.

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
    "%cEverything drawn on this page is drawn by hand — the outlines, the rings,\n" +
      "the pointer. Two files and no dependencies, if you want to look.\n\n" +
      "%cSource      %chttps://github.com/N0m4n904\n" +
      "%cThe pointer %chttps://github.com/N0m4n904/smartcursor\n\n" +
      "%cPress %cP%c to pick up a pencil and draw on the page.",
    quiet,
    quiet, key,
    quiet, key,
    quiet, key, quiet
  );
}
