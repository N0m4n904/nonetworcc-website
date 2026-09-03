// v-outline — the drawn box around a tile.
//
// Two drawings per outline, swapped by the boil in CSS, and both redrawn if the
// box changes size: a tile changes height when the window narrows and its text
// rewraps, and the line has to be redrawn for the box it now is.
//
// The element keeps its own drawing rather than the page keeping a list of
// them, so a tile added to the YAML gets an outline by existing.

import { box, PACES, SHIFTS } from "../lib/sketch.js";

const NS = "http://www.w3.org/2000/svg";

// Each outline is drawn at its own pace and out of step with its neighbours,
// taken from where it sits rather than at random. Mount order is document
// order, so neighbours differ and a reload draws what the last one drew.
let placed = 0;

let resize = null;
const queued = new Set();

function watcher() {
  if (resize || !("ResizeObserver" in window)) return resize;
  let pending = false;
  resize = new ResizeObserver((entries) => {
    for (const entry of entries) queued.add(entry.target);
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      for (const el of queued) draw(el);
      queued.clear();
    });
  });
  return resize;
}

function draw(host) {
  const w = host.offsetWidth;
  const h = host.offsetHeight;
  if (!w || !h) return;

  const index = Number(host.dataset.outline);
  let svg = host.querySelector(":scope > .drawn");
  if (!svg) {
    svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "drawn");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.appendChild(document.createElementNS(NS, "path"));
    svg.appendChild(document.createElementNS(NS, "path"));
    svg.style.setProperty("--boil", `${PACES[index % PACES.length]}s`);
    svg.style.setProperty("--boil-shift", `${SHIFTS[index % SHIFTS.length]}s`);
    host.appendChild(svg);
  }

  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const paths = svg.querySelectorAll("path");
  paths[0].setAttribute("d", box(w, h, index + 1));
  paths[1].setAttribute("d", box(w, h, index + 101));
}

export default {
  created(el) {
    el.dataset.outline = placed++;
  },
  mounted(el) {
    // The class says the border has been replaced by a drawing; until then the
    // plain border is what shows.
    el.classList.add(el.classList.contains("tile") ? "tile--sketched" : "post-stub--sketched");
    draw(el);
    const observer = watcher();
    if (observer) observer.observe(el);
  },
  unmounted(el) {
    if (resize) resize.unobserve(el);
    queued.delete(el);
  },
};
