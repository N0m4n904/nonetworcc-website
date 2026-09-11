// The drawn field behind the projects — eight strokes, and how they sit in a
// box of any size.
//
// The strokes were composed in a 400 by 300 patch and are untouched: the same
// curves the SVG carried, in the same order. What is new is that the patch has
// to be placed by hand now rather than by preserveAspectRatio, and that three
// things the stylesheet used to say — how wide the line is, where the drawing
// fades out, how much of it survives — have to be numbers a painter can read.
// A canvas cannot be reached into with CSS, so this is where they live.
//
// Nothing here touches the DOM or a canvas context. It answers what the lines
// are and where they go; the directive that uses it owns the element.

// The patch the strokes were drawn in: five lines across it, three down.
export const PATCH = { width: 400, height: 300 };

export const STROKES = [
  "M0 40c60-8 120 6 180-2s140-10 220 4",
  "M0 92c70 10 130-8 195 2s140 12 205-4",
  "M0 148c55-12 118 8 178 0s150-12 222 6",
  "M0 206c78 8 128-10 196 0s130 14 204-2",
  "M0 258c62-10 126 8 186 2s136-12 214 4",
  "M64 0c-8 70 8 130-2 190s6 80 2 110",
  "M198 0c10 66-8 128 2 188s-6 82-2 112",
  "M330 0c-6 74 10 126 0 186s8 84 2 114",
];

// A hairline on screen however far the patch has been stretched — SVG spelt
// this `vector-effect: non-scaling-stroke`. Stronger than a plain edge:
// faded and behind content, a true hairline simply disappears.
export const STROKE_WIDTH = 1.4;

// The drawing never reaches its own edges. It fades along an ellipse three
// quarters of the field wide and three fifths of it tall, gone by three
// quarters of the way out. `peak` is how much survives where the fade has
// taken nothing — what used to be the field's opacity, folded in here because
// a mask and an opacity multiply anyway and one pass can do both.
export const FADE = { width: 0.75, height: 0.6, edge: 0.75, peak: 0.85 };

// The patch scaled to cover a box and centred in it: SVG's `xMidYMid slice`,
// written out.
export function cover({ width, height }) {
  const scale = Math.max(width / PATCH.width, height / PATCH.height);
  return {
    scale,
    x: (width - PATCH.width * scale) / 2,
    y: (height - PATCH.height * scale) / 2,
  };
}
