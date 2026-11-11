import assert from "node:assert/strict";
import { test } from "node:test";

import { box, closed, loop, ring, run } from "../src/lib/drawing.js";
import { flattenShape } from "../src/lib/shape.js";
import { drawings } from "./drawings.js";

const STEP = 1.5;

// Closer than a drawing can state two places apart, and far wider than the
// rounding of a ring.
const isSamePlace = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-3;

function assertEachPlaceListedOnce(shape, where) {
  const { points, closed: isClosed } = flattenShape(shape, STEP);
  points.slice(1).forEach((place, i) => {
    assert.ok(!isSamePlace(place, points[i]), `${where} lists the place ${place} twice in a row`);
  });
  if (isClosed && points.length > 1) {
    assert.ok(!isSamePlace(points.at(-1), points[0]), `${where} lists its start ${points[0]} at its end as well`);
  }
}

const SHAPES_THAT_COME_ROUND = {
  "a ring": ring(50, 50, 20),
  "a box": box(0, 0, 40, 30, 5),
  "a box whose corners are its whole sides": box(213, 1, 31, 7, 3.5),
  "a loop": loop([0, 0], [40, 0], [40, 40], [0, 40]),
  "a closed run that repeats its start": closed(run([0, 0], [40, 0], [40, 40], [0, 0])),
  "a run that stops on a place twice": run([0, 0], [40, 0], [40, 0], [40, 40]),
};

for (const [name, shape] of Object.entries(SHAPES_THAT_COME_ROUND)) {
  test(`${name} lists each place once`, () => assertEachPlaceListedOnce(shape, name));
}

for (const { name, drawing } of drawings) {
  test(`every shape of the ${name} lists each place once`, () => {
    drawing.marks.forEach((mark, place) => {
      mark.shapes.forEach((shape) => assertEachPlaceListedOnce(shape, `a ${shape.kind} of mark ${place}`));
    });
  });
}
