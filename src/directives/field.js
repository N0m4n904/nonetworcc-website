// v-field — the drawn field behind the projects.
//
// It used to be an SVG and it was the most expensive thing on the page. A mask
// and an opacity below one each pull an element out of the section's flat paint
// into a surface of its own to be composited, and at 1920 wide that surface was
// 1920 by 4098 — close to eight megapixels, carried every frame for a drift
// that rotates as well as travels. Four lines of the eight were on screen.
//
// A canvas costs what it is told to cost. The fade and the shade become pixels
// instead of compositing, so neither is left to promote the field, and the
// backing store is a number here rather than whatever the screen is. The drift
// stays in CSS, so v-live still pauses it off screen and the reduced-motion
// guard still takes it away.
//
// One thing to know before making this bigger. Where 2D canvas acceleration is
// missing — software compositing, a blocklisted driver, a remote session — the
// bitmap is copied to the compositor on every commit instead of being handed
// over as a texture, and the copy is the size of the backing store. Traced
// against a SwiftShader build, this at eight megapixels cost twelve times what
// the SVG did. MAX_PIXELS is the whole defence against that, and it is the
// number to reach for if this ever reads as slow rather than fast.

import { STROKES, STROKE_WIDTH, FADE, cover } from "../lib/field.js";

// A texture at 38% alpha behind a fade behind content has no detail to lose, so
// it is drawn at one pixel per CSS pixel and stretched on a dense screen — a
// quarter of the memory on a retina display. It also means a window dragged
// between monitors of different densities needs no repaint, because the density
// it was drawn at did not depend on the monitor.
const MAX_DENSITY = 1;

// About what the SVG occupied at the size this was measured at, so the ceiling
// does not bite today. It is here to bound what happens when the section grows
// — another project, a narrower window — not to save anything now.
const MAX_PIXELS = 8e6;

// Trailing, because dragging a window by its edge is a resize every frame and
// reallocating a multi-megapixel backing store is not a per-frame operation.
// The canvas stretches until the drag stops, which on a blurred texture nobody
// sees.
const SETTLE = 200;

const running = new WeakMap();

function strokes(ctx, box, ink) {
  const { scale, x, y } = cover(box);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = ink;
  // Dividing by the scale is the same instruction non-scaling-stroke gave.
  ctx.lineWidth = STROKE_WIDTH / scale;
  ctx.lineCap = "round";
  for (const d of STROKES) ctx.stroke(new Path2D(d));
  ctx.restore();
}

// The fade, and the shade with it. destination-in keeps the drawing where this
// fill is opaque and erases it where the fill is not, so one ellipse does what
// a mask and an opacity did between them.
//
// Measured in the field's coordinates rather than the canvas's: the canvas
// hangs off the field by its margins, and the ellipse was always centred on
// what the visitor can see.
function fade(ctx, box, field) {
  const cx = field.x + field.width / 2;
  const cy = field.y + field.height / 2;
  const rx = field.width * FADE.width;
  const squash = (field.height * FADE.height) / rx;

  ctx.save();
  // A canvas gradient is round where a CSS one is an ellipse, so the frame is
  // squashed rather than the gradient stretched.
  ctx.translate(cx, cy);
  ctx.scale(1, squash);

  const reach = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  reach.addColorStop(0, `rgba(0, 0, 0, ${FADE.peak})`);
  reach.addColorStop(FADE.edge, "rgba(0, 0, 0, 0)");

  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = reach;
  // Every corner of the canvas, in the squashed frame: what the fill misses is
  // erased, and past the last stop the gradient is already nothing.
  ctx.fillRect(-cx, -cy / squash, box.width, box.height / squash);
  ctx.restore();
}

function draw(host) {
  let canvas = host.querySelector(":scope > canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    host.appendChild(canvas);
  }

  const box = { width: canvas.offsetWidth, height: canvas.offsetHeight };
  const field = { width: host.offsetWidth, height: host.offsetHeight };
  // Nothing to draw where the stylesheet has taken the field away: a phone, or
  // a visitor who asked for less motion.
  if (!box.width || !box.height || !field.width || !field.height) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const density = Math.min(
    window.devicePixelRatio || 1,
    MAX_DENSITY,
    Math.sqrt(MAX_PIXELS / (box.width * box.height))
  );
  // Sizing the backing store also clears it. From here everything is in CSS
  // pixels, whatever the density underneath.
  canvas.width = Math.round(box.width * density);
  canvas.height = Math.round(box.height * density);
  ctx.scale(density, density);

  // The palette is one file and stays there; the canvas is handed the colour
  // the stylesheet resolved for it.
  strokes(ctx, box, getComputedStyle(canvas).color);
  // offsetLeft carries the margin that hangs the canvas off the field, so the
  // offset is read back rather than restated here.
  fade(ctx, box, { ...field, x: -canvas.offsetLeft, y: -canvas.offsetTop });
}

function settle(run) {
  let timer = null;
  const delayed = () => {
    clearTimeout(timer);
    timer = setTimeout(run, SETTLE);
  };
  delayed.cancel = () => clearTimeout(timer);
  return delayed;
}

export default {
  mounted(el) {
    draw(el);

    const repaint = settle(() => draw(el));
    // The section changes height when a tile rewraps, and the field is the
    // section's size.
    const size = "ResizeObserver" in window ? new ResizeObserver(repaint) : null;
    // The palette follows the system between light and dark. A canvas follows
    // nothing.
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");

    size?.observe(el);
    scheme.addEventListener("change", repaint);
    running.set(el, { repaint, size, scheme });
  },

  unmounted(el) {
    const held = running.get(el);
    if (!held) return;
    held.repaint.cancel();
    held.size?.disconnect();
    held.scheme.removeEventListener("change", held.repaint);
    running.delete(el);
  },
};
