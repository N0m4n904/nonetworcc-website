// The mark of the site: a ring cut in two places with a node inside it, "no
// network", as in the name of the domain.
//
// Ideal geometry pushed off true by a seeded hand, so it wanders the same way
// in every run. `npm run mark` writes it into src/mark.svg, and `npm test`
// records it. The icon shown in a browser tab, public/images/favicon.png, is a
// picture of the mark, made once and not drawn again, so it does not change
// when the mark changes here.

import { h } from "vue";
import { renderToString } from "vue/server-renderer";

import { writePolyline } from "../src/lib/path-data.js";
import { createRandom, pickAroundZero } from "../src/lib/random.js";
import { divideArc, placeOnRound } from "../src/lib/shape.js";
import { toRadians } from "../src/lib/transform.js";

// Worked out on a grid of 100, so every number below reads as a percentage of
// it.
const GRID = 100;
const CENTER = [GRID / 2, GRID / 2];
const WIGGLE = 2.0; // how far the line strays
const STEP = 13; // how often it strays: one deviation per this much length
const RADIUS = 34;
const NODE = 9;
const STROKE = 7;

// Shares of WIGGLE that a point at the ends of an arc and one in between may
// stray, each half of it inward and half outward.
const END_STRAY = 0.6;
const MIDDLE_STRAY = 1.6;

// Everything drawn lies within this distance from the centre: the radius, half
// a stroke and the farthest the hand strays.
const REACH = RADIUS + STROKE / 2 + (WIGGLE * MIDDLE_STRAY) / 2;

// A ring with a single break reads as a letter, so the mark is two arcs. Their
// angles are in degrees. The gaps between them sit on the diagonal, so neither
// is where an eye looks first.
const ARCS = [
  { from: 160, to: 290 },
  { from: 340, to: 470 },
];

// The places one arc passes, each at a seeded distance from the circle. The
// ends stray less than the middle: a hand aims at where it means to start and
// stop, and drifts in between.
function drawArc({ from, to }, random) {
  const angles = divideArc(RADIUS, toRadians(from), toRadians(to), STEP);
  const last = angles.length - 1;
  return angles.map((angle, i) => {
    const share = i === 0 || i === last ? END_STRAY : MIDDLE_STRAY;
    return placeOnRound(CENTER, RADIUS + pickAroundZero(random, WIGGLE * share), angle);
  });
}

// The mark as SVG elements, stroked in currentColor so that it is drawn in the
// colour of the text around it.
function drawMark() {
  // Seeded so a rerun draws what the last one drew.
  const random = createRandom(3310);
  // The box fits the drawing, and is smaller than the grid it was worked out
  // on: beside marks that fill their own boxes, a quarter of empty margin makes
  // the logo look smaller. Each side lies REACH from the centre, to the nearest
  // whole unit.
  const viewBox = [CENTER[0] - REACH, CENTER[1] - REACH, REACH * 2, REACH * 2].map((n) => n.toFixed(0)).join(" ");
  return h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": STROKE,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("circle", { cx: CENTER[0], cy: CENTER[1], r: NODE, fill: "currentColor" }),
      ...ARCS.map((arc) => h("path", { d: writePolyline(drawArc(arc, random)) })),
    ],
  );
}

// The text of src/mark.svg.
export const writeMark = async () => `${await renderToString(drawMark())}\n`;
