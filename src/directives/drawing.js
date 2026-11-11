// v-drawing: a drawing, made by hand on the <svg> it is given.
//
//   <svg v-drawing="{ drawing: flourish, seed: 3 }" v-live />
//
// `drawing` is a drawing as data (see lib/drawing.js). `seed` is the hand it
// is drawn with at this place: the same seed draws the same strokes on every
// visit, and a drawing added to the page changes no other.
//
// The element gets the box and the name of the drawing at once, so it has its
// place on the page before a line exists. The lines are drawn for the width
// of the element when it comes near the window, and again whenever that width
// changes. What is inside the element is made here: two passes of the same
// drawing, which the stylesheet draws in once and then swaps. Pausing off
// screen is the work of v-live, so a drawing is given both.

import { drawByHand } from "../lib/hand.js";

const NS = "http://www.w3.org/2000/svg";

// The two passes are swapped at a pace of its own for every drawing, in
// seconds, picked by its seed.
const PACES = [0.4, 0.48, 0.42, 0.36, 0.44];

// Drawing in takes WHOLE_DRAWING milliseconds from the first stroke to the
// last, and a drawing of few strokes never waits longer than MOST_BEAT between
// two of them.
const MOST_BEAT = 7;
const WHOLE_DRAWING = 1500;

// Where a drawing is on its way in, as the stylesheet reads it off the element.
const Arrival = Object.freeze({ Waiting: "waiting", Drawing: "drawing", Done: "done" });

const PASS_CLASSES = ["pass pass--a", "pass pass--b"];

// For each element: its drawing and seed, the width it is laid out at, and
// whether it has come near the window and has been seen in it.
const placements = new WeakMap();

// Whether drawings draw themselves in is set in the stylesheet: it is switched
// off there for touch devices and for a visitor who asked for less motion.
const readDrawsIn = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--draws-in").trim() === "1";

// What a mark is drawn with, as the stylesheet finds it: its pencil, or the
// wash of a tone.
const nameTool = ({ pencil, wash }) => (pencil ? `pencil--${pencil}` : `wash--${wash}`);

// `order` is the place of the path in the order of drawing in.
function createPath(d, classes, order) {
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", d);
  path.setAttribute("class", classes.join(" "));
  path.style.setProperty("--i", order);
  return path;
}

// A stroke is one unit long to the stylesheet, whatever its course, so that
// one dash covers all of it while it is drawn in.
function createStroke({ d, order, again }, { weight, ...mark }) {
  const path = createPath(d, ["stroke", nameTool(mark), ...(again ? ["stroke--again"] : [])], order);
  path.setAttribute("pathLength", "1");
  if (weight !== undefined) path.style.setProperty("--w", weight);
  return path;
}

function createPass(drawn, passClasses) {
  const group = document.createElementNS(NS, "g");
  group.setAttribute("class", passClasses);
  for (const { mark, tone, strokes } of drawn) {
    if (tone) group.append(createPath(tone.d, ["tone", nameTool(mark)], tone.order));
    group.append(...strokes.map((stroke) => createStroke(stroke, mark)));
  }
  return group;
}

const findLastOfFirstPass = (svg) => svg.firstElementChild?.lastElementChild;

// A drawing that has been drawn and seen starts to draw itself in. Without
// motion, or without a path to draw in, it is there at once.
function startDrawingIn(svg) {
  svg.dataset.arrival = readDrawsIn() && findLastOfFirstPass(svg) ? Arrival.Drawing : Arrival.Done;
}

// The last path of the first pass is the last one to be drawn in. Its
// animation ends on the path, and the event comes up to the drawing.
function finishDrawingIn({ target, currentTarget: svg }) {
  if (target === findLastOfFirstPass(svg)) svg.dataset.arrival = Arrival.Done;
}

function draw(svg) {
  const placement = placements.get(svg);
  const { strokeCount, passes, unit, fit } = drawByHand(placement.drawing, {
    shownWidth: placement.width,
    seed: placement.seed,
  });
  // A line has the same weight at whatever size its drawing is shown.
  svg.style.setProperty("--unit", unit.toFixed(4));
  svg.style.setProperty("--fit", fit.toFixed(3));
  svg.style.setProperty("--beat", `${Math.min(MOST_BEAT, WHOLE_DRAWING / strokeCount).toFixed(2)}ms`);
  const isFirstDrawing = svg.childElementCount === 0;
  svg.replaceChildren(...passes.map((drawn, pass) => createPass(drawn, PASS_CLASSES[pass])));
  if (isFirstDrawing && placement.seen) startDrawingIn(svg);
}

// A browser without requestIdleCallback draws one drawing in each frame.
const whenIdle =
  window.requestIdleCallback ?? ((run) => requestAnimationFrame(() => run({ timeRemaining: () => 0 })));

// Drawing by hand takes time, and the words of the page come first: the
// drawings that wait are drawn while the browser reports idle time, as many as
// fit into it.
const waiting = new Set();

function drawWaiting(idle) {
  try {
    for (const svg of waiting) {
      waiting.delete(svg);
      draw(svg);
      if (idle.timeRemaining() <= 0) break;
    }
  } finally {
    // After a drawing that throws, the others are still drawn.
    if (waiting.size) whenIdle(drawWaiting);
  }
}

// A drawing is drawn once it is near the window and has a width.
function drawWhenIdle(svg) {
  const { near, width } = placements.get(svg);
  if (!near || !width) return;
  if (!waiting.size) whenIdle(drawWaiting);
  waiting.add(svg);
}

// Calls `react` the first time an element comes into view, and only then.
function watchOnce(react, options) {
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      react(target);
    }
  }, options);
  return observer;
}

// A screen ahead of the window, so a drawing is there before it is scrolled to.
const nearObserver = watchOnce(
  (svg) => {
    placements.get(svg).near = true;
    drawWhenIdle(svg);
  },
  { rootMargin: "100% 0px" }
);

// Enough of it on screen to be watched being drawn. A drawing seen before the
// hand got to it starts as soon as it is drawn.
const seenObserver = watchOnce(
  (svg) => {
    placements.get(svg).seen = true;
    if (svg.childElementCount) startDrawingIn(svg);
  },
  { threshold: 0.2 }
);

// The width an element is laid out at, which a rotation of the element does
// not change. An element without a width is not shown, and what was drawn on
// it is left as it is.
const widthObserver = new ResizeObserver((entries) => {
  for (const { target, contentRect } of entries) {
    const placement = placements.get(target);
    if (!contentRect.width || contentRect.width === placement.width) continue;
    placement.width = contentRect.width;
    drawWhenIdle(target);
  }
});

const OBSERVERS = [nearObserver, seenObserver, widthObserver];

export default {
  // The classes written in the template are set after `created` and would
  // replace these.
  beforeMount(el, { value: { drawing, seed } }) {
    placements.set(el, { drawing, seed, width: 0, near: false, seen: false });
    el.classList.add("drawing", `drawing--${drawing.name}`);
    el.setAttribute("viewBox", drawing.viewBox.join(" "));
    // A drawing illustrates the words beside it and adds nothing to them.
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("--boil", `${PACES[seed % PACES.length]}s`);
    // Hidden until it is on screen, so that it can be watched being drawn.
    if (readDrawsIn()) el.dataset.arrival = Arrival.Waiting;
    el.addEventListener("animationend", finishDrawingIn);
  },
  mounted(el) {
    for (const observer of OBSERVERS) observer.observe(el);
  },
  unmounted(el) {
    for (const observer of OBSERVERS) observer.unobserve(el);
    waiting.delete(el);
  },
};
