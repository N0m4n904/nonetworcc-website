// The projects as torn pieces of paper: where they are taped, which of them
// fit together, and the other side of a tear.

import assert from "node:assert/strict";
import { test } from "node:test";

import { EdgeLayer, EdgeShape, EdgeSide, layEdge } from "../src/lib/edge.js";
import { Corner, countOnLeft, layTornPieces } from "../src/lib/torn-pieces.js";

const OPPOSITE = new Map([
  [Corner.TopLeft, Corner.BottomRight],
  [Corner.TopRight, Corner.BottomLeft],
]);

const COUNTS = Array.from({ length: 12 }, (_, n) => n + 1);

// Each pair as [upper, lower]: the place whose bottom is torn, and the place
// whose top fits it.
const findPairs = (pieces) =>
  pieces.flatMap(({ top }, lower) => (top.side === EdgeSide.Fitting ? [[top.fitsBottomOf, lower]] : []));

for (const count of COUNTS) {
  const pieces = layTornPieces(count);
  const left = countOnLeft(count);
  const columnOf = (place) => (place < left ? "left" : "right");

  test(`${count} projects: every piece is taped at two opposite corners`, () => {
    for (const { corners } of pieces) {
      assert.equal(corners.length, 2);
      assert.equal(OPPOSITE.get(corners[0]), corners[1]);
    }
  });

  test(`${count} projects: a fitting top has the tear of the bottom it fits`, () => {
    for (const [upper, lower] of findPairs(pieces)) {
      assert.deepEqual(pieces[lower].top.seed, pieces[upper].bottom.seed);
    }
  });

  test(`${count} projects: pieces that fit stand in different columns, never next to each other in the list`, () => {
    for (const [upper, lower] of findPairs(pieces)) {
      assert.notEqual(columnOf(upper), columnOf(lower), `${upper} and ${lower} share a column`);
      assert.notEqual(Math.abs(upper - lower), 1, `${lower} stands directly next to ${upper} in one column`);
    }
  });

  test(`${count} projects: each piece is part of one pair at most`, () => {
    const places = findPairs(pieces).flat();
    assert.equal(new Set(places).size, places.length);
  });
}

test("with seven projects, some pieces fit, and each column is taped along both diagonals", () => {
  const pieces = layTornPieces(7);
  assert.ok(findPairs(pieces).length > 0);
  const left = countOnLeft(7);
  for (const column of [pieces.slice(0, left), pieces.slice(left)]) {
    assert.equal(new Set(column.map(({ corners }) => corners[0])).size, 2);
  }
});

test("the pieces are laid out the same on every visit", () => {
  assert.deepEqual(layTornPieces(7), layTornPieces(7));
});

test("the other side of a tear has the same line, with paper from the line down to its depth", () => {
  const torn = layEdge(EdgeShape.Torn, { side: EdgeSide.Below, width: 420, seed: 105 });
  const fitting = layEdge(EdgeShape.Torn, { side: EdgeSide.Fitting, width: 420, depth: 26, seed: 105 });
  const lineOf = (layers) => layers.find(({ layer }) => layer === EdgeLayer.Line).d;
  assert.equal(lineOf(fitting), lineOf(torn));
  const paper = fitting.find(({ layer }) => layer === EdgeLayer.Paper).d;
  assert.match(paper, /^M0\.0 26\.0L/);
  assert.match(paper, /L420\.0 26\.0Z$/);
});
