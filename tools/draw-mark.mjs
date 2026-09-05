// Draws src/mark.svg.
//
// The mark is a ring cut in two places with a node inside it — "no network",
// which is what the domain says. It is generated rather than drawn, the same
// way the page's card outlines are (see src/lib/sketch.js): ideal geometry
// pushed off true by a seeded hand, so it wanders without being random and a
// rerun produces the file that is already committed.
//
// Run `npm run mark` after changing anything here, then `npm run favicon`,
// which renders the same file to the icon a browser tab wants.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "mark.svg");

// On a 100 grid, so every number below reads as a percentage of the mark.
const WIGGLE = 2.0; // how far the line strays
const STEP = 13; // how often it strays: one deviation per this much length
const RADIUS = 34;
const NODE = 9;
const STROKE = 7;

// Seeded so a rerun draws what the last one drew.
function hand(seed) {
  let state = seed * 9301 + 49297;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280 - 0.5;
  };
}

const at = (deg, r) => [
  50 + Math.cos((deg * Math.PI) / 180) * r,
  50 + Math.sin((deg * Math.PI) / 180) * r,
];

// One arc, wandering between its two ends. The ends stray less than the middle:
// a hand aims at where it means to start and stop, and drifts in between.
function arc(fromDeg, toDeg, rng) {
  const span = toDeg - fromDeg;
  const steps = Math.max(6, Math.round((Math.abs(span) / 360) * (2 * Math.PI * RADIUS)) / STEP);
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ends = i === 0 || i === steps;
    const [x, y] = at(fromDeg + span * t, RADIUS + rng() * WIGGLE * (ends ? 0.6 : 1.6));
    out.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return out.join("");
}

const rng = hand(3310);
// Two arcs rather than one: a ring with a single break reads as a letter, and
// the gaps sit on the diagonal so neither is where an eye looks first.
const paths = [arc(160, 290, rng), arc(340, 470, rng)];

// The box is the drawing rather than the grid it was worked out on: laid out
// beside marks that fill their own boxes, a quarter of empty margin reads as a
// smaller logo rather than as breathing room. Everything sits within the radius
// plus half a stroke plus what the hand strays, and this is that, rounded out.
const edge = 50 - (RADIUS + STROKE / 2 + WIGGLE * 0.8);
const box = `${edge.toFixed(0)} ${edge.toFixed(0)} ${(100 - edge * 2).toFixed(0)} ${(100 - edge * 2).toFixed(0)}`;

fs.writeFileSync(OUT, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" fill="none"
     stroke="currentColor" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="50" cy="50" r="${NODE}" fill="currentColor" />
  ${paths.map((d) => `<path d="${d}" />`).join("\n  ")}
</svg>
`);

console.log(`src/mark.svg written — ${paths.length} arcs, stroke ${STROKE}`);
