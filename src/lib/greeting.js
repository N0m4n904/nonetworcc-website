// A note for whoever opens the console.
//
// The audience for a developer's site is largely other developers, and a fair
// number of them will look. Cheap to leave for them: a few strings, printed
// once, and nothing running afterwards.

import { hasFinePointer } from "./pointer.js";

// The note is printed in the page's own colours rather than in a copy of them.
// A custom property computes to the text it was written as — in the palette's
// case a color-mix() the console will not parse — so each one is resolved by
// asking an element what it would actually paint.
function paints(...properties) {
  const probe = document.createElement("span");
  probe.style.display = "none";
  document.documentElement.append(probe);
  const colours = properties.map((property) => {
    probe.style.color = `var(${property})`;
    return getComputedStyle(probe).color;
  });
  probe.remove();
  return colours;
}

export function greet() {
  const [accent, accentAlt, faint] = paints("--accent-ink", "--accent-alt-ink", "--ink-faint");

  const heading = [
    "font-family: 'Shantell Sans', cursive, sans-serif",
    "font-size: 20px",
    "font-weight: 700",
    `color: ${accent}`,
    "padding: 6px 0 2px",
  ].join(";");

  const quiet = `color:${faint};font-size:12px;line-height:1.6`;
  const key = `color:${accentAlt};font-weight:700`;

  console.log("%cNoah Anleitner", heading);
  console.log(
    "%cBuilt with  %cVue 3 on Vite\n" +
      "%cSource      %chttps://github.com/N0m4n904\n" +
      "%cThe pointer %chttps://github.com/N0m4n904/smartcursor",
    quiet, key,
    quiet, key,
    quiet, key
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
