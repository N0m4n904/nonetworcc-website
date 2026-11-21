// v-edge: the edge a leaf ends in, laid out on the <svg> it is given.
//
//   <svg v-edge="{ shape: EdgeShape.Torn, side: EdgeSide.Below, seed: 41 }" />
//
// `shape` is a shape of lib/edge.js, and the course of the edge follows from
// `seed`: the same seed lays out the same edge on every visit, and an edge
// added to the page changes no other. `side` is where it lies against the leaf
// the element is in, whose colour it has as --paper-here. It is laid out again
// whenever its size changes, and what is inside the element is made here.

import { layEdge } from "../lib/edge.js";

const NS = "http://www.w3.org/2000/svg";

// The shape, side and seed of the edge on each element.
const placements = new WeakMap();

function createLayer({ layer, d }) {
  const path = document.createElementNS(NS, "path");
  path.setAttribute("class", `edge__${layer}`);
  path.setAttribute("d", d);
  return path;
}

const sizeObserver = new ResizeObserver((entries) => {
  for (const { target, contentRect } of entries) {
    if (!contentRect.width) continue;
    const { shape, side, seed } = placements.get(target);
    const layers = layEdge(shape, { side, seed, width: contentRect.width, depth: contentRect.height });
    target.replaceChildren(...layers.map(createLayer));
  }
});

export default {
  // The classes written in the template are set after `created` and would
  // replace these.
  beforeMount(el, { value: placement }) {
    placements.set(el, placement);
    el.classList.add("edge", `edge--${placement.side}`);
    // An edge is the end of a sheet of paper and adds nothing to the words.
    el.setAttribute("aria-hidden", "true");
  },
  mounted(el) {
    sizeObserver.observe(el);
  },
  unmounted(el) {
    sizeObserver.unobserve(el);
  },
};
