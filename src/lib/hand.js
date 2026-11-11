// The hand. Turns clean geometry into a line that looks drawn: every stroke is
// resampled, pushed a seeded distance off its own course, and let run a little
// past its ends, so corners cross the way they do when a ruler is not involved.
// Each drawing is made twice with two seeds, and the boil swaps them.
//
// Nothing here uses the DOM or measures the page. A drawing comes in as data
// (see drawing.js) with the width it is shown at, and what was drawn goes out
// as path data, so a drawing comes out the same in every engine and before it
// is laid out. The directive that uses it makes the elements.

import { Mark } from "./mark.js";
import { createRandom } from "./random.js";
import { findSplineControls, flattenShape } from "./shape.js";
import { IDENTITY, applyTransform, rotation, toRadians } from "./transform.js";

const CORNER = toRadians(38);
const FINE = 1.5;
const SMALL_LOOP = 76;

// How the hand strays from a course, with lengths in pixels. Two wanders are
// laid over each other, a slow one and a quick one, and the slow one has the
// larger share.
const SLOW_WANDER = 64;
const QUICK_WANDER = 19;
const SLOW_SHARE = 0.75;
// At an end a stroke strays by FREEDOM_AT_END of its wobble. Along the stroke
// that share grows by one over FREEDOM_GROWS_OVER pixels, up to the whole.
const FREEDOM_AT_END = 0.35;
const FREEDOM_GROWS_OVER = 10;
// A straight line bows by no more than this share of its length.
const MOST_BOW = 0.012;

// A loop overlaps its start by no more than this share of its length, and
// strays farther over the overlap, by this many times its wobble.
const MOST_OVERLAP = 0.08;
const STRAY_OVER_OVERLAP = 1.4;

// The gap between two strokes of hatching is its own gap times a number from
// NARROWEST_GAP on, GAP_SPREAD wide. A stroke stops up to HATCH_INSET pixels
// short of the outline at either end.
const NARROWEST_GAP = 0.82;
const GAP_SPREAD = 0.36;
const HATCH_INSET = 1.6;

// The second stroke over a retraced line wobbles and overshoots more than the
// first, by these factors.
const WOBBLE_AGAIN = 1.9;
const OVERSHOOT_AGAIN = 1.6;

// Smooth one-dimensional noise: random knots, eased between.
function createWander(rng, wavelength) {
  const knots = [];
  const knot = (i) => (knots[i] ??= rng() * 2 - 1);
  return (s) => {
    const at = s / wavelength;
    const i = Math.floor(at);
    const t = at - i;
    const ease = t * t * (3 - 2 * t);
    return knot(i) * (1 - ease) + knot(i + 1) * ease;
  };
}

// ---- a stroke -------------------------------------------------------------

const measureHeading = (from, to) => Math.atan2(to[1] - from[1], to[0] - from[0]);

