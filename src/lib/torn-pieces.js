// The projects as pieces of paper torn off at the top and the bottom, each
// taped down at two opposite corners.
//
// The list runs over two leaves, half of it on each and the odd one on the
// left. On a narrow screen the leaves stand one under the other, so the list
// is one column in its own order.
//
// Some pieces were torn from one sheet: the top of one fits the bottom of
// another. A piece on the left fits the piece on the right one row further
// down, and a piece on the right fits the piece on the left two rows further
// down. Each piece is part of one pair at most, and the pairs are made in the
// order of the list. Two pieces next to each other in the list are never a
// pair, so pieces that fit never stand directly one under the other, in two
// columns or in one.

import { EdgeSide } from "./edge.js";
import { createRandom, pickAroundZero, pickOneOf } from "./random.js";

export const Corner = Object.freeze({
  TopLeft: "top-left",
  TopRight: "top-right",
  BottomLeft: "bottom-left",
  BottomRight: "bottom-right",
});

const OPPOSITE_CORNERS = [
  [Corner.TopLeft, Corner.BottomRight],
  [Corner.TopRight, Corner.BottomLeft],
];

// How far a piece is turned at the most, in degrees, half of it either way.
const MOST_TILT = 1.2;

// The seeds of the random numbers of each piece are SEED_STRIDE apart, from
// PIECE_SEED on. The seeds of its edges count up from BOTTOM_SEED and
// TOP_SEED by place.
const PIECE_SEED = 31;
const SEED_STRIDE = 7;
const BOTTOM_SEED = 100;
const TOP_SEED = 200;

// How many of `count` projects stand on the left leaf.
export const countOnLeft = (count) => Math.ceil(count / 2);

// The place each place lies under in the other column, if any: one row
// further down on the right for a place on the left, two rows further down on
// the left for a place on the right.
function findPlaceBelow(place, count, left) {
  const below = place < left ? left + place + 1 : place - left + 2;
  const inOtherColumn = place < left ? below < count : below < left;
  return inOtherColumn ? below : undefined;
}

// For each place whose top fits the bottom of another, the place of that
// other piece.
function pairPieces(count) {
  const left = countOnLeft(count);
  const fitsUnder = new Map();
  const paired = new Set();
  for (let upper = 0; upper < count; upper++) {
    const lower = findPlaceBelow(upper, count, left);
    if (lower === undefined || Math.abs(lower - upper) === 1 || paired.has(upper) || paired.has(lower)) continue;
    fitsUnder.set(lower, upper);
    paired.add(upper).add(lower);
  }
  return fitsUnder;
}

// The pieces of `count` projects, in the order of the list:
//
//   { corners, tilt, bottom: { side, seed }, top: { side, seed, fitsBottomOf } }
//
// `corners` are the two opposite corners taped, and `tilt` is how far the
// piece is turned in degrees. Each edge has its side and the seed it is torn
// with. A top that fits the bottom of another piece has the place of that
// piece as `fitsBottomOf`, and the seed of its bottom.
export function layTornPieces(count) {
  const fitsUnder = pairPieces(count);
  const bottoms = Array.from({ length: count }, (_, place) => ({ side: EdgeSide.Below, seed: BOTTOM_SEED + place }));
  return bottoms.map((bottom, place) => {
    const random = createRandom(PIECE_SEED + place * SEED_STRIDE);
    // The first number of a generator follows its seed closely, so pieces
    // next to each other would be taped alike.
    random();
    const corners = pickOneOf(random, OPPOSITE_CORNERS);
    const tilt = pickAroundZero(random, MOST_TILT);
    const upper = fitsUnder.get(place);
    const top = upper === undefined
      ? { side: EdgeSide.Above, seed: TOP_SEED + place }
      : { side: EdgeSide.Fitting, seed: bottoms[upper].seed, fitsBottomOf: upper };
    return { corners, tilt, bottom, top };
  });
}
