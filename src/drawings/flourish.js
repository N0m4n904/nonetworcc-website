// The stroke under the name.

import { course, cubic, drawing, lit, weighted } from "../lib/drawing.js";

export default drawing(
  { name: "flourish", viewBox: [0, 0, 400, 30], composedWidth: 640 },
  weighted(5, lit(course([4, 19], cubic([70, 7], [150, 22], [232, 12]), cubic([290, 5], [350, 7], [396, 15]))))
);
