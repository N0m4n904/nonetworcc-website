// A kiosk screen with eight tiles, one of them touched.

import {
  Pencil, box, closed, course, cubic, drawing, faint, hatching, heavy, light, lit, plain, repeatedAround, ring, run,
  steady,
} from "../lib/drawing.js";

const guides = faint(run([200, -8], [200, 262]), run([-4, 123], [404, 123]));
const shadow = hatching(
  { pencil: Pencil.Light, angle: -32, gap: 9 },
  closed(run([40, 238], [384, 238], [384, 30], [392, 38], [392, 248], [52, 248]))
);
const housing = heavy.twice(box(24, 14, 352, 218, 14));
const screen = plain(box(38, 28, 324, 190, 5));
const tiles = plain(...[40, 128].flatMap((y) => [50, 127, 204, 281].map((x) => box(x, y, 68, 78, 6))));

const apps = light(...[62, 81].flatMap((y) => [68, 87].map((x) => box(x, y, 13, 13, 2))));
const note = light(
  box(144, 60, 34, 38, 2),
  run([150, 69], [172, 69]),
  run([150, 77], [172, 77]),
  run([150, 85], [164, 85])
);
const sun = light(ring(232, 74, 9));
const sunRays = repeatedAround([232, 74], 8, light(run([232, 60], [232, 55])));
const cloud = light(
  closed(
    course(
      [226, 98],
      cubic([220, 98], [218, 91], [224, 89]),
      cubic([225, 83], [234, 82], [237, 87]),
      cubic([244, 86], [247, 92], [243, 96]),
      cubic([241, 98], [238, 98], [236, 98])
    )
  )
);
const calendar = light(
  box(298, 62, 34, 34, 3),
  run([298, 72], [332, 72]),
  run([307, 58], [307, 65]),
  run([323, 58], [323, 65]),
  run([305, 81], [309, 81]),
  run([313, 81], [317, 81]),
  run([321, 81], [325, 81]),
  run([305, 89], [309, 89]),
  run([313, 89], [317, 89])
);
const page = light(
  closed(run([70, 148], [90, 148], [98, 156], [98, 188], [70, 188])),
  run([90, 148], [90, 156], [98, 156]),
  run([76, 166], [92, 166]),
  run([76, 174], [92, 174])
);
const mapMarker = light(
  closed(
    course(
      [161, 190],
      cubic([150, 176], [146, 169], [146, 162]),
      cubic([146, 153], [153, 147], [161, 147]),
      cubic([169, 147], [176, 153], [176, 162]),
      cubic([176, 169], [172, 176], [161, 190])
    )
  ),
  ring(161, 162, 5)
);
const playButton = light(ring(238, 167, 19), closed(run([232, 157], [248, 167], [232, 177])));

const speaker = lit(
  closed(run([296, 158], [304, 158], [314, 149], [314, 181], [304, 172], [296, 172])),
  course([321, 157], cubic([325, 161], [325, 169], [321, 173])),
  course([327, 151], cubic([334, 158], [334, 172], [327, 179]))
);
const touchRing = lit(ring(336, 194, 9, { from: 20 }));
const fingertip = lit.filled(ring(336, 194, 2.6));

export default drawing(
  { name: "kiosk", viewBox: [0, 0, 400, 262], composedWidth: 400 },
  guides,
  shadow,
  housing,
  screen,
  steady({ wobble: 0.5, overshoot: 1.6 }, tiles),
  steady({ wobble: 0.4, overshoot: 1.2 }, apps, note, sun, sunRays, cloud, calendar, page, mapMarker, playButton),
  speaker,
  touchRing,
  fingertip
);
