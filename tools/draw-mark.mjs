// Draws src/mark.svg.
//
// The mark is a ring cut in two places with a node inside it: "no network",
// as in the name of the domain. It is generated: ideal geometry pushed off
// true by a seeded hand, so it wanders the same way in every run and a rerun
// writes the file that is already committed.
//
// Run `npm run mark` after changing anything here. The icon shown in a browser
// tab, public/images/favicon.png, is a picture of the mark, made once and not
// drawn again, so it does not change when the mark changes here.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRandom, pickAroundZero } from "../src/lib/random.js";
import { placeOnRound } from "../src/lib/shape.js";
import { toRadians } from "../src/lib/transform.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "mark.svg");

// On a 100 grid, so every number below reads as a percentage of the mark.
const CENTER = [50, 50];
const WIGGLE = 2.0; // how far the line strays
const STEP = 13; // how often it strays: one deviation per this much length
const RADIUS = 34;
const NODE = 9;
const STROKE = 7;

// Shares of WIGGLE that a point at the ends of an arc and one in between may
// stray, each half of it inward and half outward.
const END_STRAY = 0.6;
const MIDDLE_STRAY = 1.6;

// One arc, wandering between its two ends. The ends stray less than the middle:
// a hand aims at where it means to start and stop, and drifts in between.
function drawArc(fromDeg, toDeg, random) {
  const span = toDeg - fromDeg;
  const length = (Math.abs(span) / 360) * (2 * Math.PI * RADIUS);
  const steps = Math.max(6, Math.round(length / STEP));
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ends = i === 0 || i === steps;
    const stray = pickAroundZero(random, WIGGLE * (ends ? END_STRAY : MIDDLE_STRAY));
    const [x, y] = placeOnRound(CENTER, RADIUS + stray, toRadians(fromDeg + span * t));
    out.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return out.join("");
}

// Seeded so a rerun draws what the last one drew.
const markRandom = createRandom(3310);
// Two arcs rather than one: a ring with a single break reads as a letter, and
// the gaps sit on the diagonal so neither is where an eye looks first.
const paths = [drawArc(160, 290, markRandom), drawArc(340, 470, markRandom)];

// The box is the drawing rather than the grid it was worked out on: laid out
// beside marks that fill their own boxes, a quarter of empty margin reads as a
// smaller logo rather than as breathing room. Everything sits within the radius
// plus half a stroke plus what the hand strays, and this is that, rounded out.
const edge = 50 - (RADIUS + STROKE / 2 + (WIGGLE * MIDDLE_STRAY) / 2);
const box = `${edge.toFixed(0)} ${edge.toFixed(0)} ${(100 - edge * 2).toFixed(0)} ${(100 - edge * 2).toFixed(0)}`;

fs.writeFileSync(OUT, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" fill="none"
     stroke="currentColor" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="50" cy="50" r="${NODE}" fill="currentColor" />
  ${paths.map((d) => `<path d="${d}" />`).join("\n  ")}
</svg>
`);

console.log(`src/mark.svg written — ${paths.length} arcs, stroke ${STROKE}`);
