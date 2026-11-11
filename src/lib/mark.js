// The marks a drawing is made of: what each is drawn with, and how.
//
// A mark is plain data, made by the words of drawing.js over one or more
// shapes (see shape.js).

export const Pencil = Object.freeze({
  // Lines of construction.
  Faint: "faint",
  Light: "light",
  Plain: "plain",
  Heavy: "heavy",
  // What shines, drawn in the accent colour.
  Lit: "lit",
});

// What an area is filled in as. A wash hides what was drawn before it.
export const Wash = Object.freeze({
  Paint: "paint",
  Glass: "glass",
  // What no light reaches: a tyre, the mesh of a grille, the inside of a wheel arch.
  Shade: "shade",
  // Polished metal.
  Metal: "metal",
});

export const Mark = Object.freeze({
  // A shape drawn along.
  Line: "line",
  // A shape drawn along and toned in.
  Filled: "filled",
  // Parallel strokes over the area its shapes enclose. A shape inside another is a hole.
  Hatching: "hatching",
  // A wash over the area its shapes enclose, with no line round it.
  Tone: "tone",
});
