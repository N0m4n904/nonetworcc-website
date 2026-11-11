// A full-size ISO-DE board with a macro column and a media strip, laid out in
// key units and tilted into an oblique view.

import { box, closed, course, cubic, drawing, heavy, light, lit, placed, plain, ring, run, steady } from "../lib/drawing.js";
import { PENCIL_KEY } from "../lib/pencil-key.js";

const UNIT = 10;
const INSET = 0.07;
const CORNER = 0.16;

const MAIN = 1.5;
const NAV = 17;
const PAD = 20.5;

const ROW_FUNCTION = 1.25;
const ROW_NUMBERS = 2.5;
const ROW_TOP = 3.5;
const ROW_HOME = 4.5;
const ROW_BOTTOM = 5.5;
const ROW_SPACE = 6.5;
const ROWS = [ROW_FUNCTION, ROW_NUMBERS, ROW_TOP, ROW_HOME, ROW_BOTTOM, ROW_SPACE];

// The keys of the row under the numbers on a German board, from the left.
const TOP_ROW = ["Tab", ..."QWERTZUIOPÜ+"];

const TILT = [0.96, -0.2, -0.3, 0.8, 34, 62];

// A length in key units, in the units of the drawing and to a tenth of one.
// The arithmetic alone leaves 0.7000000000000001 where 0.7 is meant.
const toDrawingUnits = (keyUnits) => Math.round(keyUnits * UNIT * 10) / 10;

const ones = (count) => Array(count).fill(1);

// The key that picks the pencil up is lit.
function findPencilKey() {
  const column = TOP_ROW.indexOf(PENCIL_KEY);
  if (column < 0) throw new RangeError(`The keyboard has no key ${PENCIL_KEY} in the row ${TOP_ROW.join(" ")}.`);
  return column;
}

// Keys side by side from `x` on, each as wide as the number at its place in
// `widths`.
function lineUp(x, y, widths, litAt) {
  let left = x;
  return widths.map((width, column) => {
    const key = { x: left, y, width, pencil: column === litAt ? lit : plain };
    left += width;
    return key;
  });
}

const layout = [
  ...ROWS.map((y) => ({ x: 0, y })),

  { x: MAIN, y: ROW_FUNCTION },
  ...[3.5, 8, 12.5].flatMap((blockStart) => lineUp(blockStart, ROW_FUNCTION, ones(4))),
  ...lineUp(NAV, ROW_FUNCTION, ones(3)),
  ...lineUp(PAD, ROW_FUNCTION, ones(4)),

  ...lineUp(MAIN, ROW_NUMBERS, [...ones(13), 2]),
  ...lineUp(MAIN, ROW_TOP, [1.5, ...ones(TOP_ROW.length - 1)], findPencilKey()),
  ...lineUp(MAIN, ROW_HOME, [1.75, ...ones(12)]),
  ...lineUp(MAIN, ROW_BOTTOM, [1.25, ...ones(11), 2.75]),
  ...lineUp(MAIN, ROW_SPACE, [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25]),

  ...[ROW_NUMBERS, ROW_TOP].flatMap((row) => lineUp(NAV, row, ones(3))),
  { x: NAV + 1, y: ROW_BOTTOM },
  ...lineUp(NAV, ROW_SPACE, ones(3)),

  ...lineUp(PAD, ROW_NUMBERS, ones(4)),
  ...[ROW_TOP, ROW_HOME, ROW_BOTTOM].flatMap((row) => lineUp(PAD, row, ones(3))),
  { x: PAD + 3, y: ROW_TOP, height: 2 },
  { x: PAD + 3, y: ROW_BOTTOM, height: 2 },
  ...lineUp(PAD, ROW_SPACE, [2, 1]),
];

const drawKey = ({ x, y, width = 1, height = 1, pencil = plain }) =>
  pencil(box(...[x + INSET, y + INSET, width - 2 * INSET, height - 2 * INSET, CORNER].map(toDrawingUnits)));

// The one key that is not a rectangle: wide on the top row, narrower below.
function drawIsoEnter() {
  const [leftTop, leftBottom, right] = [15 + INSET, 15.25 + INSET, 16.5 - INSET];
  const [top, middle, bottom] = [ROW_TOP + INSET, ROW_HOME + INSET, ROW_HOME + 1 - INSET];
  const corners = [
    [leftTop, top], [right, top], [right, bottom],
    [leftBottom, bottom], [leftBottom, middle], [leftTop, middle],
  ];
  return plain(closed(run(...corners.map((corner) => corner.map(toDrawingUnits)))));
}

export default drawing(
  { name: "keyboard", viewBox: [0, 0, 284, 140], composedWidth: 560 },
  placed(
    TILT,
    heavy(box(-6, -5, 258, 86, 6)),
    light(
      ring(21, 4.5, 4.4),
      run([60, 4.5], [190, 4.5]),
      box(213, 1, 31, 7, 3.5),
      run([222, 1.4], [222, 7.6]),
      run([229, 1.2], [229, 7.8]),
      run([236, 1.4], [236, 7.6])
    ),
    steady({ wobble: 0.4, overshoot: 1.1 }, ...layout.map(drawKey), drawIsoEnter())
  ),
  light(
    run([3.9, 126], [3.9, 135], [251.6, 83.4], [251.6, 75]),
    run([251.6, 83.4], [277.4, 14.6], [277.4, 6.4]),
    course([206.4, 22.4], cubic([209, 10], [232, 9], [242, -2]), cubic([249, -10], [248, -19], [243, -26]))
  )
);
