// A pencil lying on its side, its point to the right.

import { closed, course, cubic, drawing, light, plain, run, steady, straight } from "../lib/drawing.js";

const barrel = plain(run([24, 5], [196, 5]), run([24, 25], [196, 25]));
const eraser = plain(
  course(
    [24, 5],
    straight([11, 5]),
    cubic([5, 5], [3, 9], [3, 15]),
    cubic([3, 21], [5, 25], [11, 25]),
    straight([24, 25])
  )
);
const ferrule = plain(run([24, 5], [24, 25]), run([38, 5], [38, 25]));
const point = plain(run([196, 5], [246, 15], [196, 25]));

const barrelEdge = light(run([38, 15], [192, 15]));
const ferruleRings = light(run([29, 5], [29, 25]), run([33, 5], [33, 25]));
const sharpenedEdge = light(
  course([196, 5], cubic([201, 8], [193, 12], [198, 15]), cubic([193, 18], [201, 22], [196, 25]))
);

const lead = plain.filled(closed(run([230, 11.8], [246, 15], [230, 18.2])));

export default drawing(
  { name: "pencil", viewBox: [0, 0, 250, 30], composedWidth: 150 },
  steady({ overshoot: 1.4 }, barrel, eraser, ferrule, point),
  steady({ overshoot: 1 }, barrelEdge, ferruleRings, sharpenedEdge),
  lead
);
