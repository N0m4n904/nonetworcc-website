// Where one leaf ends over the next: a torn edge, or one cut by hand.
//
// An edge is laid out for the width it is shown at. It is not stretched to
// that width, so a tear is as ragged on a phone as on a desk. With the same
// seed and width it comes out the same, so a reload shows the edge of the
// last visit.
//
// Nothing here uses the DOM: an edge is returned as path data, and v-edge
// makes the elements.

import { createRandom, pickAroundZero } from "./random.js";

export const EdgeShape = Object.freeze({ Torn: "torn", Cut: "cut" });

// What an edge is painted with, from the bottom up.
export const EdgeLayer = Object.freeze({
  // The shade the leaf casts on the one beneath it.
  Shade: "shade",
  // The fibre a tear leaves standing.
  Fibre: "fibre",
  Paper: "paper",
  Line: "line",
});

// How each shape runs across `width` pixels: the places its line passes, how
// far its shade drops below that line, and for a tear the fibre under it.
const LAY_LINE = {
  [EdgeShape.Torn]: (width, rng) => {
    const line = [];
    let drift = 0;
    for (let x = 0; x < width; x += 5 + rng() * 13) {
      drift += pickAroundZero(rng, 3.2);
      drift *= 0.82;
      const nick = rng() < 0.07 ? 5 + rng() * 6 : 0;
      line.push([x, 11 + drift + pickAroundZero(rng, 4.5) + nick]);
    }
    line.push([width, 11 + drift]);
    return { line, fibre: line.map(([x, y]) => [x + pickAroundZero(rng, 3), y + 1.6 + rng() * 2.4]), drop: 3.5 };
  },
  [EdgeShape.Cut]: (width, rng) => {
    const line = [];
    let drift = 0;
    for (let x = 0; x < width; x += 46 + rng() * 60) {
      drift += pickAroundZero(rng, 1.8);
      drift *= 0.7;
      line.push([x, 2.5 + drift]);
    }
    line.push([width, 2.5 + drift]);
    return { line, drop: 2.5 };
  },
};

const passThrough = (places) => places.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L");

// The area between the top of the edge and a line, the line let down by `drop`.
const fillDownTo = (width, places, drop = 0) =>
  `M0 0L${passThrough(places.map(([x, y]) => [x, y + drop]))}L${width} 0Z`;

// The edge of `shape`, `width` pixels wide: its layers from the bottom up,
// each with the path data that paints it.
export function layEdge(shape, { width, seed }) {
  const { line, fibre, drop } = LAY_LINE[shape](width, createRandom(seed));
  return [
    { layer: EdgeLayer.Shade, d: fillDownTo(width, fibre ?? line, drop) },
    ...(fibre ? [{ layer: EdgeLayer.Fibre, d: fillDownTo(width, fibre) }] : []),
    { layer: EdgeLayer.Paper, d: fillDownTo(width, line) },
    { layer: EdgeLayer.Line, d: `M${passThrough(line)}` },
  ];
}
