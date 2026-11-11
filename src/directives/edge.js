// v-edge: the edge a leaf ends in, laid out on the <svg> it is given.
//
//   <svg v-edge="{ shape: EdgeShape.Torn, seed: 41 }" />
//
// `shape` is a shape of lib/edge.js, and the course of the edge follows from
// `seed`: the same seed lays out the same edge on every visit, and an edge
// added to the page changes no other. The edge hangs below the leaf the element is in
// and has the colour that leaf sets as --paper-here. With the class
// `edge--above` it is on top of the leaf. It is laid out again whenever its
// width changes, and what is inside the element is made here.

import { layEdge } from "../lib/edge.js";

const NS = "http://www.w3.org/2000/svg";

// The shape and the seed of the edge on each element.
const placements = new WeakMap();

function createLayer({ layer, d }) {
  const path = document.createElementNS(NS, "path");
  path.setAttribute("class", `edge__${layer}`);
  path.setAttribute("d", d);
  return path;
}

const widthObserver = new ResizeObserver((entries) => {
  for (const { target, contentRect } of entries) {
    if (!contentRect.width) continue;
    const { shape, seed } = placements.get(target);
    target.replaceChildren(...layEdge(shape, { width: contentRect.width, seed }).map(createLayer));
  }
});

export default {
  // The classes written in the template are set after `created` and would
  // replace this one.
  beforeMount(el, { value: placement }) {
    placements.set(el, placement);
    el.classList.add("edge");
    // An edge is the end of a sheet of paper and adds nothing to the words.
    el.setAttribute("aria-hidden", "true");
  },
  mounted(el) {
    widthObserver.observe(el);
  },
  unmounted(el) {
    widthObserver.unobserve(el);
  },
};
