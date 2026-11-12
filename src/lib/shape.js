// The shapes a drawing is made of, and the places each of them passes.
//
// A shape is plain data: numbers in the units of its drawing, with y running
// down and angles in degrees clockwise from three o'clock. A place is [x, y].
// The words that make a shape are in drawing.js. Nothing here knows how a
// shape is drawn: the hand asks for the places a shape passes and draws over
// them.

import { toRadians } from "./transform.js";

export const Shape = Object.freeze({
  Course: "course",
  Loop: "loop",
  Ring: "ring",
  Arc: "arc",
  Box: "box",
});

// How a course gets from the place it has reached to its next one.
export const Link = Object.freeze({
  Straight: "straight",
  Cubic: "cubic",
  Smooth: "smooth",
});

function flattenCubic(p0, p1, p2, p3, step, out) {
  const rough =
    Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) +
    Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) +
    Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
  const n = Math.max(4, Math.ceil(rough / step));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
}

// The two controls of the cubic that is the span of a Catmull-Rom curve from
// `from` to `to`. The curve comes from `before` and goes on to `after`.
export const findSplineControls = (before, from, to, after) => [
  [from[0] + (to[0] - before[0]) / 6, from[1] + (to[1] - before[1]) / 6],
  [to[0] - (after[0] - from[0]) / 6, to[1] - (after[1] - from[1]) / 6],
];

// A Catmull-Rom curve, span by span. `spotAt` is asked for the spot before
// the first span and the one after the last as well.
function flattenSpline(spotAt, spans, step, out) {
  for (let i = 0; i < spans; i++) {
    const [before, from, to, after] = [i - 1, i, i + 1, i + 2].map(spotAt);
    flattenCubic(from, ...findSplineControls(before, from, to, after), to, step, out);
  }
}

// Angles are in radians from here on.
export const placeOnRound = ([cx, cy], radius, angle) => [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];

// The angles that cut an arc of `radius` from `from` to `to` into even steps,
// none longer than `step` along the arc and at least three of them. Both ends
// are listed.
export function divideArc(radius, from, to, step) {
  const n = Math.max(3, Math.ceil((Math.abs(to - from) * radius) / step));
  return Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);
}

// The caller adds the place the arc starts at.
function flattenArc(center, radius, from, to, step, out) {
  for (const angle of divideArc(radius, from, to, step).slice(1)) out.push(placeOnRound(center, radius, angle));
}

const FOLLOW_LINK = {
  [Link.Straight]: ({ places }, points) => points.push(...places),
  [Link.Cubic]: ({ controls: [control1, control2], end }, points, step) =>
    flattenCubic(points.at(-1), control1, control2, end, step, points),
  [Link.Smooth]: ({ places }, points, step) => {
    const spots = [points.at(-1), ...places];
    const last = spots.length - 1;
    // The first spot has none before it to bend from and the last none after
    // it to bend towards: each stands in for the neighbour it lacks.
    flattenSpline((i) => spots[Math.min(Math.max(i, 0), last)], last, step, points);
  },
};

const FLATTEN_SHAPE = {
  [Shape.Course]: ({ start, links, closed }, step) => {
    const points = [start];
    for (const link of links) FOLLOW_LINK[link.kind](link, points, step);
    return { points, closed };
  },
  [Shape.Loop]: ({ places }, step) => {
    const count = places.length;
    const points = [places[0]];
    flattenSpline((i) => places[(i + count) % count], count, step, points);
    return { points, closed: true };
  },
  [Shape.Ring]: ({ center, radius, from }, step) => {
    const start = toRadians(from);
    const points = [placeOnRound(center, radius, start)];
    flattenArc(center, radius, start, start + Math.PI * 2, step, points);
    return { points, closed: true };
  },
  [Shape.Arc]: ({ center, radius, from, to }, step) => {
    const points = [placeOnRound(center, radius, toRadians(from))];
    flattenArc(center, radius, toRadians(from), toRadians(to), step, points);
    return { points, closed: false };
  },
  [Shape.Box]: ({ x, y, width, height, radius }, step) => {
    const r = Math.min(radius, width / 2, height / 2);
    const right = x + width;
    const bottom = y + height;
    const points = [[x + r, y], [right - r, y]];
    flattenArc([right - r, y + r], r, -Math.PI / 2, 0, step, points);
    points.push([right, bottom - r]);
    flattenArc([right - r, bottom - r], r, 0, Math.PI / 2, step, points);
    points.push([x + r, bottom]);
    flattenArc([x + r, bottom - r], r, Math.PI / 2, Math.PI, step, points);
    points.push([x, y + r]);
    flattenArc([x + r, y + r], r, Math.PI, Math.PI * 1.5, step, points);
    return { points, closed: true };
  },
};

// A drawing states a place to a tenth of a unit at the finest. A ring comes
// round to its start to within the rounding of its sines and cosines, which is
// many orders below this.
const SAME_PLACE = 1e-6;

const isSamePlace = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < SAME_PLACE;

// The places a shape passes, no farther apart than `step` where it bends, and
// whether it ends where it began. No place is listed twice in a row, and a
// closed shape lists the place it starts and ends at once: the hand reads a
// heading from each place to the next, and two places in one spot have none.
export function flattenShape(shape, step) {
  const { points, closed } = FLATTEN_SHAPE[shape.kind](shape, step);
  const places = points.filter((place, i) => i === 0 || !isSamePlace(place, points[i - 1]));
  const comesRound = closed && places.length > 1 && isSamePlace(places.at(-1), places[0]);
  return { points: comesRound ? places.slice(0, -1) : places, closed };
}
