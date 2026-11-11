// Is there a real pointer behind this page?
//
// Asked once, at load. The pencil needs a mouse or a stylus to draw a line
// with, so on a phone there is nothing to gain by building it. Anything that
// depends on this is left out of the page: a part built and hidden still
// costs a little, and a part left out costs nothing.

export const hasFinePointer =
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;
