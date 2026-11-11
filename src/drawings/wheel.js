// A front wheel in its arch: tyre, rim with five spokes, brake disc and caliper.

import {
  Pencil, Wash, arc, closed, course, cubic, drawing, faint, hatching, heavy, light, lit, placed, plain,
  repeatedAround, ring, rotation, run, tone,
} from "../lib/drawing.js";

const AXLE = [280, 240];

const guides = faint(
  run([20, 240], [540, 240]),
  run([280, 20], [280, 430]),
  run([150, 110], [410, 370]),
  run([410, 110], [150, 370])
);
const road = light.twice(run([-20, 395], [580, 395]));
const shadow = hatching(
  { pencil: Pencil.Light, angle: -32, gap: 11 },
  closed(run([150, 400], [470, 400], [452, 416], [172, 416]))
);

// The body sits low over the wheel: its arch is a circle about a point below
// the axle and meets the tyre at the top.
const arch = heavy.twice(arc(280, 255.7, 167, 167.1, 380.1), run([117, 293], [0, 293]), run([437, 313], [560, 315]));
const bodyLines = light(
  arc(280, 255.7, 199.8, 169.2, 362),
  run([480, 262.5], [560, 264]),
  course([0, 46], cubic([150, 30], [400, 14], [560, 8])),
  course([547, 112], cubic([546, 165], [543, 218], [538, 262]))
);

const tyreWall = hatching({ pencil: Pencil.Light, angle: 58, gap: 6.5 }, ring(280, 240, 152), ring(280, 240, 129));
const tyre = heavy(ring(280, 240, 154));
const rim = plain(ring(280, 240, 127), ring(280, 240, 27), ring(280, 240, 11, { from: 60 }));
const rimLip = light(ring(280, 240, 119, { from: 40 }), ring(280, 240, 114, { from: 160 }));
const brakeDisc = light(arc(280, 240, 80, 262, 520), arc(280, 240, 46, 250, 508));
const caliper = lit(
  arc(280, 240, 88, 196, 250),
  arc(280, 240, 58, 196, 250),
  run([195.4, 215.7], [224.2, 224]),
  run([249.9, 157.3], [260.2, 185.5])
);

// One spoke, written pointing up: a blade that passes beside the axle and
// grows wider towards the rim, and the thin branch that leaves it.
const spokes = repeatedAround(
  AXLE,
  5,
  tone(Wash.Metal, closed(run([274.6, 229.7], [279.1, 118.8], [261.2, 120.3], [265.7, 229.7]))),
  tone(Wash.Metal, closed(run([270.2, 167.6], [306.7, 121.8], [311.9, 123.1], [270.2, 178.3]))),
  light(
    run([274.6, 229.7], [279.1, 118.8]),
    run([265.7, 229.7], [261.2, 120.3]),
    run([274, 160], [306.7, 121.8]),
    run([274.2, 173], [311.9, 123.1]),
    ring(280, 221, 4.6)
  )
);

export default drawing(
  { name: "wheel", viewBox: [0, 0, 560, 460], composedWidth: 560 },
  guides,
  road,
  shadow,
  arch,
  bodyLines,
  tyreWall,
  tyre,
  rim,
  rimLip,
  brakeDisc,
  caliper,
  placed(rotation(47, AXLE), spokes)
);
