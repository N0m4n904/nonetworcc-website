// An Audi A4 allroad, seen from ahead of it on its left.
//
// `npm run car` computes the geometry and writes it into car.geometry.json
// (see tools/car). Each mark there is a call of a word listed below, written
// as a list: the word, then its arguments in order. An argument is a call
// itself, a place [x, y], a number, or the name of a pencil or a wash.

import geometry from "./car.geometry.json" with { type: "json" };
import {
  closed, course, drawing, faint, hatching, heavy, light, lit, loop, plain, smooth, straight, tone,
} from "../lib/drawing.js";

const WORDS = {
  closed,
  course,
  faint,
  heavy,
  light,
  lit,
  loop,
  plain,
  smooth,
  straight,
  tone,
  hatching: (pencil, angle, gap, ...outlines) => hatching({ pencil, angle, gap }, ...outlines),
};

function findWord(name) {
  if (!Object.hasOwn(WORDS, name)) {
    throw new TypeError(`car.geometry.json calls "${name}", and the car has the words ${Object.keys(WORDS).join(", ")}.`);
  }
  return WORDS[name];
}

const isCall = (written) => Array.isArray(written) && typeof written[0] === "string";

const read = (written) => (isCall(written) ? findWord(written[0])(...written.slice(1).map(read)) : written);

// 1150 pixels is the width at which a wide window shows the car. It is drawn
// with a steadier hand than the things on the desk. The anchors are the two
// places by which the first spread lays the car out: where the wire of the
// open book crosses it, and the corner of the empty part above its bonnet.
const { wire, desk } = geometry.anchors;

export default drawing(
  { name: "car", viewBox: geometry.frame, composedWidth: 1150, wobble: 0.45, overshoot: 1.4, anchors: { wire, desk } },
  ...geometry.marks.map(read)
);
