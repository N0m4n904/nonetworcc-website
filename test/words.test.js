// A wrongly written drawing is rejected by the word it is written with.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  Pencil, Wash, box, course, drawing, hatching, light, placed, repeatedAround, ring, run, steady, tone, weighted,
} from "../src/lib/drawing.js";

const sheet = { name: "sheet", viewBox: [0, 0, 100, 100], composedWidth: 100 };
const line = light(run([0, 0], [10, 10]));

const WRONGLY_WRITTEN = {
  "a ring without a radius": () => ring(10, 10),
  "a box with a size that is no number": () => box(0, 0, "wide", 10, 2),
  "a run through a place of three numbers": () => run([0, 0], [10, 10, 10]),
  "a course along a place in place of a link": () => course([0, 0], [10, 10]),
  "a pencil over a place in place of a shape": () => light([0, 0]),
  "hatching with a gap of 0": () => hatching({ pencil: Pencil.Light, angle: 30, gap: 0 }, ring(10, 10, 5)),
  "hatching with a pencil the page does not have": () => hatching({ pencil: "crayon", angle: 30, gap: 4 }, ring(10, 10, 5)),
  "hatching with a field the word does not know": () =>
    hatching({ pencil: Pencil.Light, angle: 30, gap: 4, colour: "red" }, ring(10, 10, 5)),
  "a tone with a wash the page does not have": () => tone("ink", ring(10, 10, 5)),
  "a weight of 0": () => weighted(0, line),
  "steadiness that is no number": () => steady({ wobble: "calm" }, line),
  "a placement by a transform of four numbers": () => placed([1, 0, 0, 1], line),
  "a repetition of no times": () => repeatedAround([50, 50], 0, line),
  "a drawing without a width it is composed for": () => drawing({ name: "sheet", viewBox: [0, 0, 100, 100] }, line),
  "a drawing with a view box without a width": () => drawing({ ...sheet, viewBox: [0, 0, 0, 100] }, line),
  "a drawing with a shape in place of a mark": () => drawing(sheet, ring(10, 10, 5)),
  "a drawing with an anchor that is no place": () => drawing({ ...sheet, anchors: { wire: 12 } }, line),
};

for (const [name, write] of Object.entries(WRONGLY_WRITTEN)) {
  test(`${name} is rejected`, () => assert.throws(write, TypeError));
}

test("a drawing written with the words is accepted", () => {
  const written = drawing(sheet, line, tone(Wash.Paint, ring(10, 10, 5)), weighted(3, line));
  assert.equal(written.marks.length, 3);
});
