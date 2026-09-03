// Drawing on the page.
//
// The whole site is pretending to be drawn by hand, so it seemed only fair to
// let a visitor pick up the pencil. Strokes are kept in the browser that made
// them and nowhere else — they never leave the machine, and clearing them is
// one press.
//
// Costs nothing while it is off: no listeners are attached until the pencil is
// picked up, and the overlay is inert.

import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

const STORE = "scribbleV1";
// Enough to draw on, far short of enough to fill localStorage with.
const MOST_STROKES = 300;
// Points closer together than this add nothing a reader could see.
const LEAST_MOVE = 2.4;

export function useScribble() {
  const drawing = ref(false); // is the pencil in hand?
  const strokes = ref([]);
  const height = ref(0);
  const live = ref(null); // the stroke being drawn right now

  let observer = null;
  let pointer = null;
  let points = [];

  const empty = computed(() => strokes.value.length === 0 && !live.value);

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "[]");
      if (Array.isArray(saved)) strokes.value = saved.filter((d) => typeof d === "string");
    } catch {
      // A corrupted or unavailable store is not worth a broken page.
      strokes.value = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify(strokes.value));
    } catch {
      // Private windows and full quotas both land here. The drawing still
      // works for this visit; it simply will not be waiting next time.
    }
  }

  // A stroke as a smooth line through the points, rather than a run of
  // straight segments meeting at visible corners.
  function toPath(pts) {
    if (pts.length < 2) {
      const [p] = pts;
      // A tap is a dot: a zero-length line with a round cap draws one.
      return p ? `M${p[0]} ${p[1]}l0 0` : "";
    }
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      const [nx, ny] = pts[i + 1];
      d += `Q${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
    }
    const last = pts[pts.length - 1];
    return `${d}L${last[0]} ${last[1]}`;
  }

  function measure() {
    height.value = document.documentElement.scrollHeight;
  }

  // Page coordinates rather than viewport ones, so a drawing stays where it
  // was made when the page scrolls.
  function at(event) {
    return [
      Math.round((event.pageX + Number.EPSILON) * 10) / 10,
      Math.round((event.pageY + Number.EPSILON) * 10) / 10,
    ];
  }

  function down(event) {
    if (!event.isPrimary) return;
    pointer = event.pointerId;
    event.currentTarget.setPointerCapture(pointer);
    points = [at(event)];
    live.value = toPath(points);
  }

  function move(event) {
    if (pointer === null || event.pointerId !== pointer) return;
    const point = at(event);
    const previous = points[points.length - 1];
    const far =
      Math.abs(point[0] - previous[0]) + Math.abs(point[1] - previous[1]) >= LEAST_MOVE;
    if (!far) return;
    points.push(point);
    live.value = toPath(points);
  }

  function up(event) {
    if (pointer === null || event.pointerId !== pointer) return;
    pointer = null;
    if (points.length) {
      strokes.value = [...strokes.value, toPath(points)].slice(-MOST_STROKES);
      save();
    }
    points = [];
    live.value = null;
  }

  function undo() {
    strokes.value = strokes.value.slice(0, -1);
    save();
  }

  function clear() {
    strokes.value = [];
    save();
  }

  // Pick the pencil up, put it down, or swap.
  function put(on = !drawing.value) {
    drawing.value = on;
  }

  // The key is the only way in — there is no button to find, and the console
  // note is what tells anyone it exists. Escape is the way back out, because
  // it is the way out of everything else.
  function onKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    // Not while someone is typing into something.
    const el = document.activeElement;
    if (el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName))) return;

    if (event.key === "p" || event.key === "P") {
      event.preventDefault();
      put();
    } else if (event.key === "Escape" && drawing.value) {
      event.preventDefault();
      put(false);
    }
  }

  onMounted(() => {
    load();
    measure();
    if ("ResizeObserver" in window) {
      observer = new ResizeObserver(measure);
      observer.observe(document.documentElement);
    }
    window.addEventListener("keydown", onKey);
  });

  onBeforeUnmount(() => {
    if (observer) observer.disconnect();
    window.removeEventListener("keydown", onKey);
  });

  // Drawing and scrolling are the same gesture on a touch screen, so the page
  // is held still while the pencil is out.
  watch(drawing, (on) => {
    document.documentElement.classList.toggle("is-drawing", on);
    if (!on && pointer !== null) {
      pointer = null;
      points = [];
      live.value = null;
    }
  });

  return { drawing, strokes, live, height, empty, put, undo, clear, down, move, up };
}
