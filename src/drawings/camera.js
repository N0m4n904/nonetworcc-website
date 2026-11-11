// A camera from the front.

import {
  Pencil, arc, box, closed, drawing, faint, hatching, heavy, light, lit, plain, ring, run,
} from "../lib/drawing.js";

const guides = faint(run([150, 4], [150, 196]), run([4, 118], [296, 118]));
const body = heavy.twice(box(22, 52, 256, 130, 15));
const prism = plain(run([108, 52], [121, 27], [179, 27], [192, 52]));
const shutterButton = plain(box(218, 40, 34, 12, 4));
const dial = plain(box(46, 38, 38, 14, 4));
const lensBarrel = plain(ring(150, 118, 57), ring(150, 118, 45, { from: 50 }));
const hotShoe = light(box(136, 33, 28, 12, 3));
const dialNotches = light(run([56, 38], [56, 52]), run([65, 38], [65, 52]), run([74, 38], [74, 52]));
const gripEdge = light(run([62, 64], [62, 170]));
const lensGlass = light(ring(150, 118, 33, { from: 200 }), ring(150, 118, 17), arc(150, 118, 51, 205, 262));
const strapLugs = light(run([22, 70], [12, 70], [12, 82], [22, 82]), run([278, 70], [288, 70], [288, 82], [278, 82]));
const grip = hatching(
  { pencil: Pencil.Light, angle: -58, gap: 7 },
  closed(run([30, 70], [56, 70], [56, 166], [36, 166], [30, 158]))
);
const lamp = lit(ring(238, 80, 6));
const glint = lit(arc(150, 118, 26, 208, 258));

export default drawing(
  { name: "camera", viewBox: [0, 0, 300, 200], composedWidth: 260 },
  guides,
  body,
  prism,
  shutterButton,
  dial,
  lensBarrel,
  hotShoe,
  dialNotches,
  gripEdge,
  lensGlass,
  strapLugs,
  grip,
  lamp,
  glint
);
