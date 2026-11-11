// What a drawing is made of, and the words a drawing is written in.
//
// A drawing is plain data: the box it is composed in, the width in pixels it is
// composed for, and its marks in the order they are drawn. A mark (see mark.js)
// is made over one or more shapes (see shape.js) with a pencil or a wash. The
// order is part of the drawing: a wash hides what was drawn before it, and the
// hand draws each mark with a seed taken from its place in the list.
//
// Every word below that makes or changes marks returns a list of them, so the
// words nest and a drawing reads as its parts:
//
//   drawing(
//     { name: "phone", viewBox: [0, 0, 170, 340], composedWidth: 170 },
//     heavy.twice(box(9, 8, 152, 324, 25)),
//     weighted(4.2, lit(arc(85, 190, 50, 204, 331)))
//   )
//
// A word is defined by what it is given (see word.js), so a wrongly written
// drawing fails where it is written. That is when the page is built: the
// `drawings` plugin of vite.config.js evaluates every module of src/drawings
// and hands the page the finished drawing, so the words are not part of the
// page a visitor loads.
//
// Nothing here draws. lib/hand.js turns a drawing into strokes, and v-drawing
// puts them on the page.

import { Mark, Pencil, Wash } from "./mark.js";
import { Link, Shape } from "./shape.js";
import { IDENTITY, composeTransforms, rotation } from "./transform.js";
import {
  aCount, aNumber, aPlace, aPositiveNumber, defineWord, listOf, mapOf, ofKind, oneOf, optional, record, tuple,
} from "./word.js";

export { Pencil, Wash, rotation };

// Where the hand starts a ring is where its overlap shows.
const RING_START = -110;

// What the words below are given, besides places and numbers.
const aLink = ofKind("a link, as straight, cubic or smooth makes one", Object.values(Link));
const aCourse = ofKind("a course, as course or run makes one", [Shape.Course]);
const aRingStart = record({ from: optional(aNumber) });
const fiveNumbers = Array(5).fill(aNumber);
const aShape = ofKind("a shape, as ring, box or run makes one", Object.values(Shape));
const aListOfMarks = listOf("marks, as a pencil, hatching or tone makes them", ofKind("a mark", Object.values(Mark)));
const aClassName = {
  name: "a name without a space, as a stylesheet finds it",
  test: (given) => typeof given === "string" && /^\S+$/.test(given),
};
const aTransform = tuple("a transform [a, b, c, d, e, f], as rotation makes one", ...Array(6).fill(aNumber));
const aViewBox = tuple("a view box [x, y, width, height]", aNumber, aNumber, aPositiveNumber, aPositiveNumber);
const aPencil = oneOf("a pencil, such as Pencil.Light", Object.values(Pencil));
const aWash = oneOf("a wash, such as Wash.Metal", Object.values(Wash));
const steadiness = { wobble: optional(aNumber), overshoot: optional(aNumber) };
const namedPlaces = mapOf("an object of places, each under a name", aPlace);

// Straight from place to place.
export const straight = defineWord("straight", { rest: aPlace }, (...places) => ({ kind: Link.Straight, places }));

// One cubic Bézier curve, by its two controls and the place it ends at.
export const cubic = defineWord("cubic", { first: [aPlace, aPlace, aPlace] }, (control1, control2, end) => ({
  kind: Link.Cubic,
  controls: [control1, control2],
  end,
}));

// The curve that bends through every place given, on from the place reached.
export const smooth = defineWord("smooth", { rest: aPlace }, (...places) => ({ kind: Link.Smooth, places }));

// A line from `start` along its links, each of which goes on where the one
// before it ended.
export const course = defineWord("course", { first: [aPlace], rest: aLink }, (start, ...links) => ({
  kind: Shape.Course,
  start,
  links,
  closed: false,
}));

export const run = defineWord("run", { first: [aPlace], rest: aPlace }, (start, ...places) =>
  course(start, straight(...places))
);

// The same course, led back to where it started.
export const closed = defineWord("closed", { first: [aCourse] }, (open) => ({ ...open, closed: true }));

// A closed curve that bends through every place given, the first one included.
export const loop = defineWord("loop", { first: [aPlace], rest: aPlace }, (...places) => ({
  kind: Shape.Loop,
  places,
}));

