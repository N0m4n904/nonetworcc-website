// The stroke under the title of a section.

import { course, cubic, drawing, lit, weighted } from "../lib/drawing.js";

export default drawing(
  { name: "rule", viewBox: [0, 0, 200, 14], composedWidth: 200 },
  weighted(4, lit(course([2, 9], cubic([30, 3], [54, 11], [80, 8]), cubic([106, 5], [132, 1], [198, 6]))))
);