function densify(points, closed, step) {
  const out = [];
  const count = closed ? points.length : points.length - 1;
  for (let i = 0; i < count; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  if (!closed) out.push(points[points.length - 1]);
  return out;
}

// A hand lifts at a corner. Each run between two corners is its own stroke.
function splitAtCorners({ points, closed }, step, unit) {
  if (points.length < 2) return [];
  const fine = densify(points, closed, step);
  const n = fine.length;
  // Something as small as a key is drawn round in one go, corners and all.
  if (closed && n * step < SMALL_LOOP * unit) return [{ points: [...fine, fine[0]], loop: true }];
  const heading = (i) => measureHeading(fine[i], fine[(i + 1) % n]);
  const turn = (i) => {
    let d = heading(i) - heading((i - 1 + n) % n);
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return Math.abs(d);
  };

  const corners = [];
  const first = closed ? 0 : 1;
  const last = closed ? n : n - 1;
  for (let i = first; i < last; i++) if (turn(i) > CORNER) corners.push(i);

  if (closed) {
    if (!corners.length) return [{ points: [...fine, fine[0]], loop: true }];
    const out = [];
    for (let c = 0; c < corners.length; c++) {
      const from = corners[c];
      const to = corners[(c + 1) % corners.length];
      const run = [];
      for (let i = from; ; i = (i + 1) % n) {
        run.push(fine[i]);
        if (i === to && run.length > 1) break;
      }
      out.push({ points: run, loop: false });
    }
    return out;
  }

  const out = [];
  let from = 0;
  for (const corner of [...corners, n - 1]) {
    if (corner > from) out.push({ points: fine.slice(from, corner + 1), loop: false });
    from = corner;
  }
  return out;
}

function measureLengths(points) {
  const at = [0];
  for (let i = 1; i < points.length; i++) {
    at.push(at[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  return at;
}

function interpolateAt(points, at, s) {
  let i = 1;
  while (i < at.length - 1 && at[i] < s) i++;
  const span = at[i] - at[i - 1] || 1;
  const t = Math.min(1, Math.max(0, (s - at[i - 1]) / span));
  const a = points[i - 1];
  const b = points[i];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return { x: a[0] + dx * t, y: a[1] + dy * t, tx: dx / len, ty: dy / len };
}

// Where along a run the hand is asked for a point: every `spacing` on a
// straight, and as often as the course bends where it does. Evenly spaced
// points alone cut the corners off anything small.
const BEND = toRadians(13);

function pickStations(points, at, total, spacing) {
  const length = at[at.length - 1];
  const segments = points.length - 1;
  const heading = (i) => measureHeading(points[i % segments], points[(i % segments) + 1]);
  const picked = [0];
  let heldAt = 0;
  let heldHeading = heading(0);
  for (let i = 1; ; i++) {
    const s = Math.floor(i / segments) * length + at[i % segments];
    if (s >= total || i > segments * 2) break;
    let bend = Math.abs(heading(i) - heldHeading);
    if (bend > Math.PI) bend = 2 * Math.PI - bend;
    const gone = s - heldAt;
    if (gone >= spacing || (bend >= BEND && gone >= spacing * 0.18)) {
      picked.push(s);
      heldAt = s;
      heldHeading = heading(i);
    }
  }
  if (total - heldAt < spacing * 0.3 && picked.length > 1) picked.pop();
  picked.push(total);
  return picked;
}

const writePlace = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

// Catmull-Rom through the points, written as cubics. The first point has none
// before it and the last none after it: each stands in for that neighbour.
function toSplinePath(points) {
  const spans = points.slice(1).map((to, i) => {
    const from = points[i];
    const controls = findSplineControls(points[i - 1] ?? from, from, to, points[i + 2] ?? to);
    return `C${[...controls, to].map(writePlace).join(" ")}`;
  });
  return `M${writePlace(points[0])}${spans.join("")}`;
}

// One run, redrawn by hand, or nothing for a run without a length. All lengths
// are in drawing units; `unit` is how many of them make a pixel, so the wobble
// is the same size on screen whatever the size of the drawing.
function drawStroke(run, rng, style, unit) {
  const { points, loop } = run;
  const at = measureLengths(points);
  const length = at[at.length - 1];
  if (length < 0.01) return undefined;

  const spacing = style.spacing * unit;
  const amp = style.wobble * unit;
  const over = loop ? 0 : style.overshoot * unit;
  const lead = over * (0.3 + rng() * 0.7);
  const trail = over * (0.3 + rng() * 0.7);
  // A circle closed by hand overlaps where it began.
  const overlap = loop ? Math.min(length * MOST_OVERLAP, style.overlap * unit) * (0.5 + rng() * 0.5) : 0;

  const slow = createWander(rng, SLOW_WANDER * unit);
  const quick = createWander(rng, QUICK_WANDER * unit);
  // A straight line drawn freehand bows a little.
  const bow = (rng() - 0.5) * Math.min(style.bow * unit, length * MOST_BOW) * 2;

  const total = length + overlap;
  const out = [];
  for (const s of pickStations(points, at, total, spacing)) {
    const p = interpolateAt(points, at, loop ? s % length : s);
    // A stroke strays least at its ends, so strokes that meet still meet.
    const fromEnd = Math.min(s, length - s);
    const freedom = loop ? 1 : Math.min(1, fromEnd / (FREEDOM_GROWS_OVER * unit) + FREEDOM_AT_END);
    const stray =
      amp * freedom * (slow(s) * SLOW_SHARE + quick(s) * (1 - SLOW_SHARE)) +
      bow * Math.sin((Math.PI * s) / total) +
      (loop && s > length ? amp * STRAY_OVER_OVERLAP : 0);
    out.push([p.x - p.ty * stray, p.y + p.tx * stray]);
  }

  if (!loop) {
    const a = interpolateAt(points, at, 0);
    const b = interpolateAt(points, at, length);
    out[0] = [out[0][0] - a.tx * lead, out[0][1] - a.ty * lead];
    const end = out.length - 1;
    out[end] = [out[end][0] + b.tx * trail, out[end][1] + b.ty * trail];
  }
  return { d: toSplinePath(out) };
}

// Parallel strokes across a closed shape. Holes come for free: the shape is
// crossed line by line and filled between alternate edges.
function layHatching(contours, degrees, gap, rng, unit) {
  // The strokes are laid level over the contours turned back by their angle,
  // and then turned to it.
  const origin = [0, 0];
  const level = rotation(-degrees, origin);
  const slanted = rotation(degrees, origin);
  const turned = contours.map((points) => points.map((point) => applyTransform(level, point)));
  let top = Infinity;
  let bottom = -Infinity;
  for (const points of turned) for (const [, y] of points) { top = Math.min(top, y); bottom = Math.max(bottom, y); }

  const lines = [];
  for (let y = top + gap * (0.3 + rng() * 0.4); y < bottom; y += gap * (NARROWEST_GAP + rng() * GAP_SPREAD)) {
    const hits = [];
    for (const points of turned) {
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          hits.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
        }
      }
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2) {
      const from = hits[i] + rng() * HATCH_INSET * unit;
      const to = hits[i + 1] - rng() * HATCH_INSET * unit;
      if (to - from < 2 * unit) continue;
      // Hatching is drawn back and forth.
      const pair = [[from, y], [to, y]].map((end) => applyTransform(slanted, end));
      lines.push(lines.length % 2 ? pair.reverse() : pair);
    }
  }
  return lines;
}

// The area a tone fills, its edge strayed from the outlines by up to `stray`.
function fillArea(outlines, rng, stray, unit) {
  const strayPlace = ([x, y]) => writePlace([x + (rng() - 0.5) * stray, y + (rng() - 0.5) * stray]);
  return outlines
    .map(({ points }) => densify(points, true, 12 * unit))
    .map((points) => `M${points.map(strayPlace).join("L")}Z`)
    .join("");
}

// ---- a drawing ------------------------------------------------------------

const STYLE = { spacing: 15, wobble: 0.85, overshoot: 3.2, overlap: 9, bow: 1.6 };

// A drawing shown smaller than it was composed is drawn with a finer point
// and a steadier hand, or its own wobble would crumple it. Between 1 at the
// composed size and LEAST_FIT for anything much smaller.
const LEAST_FIT = 0.55;
// A second pass over a line is for a drawing with room for it.
const TWICE_FROM = 0.75;

const followOutlines = (outlines, { step, unit }) => outlines.flatMap((outline) => splitAtCorners(outline, step, unit));

function hatchOutlines(outlines, { mark, index, seed, step, unit }) {
  const contours = outlines.map(({ points }) => densify(points, true, step * 2));
  const rng = createRandom(seed * 977 + index);
  return layHatching(contours, mark.angle, mark.gap * unit, rng, unit).map((line) => ({
    points: densify(line, false, step * 4),
    loop: false,
  }));
}

// How each kind of mark is made: the runs the hand draws for it, and whether
// the area inside its shapes is toned in.
const MANNERS = {
  [Mark.Line]: { layRuns: followOutlines, toned: false },
  [Mark.Filled]: { layRuns: followOutlines, toned: true },
  [Mark.Hatching]: { layRuns: hatchOutlines, toned: false },
  [Mark.Tone]: { layRuns: () => [], toned: true },
};

// How a drawing shown `shownWidth` pixels wide is measured: `unit` is how many
// of its units make one pixel, and `fit` how fine its line is, 1 at the width
// it was composed for.
function measureLine(drawing, shownWidth) {
  const [, , width] = drawing.viewBox;
  return {
    unit: width / shownWidth,
    fit: Math.min(1, Math.max(LEAST_FIT, Math.sqrt(shownWidth / drawing.composedWidth))),
  };
}

// The drawing, drawn by hand for the width it is shown at. Returns how many
// strokes it took, the `unit` and the `fit` of its line (see measureLine), and
// the two passes. A pass lists every mark of the drawing in order, with what
// was drawn for it:
//
//   { mark, tone: { d, order } or nothing, strokes: [{ d, order, again }] }
//
// `d` is path data. `order` is the place of a stroke in the order of drawing,
// and for a tone the stroke it arrives with. `again` marks the second, fainter
// stroke over a retraced line.
export function drawByHand(drawing, { shownWidth, seed }) {
  const { unit, fit } = measureLine(drawing, shownWidth);
  const step = FINE * unit;

  let strokeCount = 0;
  const laid = drawing.marks.map((mark, index) => {
    const outlines = mark.shapes.map((shape) => {
      const { points, closed } = flattenShape(shape, step);
      return { closed, points: points.map((point) => applyTransform(mark.transform ?? IDENTITY, point)) };
    });
    const style = {
      ...STYLE,
      wobble: (mark.wobble ?? drawing.wobble ?? STYLE.wobble) * fit,
      overshoot: (mark.overshoot ?? drawing.overshoot ?? STYLE.overshoot) * fit,
    };
    const again = { ...style, wobble: style.wobble * WOBBLE_AGAIN, overshoot: style.overshoot * OVERSHOOT_AGAIN };
    const { layRuns, toned } = MANNERS[mark.kind];
    const first = strokeCount;
    const runs = layRuns(outlines, { mark, index, seed, step, unit });
    strokeCount += runs.length;
    return {
      mark,
      index,
      runs,
      first,
      styles: mark.retraced && fit > TWICE_FROM ? [style, again] : [style],
      // A tone arrives with the stroke that is drawn after it. The steadier
      // the hand, the closer it fills to the edge.
      tone: toned
        ? { d: fillArea(outlines, createRandom(seed * 53 + index), (style.wobble / STYLE.wobble) * unit, unit), order: first }
        : undefined,
    };
  });

  const passes = [0, 1].map((pass) =>
    laid.map(({ mark, index, runs, first, styles, tone }) => ({
      mark,
      tone,
      strokes: runs.flatMap((run, k) => {
        const rng = createRandom(seed * 131 + index * 17 + k * 7 + pass * 7919);
        return styles.flatMap((style, repeat) => {
          const stroke = drawStroke(run, rng, style, unit);
          return stroke ? [{ ...stroke, order: first + k, again: repeat > 0 }] : [];
        });
      }),
    }))
  );

  return { strokeCount, unit, fit, passes };
}