export const ring = defineWord(
  "ring",
  { first: [aNumber, aNumber, aNumber, optional(aRingStart)] },
  (cx, cy, radius, { from = RING_START } = {}) => ({ kind: Shape.Ring, center: [cx, cy], radius, from })
);

// Part of a ring, such as a wheel arch.
export const arc = defineWord("arc", { first: fiveNumbers }, (cx, cy, radius, from, to) => ({
  kind: Shape.Arc,
  center: [cx, cy],
  radius,
  from,
  to,
}));

// A box with rounded corners. A box with sharp ones is a closed run.
export const box = defineWord("box", { first: fiveNumbers }, (x, y, width, height, radius) => ({
  kind: Shape.Box,
  x,
  y,
  width,
  height,
  radius,
}));

// One mark per shape, so that each is drawn with a seed of its own.
function drawWith(pencil) {
  const mark = (name, kind, manner) =>
    defineWord(name, { rest: aShape }, (...shapes) =>
      shapes.map((shape) => ({ kind, pencil, ...manner, shapes: [shape] }))
    );
  return Object.assign(mark(pencil, Mark.Line), {
    // Gone over a second time, as an outline is.
    twice: mark(`${pencil}.twice`, Mark.Line, { retraced: true }),
    filled: mark(`${pencil}.filled`, Mark.Filled),
  });
}

export const faint = drawWith(Pencil.Faint);
export const light = drawWith(Pencil.Light);
export const plain = drawWith(Pencil.Plain);
export const heavy = drawWith(Pencil.Heavy);
export const lit = drawWith(Pencil.Lit);

// `angle` in degrees clockwise from level, `gap` between two strokes in pixels.
export const hatching = defineWord(
  "hatching",
  { first: [record({ pencil: aPencil, angle: aNumber, gap: aPositiveNumber })], rest: aShape },
  ({ pencil, angle, gap }, ...outlines) => [{ kind: Mark.Hatching, pencil, angle, gap, shapes: outlines }]
);

export const tone = defineWord(
  "tone",
  { first: [aWash], rest: aShape },
  (wash, ...outlines) => [{ kind: Mark.Tone, wash, shapes: outlines }]
);

// How heavy the line of these marks is, in pixels at the width the drawing is
// composed for, where it is not the weight of their pencil. The nearest word
// wins.
export const weighted = defineWord(
  "weighted",
  { first: [aPositiveNumber], rest: aListOfMarks },
  (weight, ...marks) => marks.flat().map((mark) => ({ weight, ...mark }))
);

// How steady the hand is over these marks, in pixels: `wobble` is how far it
// strays from a course, `overshoot` how far it runs on past the end of a line.
// Either may be left to the drawing. The nearest word wins.
export const steady = defineWord(
  "steady",
  { first: [record(steadiness)], rest: aListOfMarks },
  (hand, ...marks) => marks.flat().map((mark) => ({ ...hand, ...mark }))
);

export const placed = defineWord("placed", { first: [aTransform], rest: aListOfMarks }, (transform, ...marks) =>
  marks.flat().map((mark) => ({ ...mark, transform: composeTransforms(transform, mark.transform ?? IDENTITY) }))
);

// The marks as written, then turned about `center` until they are there `count`
// times: a spoke, drawn five times round its hub. They are listed from the last
// turn back to the first, and the seed of a mark follows from its place.
export const repeatedAround = defineWord(
  "repeatedAround",
  { first: [aPlace, aCount], rest: aListOfMarks },
  (center, count, ...marks) =>
    Array.from({ length: count }, (_, i) => (360 / count) * ((count - i) % count)).flatMap((degrees) =>
      placed(rotation(degrees, center), ...marks)
    )
);

// `wobble` and `overshoot` are those of `steady`, for every mark without its
// own. `anchors` are places in the drawing by which a page lays it out, such
// as the place where something on the page crosses it.
export const drawing = defineWord(
  "drawing",
  {
    first: [
      record({
        name: aClassName,
        viewBox: aViewBox,
        composedWidth: aPositiveNumber,
        ...steadiness,
        anchors: optional(namedPlaces),
      }),
    ],
    rest: aListOfMarks,
  },
  ({ name, viewBox, composedWidth, wobble, overshoot, anchors }, ...marks) => ({
    name,
    viewBox,
    composedWidth,
    wobble,
    overshoot,
    anchors,
    marks: marks.flat(),
  })
);
