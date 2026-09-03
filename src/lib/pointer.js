// Is there a real pointer and a keyboard behind this page?
//
// Asked once, at load. The pencil needs both — a mouse or a stylus to draw a
// line with, and a keyboard to press P on — so on a phone there is no way in
// and nothing to gain by building it. Anything that depends on this is left
// out entirely rather than hidden, which is the difference between costing
// nothing and costing a little.

export const hasFinePointer =
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;
