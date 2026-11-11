// What the hand draws. The strokes of every drawing and the edges are
// recorded in test/hand.test.js.snapshot, as a digest of their path data.
// After a change to the look that is meant, this records them again:
//
//   node --test --test-update-snapshots "test/*.test.js"

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

import { closed, course, drawing, loop, plain, rotation, placed, smooth } from "../src/lib/drawing.js";
import { EdgeShape, layEdge } from "../src/lib/edge.js";
import { drawByHand } from "../src/lib/hand.js";
import { toRadians } from "../src/lib/transform.js";
import { drawings, listWidths } from "./drawings.js";

const SEED = 5;

// What was drawn, as one line of text per path: a path of a pass is its place
// in the order of drawing and its path data.
const digest = (lines) => createHash("sha256").update(lines.join("\n")).digest("hex");

const listPaths = (passes) =>
  passes.flatMap((pass, n) =>
    pass.flatMap(({ tone, strokes }) => [
      ...(tone ? [`pass ${n} tone ${tone.order} ${tone.d}`] : []),
      ...strokes.map(({ d, order, again }) => `pass ${n} stroke ${order}${again ? " again" : ""} ${d}`),
    ])
  );

for (const { name, drawing: written } of drawings) {
  test(`the hand draws the ${name} as recorded`, (t) => {
    for (const shownWidth of listWidths(written)) {
      const { strokeCount, passes } = drawByHand(written, { shownWidth, seed: SEED });
      t.assert.snapshot({ shownWidth, strokeCount, paths: digest(listPaths(passes)) });
    }
  });
}

test("the edges are laid out as recorded", (t) => {
  for (const shape of Object.values(EdgeShape)) {
    for (const width of [1920, 1366, 390]) {
      const layers = layEdge(shape, { width, seed: SEED });
      t.assert.snapshot({ shape, width, layers: digest(layers.map(({ layer, d }) => `${layer} ${d}`)) });
    }
  }
});

// A circle of places, wide enough at 400 pixels that the hand looks for
// corners in it, turned so that it leaves its start in another direction.
const PLACES_ROUND = [0, 60, 120, 180, 240, 300].map((degrees) => [
  200 + 150 * Math.cos(toRadians(degrees)),
  200 + 150 * Math.sin(toRadians(degrees)),
]);
const [start, ...others] = PLACES_ROUND;
const SMOOTH_CLOSED_CURVES = {
  "a loop": loop(...PLACES_ROUND),
  "a closed course that is led back to its start": closed(course(start, smooth(...others, start))),
};

for (const [name, shape] of Object.entries(SMOOTH_CLOSED_CURVES)) {
  test(`${name} is one run of the hand whichever way it leaves its start`, () => {
    for (const degrees of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const turned = drawing(
        { name: "turned", viewBox: [0, 0, 400, 400], composedWidth: 400 },
        placed(rotation(degrees, [200, 200]), plain(shape))
      );
      const { strokeCount, passes } = drawByHand(turned, { shownWidth: 400, seed: SEED });
      assert.equal(strokeCount, 1, `turned by ${degrees} degrees`);
      assert.equal(passes[0][0].strokes.length, 1, `turned by ${degrees} degrees`);
    }
  });
}
