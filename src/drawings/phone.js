// A Nothing Phone (1) from the back, its glyph lit.

import { arc, box, course, cubic, drawing, heavy, light, lit, plain, ring, run, weighted } from "../lib/drawing.js";

const housing = heavy.twice(box(9, 8, 152, 324, 25));
const innerEdge = light(box(15, 14, 140, 312, 20));
const buttons = light(run([163.5, 112], [163.5, 146]), run([6.5, 96], [6.5, 122]), run([6.5, 130], [6.5, 156]));
const flash = light(ring(94, 44, 4.5));
const screws = light(ring(132, 150, 2.4), ring(36, 262, 2.4), ring(134, 286, 2.4));
const lensRims = plain(ring(51, 58, 17), ring(51, 104, 17));
const lensGlass = light(ring(51, 58, 9.5, { from: 30 }), ring(51, 104, 9.5, { from: 30 }));

const stripRoundTheLenses = lit(
  course([80, 40], cubic([71, 26], [41, 23], [28, 38]), cubic([23, 46], [22, 60], [22, 74])),
  course([22, 89], cubic([22, 104], [23, 116], [28, 124]), cubic([41, 139], [71, 136], [80, 122]))
);
const stripBesideTheFlash = lit(course([108, 30], cubic([123, 31], [136, 40], [142, 55])));
const stripsRoundTheCoil = lit(arc(85, 190, 50, 204, 331), arc(85, 190, 50, 343, 416), arc(85, 190, 50, 68, 192));
const stripAboveThePort = lit(run([85, 268], [85, 302]), run([85, 313], [85, 314.5]));

export default drawing(
  { name: "phone", viewBox: [0, 0, 170, 340], composedWidth: 170 },
  housing,
  innerEdge,
  buttons,
  flash,
  screws,
  lensRims,
  lensGlass,
  weighted(4.2, stripRoundTheLenses, stripBesideTheFlash, stripsRoundTheCoil, stripAboveThePort)
);
