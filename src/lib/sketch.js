// A rounded box drawn by hand.
//
// Drawn at the element's own size rather than stretched to it. A single shape
// squashed to fit means the wobble is tiny on a tall box and wild on a wide
// one, and the corners smear; generating in pixels keeps the hand even
// everywhere and the corners round.
//
// Nothing here touches the DOM — it returns path data. The directive that uses
// it owns the elements.

const WIGGLE = 3.2; // how far the line strays, in pixels
const STEP = 46; // how often it strays: one deviation per this much edge
const RADIUS = 26;

// Seeded so a reload draws what the last one drew.
function hand(seed) {
  let state = seed * 9301 + 49297;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280 - 0.5;
  };
}

// One edge, wandering between its two ends.
function edge(from, to, along, across, rng, out) {
  const span = to - from;
  const steps = Math.max(2, Math.round(Math.abs(span) / STEP));
  for (let i = 1; i <= steps; i++) {
    const at = from + (span * i) / steps;
    const stray = rng() * WIGGLE * 2;
    const drift = rng() * WIGGLE;
    out.push(
      along === "x"
        ? `L${(at + drift).toFixed(1)} ${(across + stray).toFixed(1)}`
        : `L${(across + stray).toFixed(1)} ${(at + drift).toFixed(1)}`
    );
  }
}

export function box(w, h, seed) {
  const rng = hand(seed);
  const r = Math.min(RADIUS, w / 2 - 2, h / 2 - 2);
  const pad = 2;
  const x0 = pad;
  const y0 = pad;
  const x1 = w - pad;
  const y1 = h - pad;
  const d = [`M${(x0 + r).toFixed(1)} ${(y0 + rng() * WIGGLE).toFixed(1)}`];

  edge(x0 + r, x1 - r, "x", y0, rng, d);
  d.push(`Q${x1} ${y0} ${(x1 + rng() * WIGGLE).toFixed(1)} ${(y0 + r).toFixed(1)}`);
  edge(y0 + r, y1 - r, "y", x1, rng, d);
  d.push(`Q${x1} ${y1} ${(x1 - r).toFixed(1)} ${(y1 + rng() * WIGGLE).toFixed(1)}`);
  edge(x1 - r, x0 + r, "x", y1, rng, d);
  d.push(`Q${x0} ${y1} ${(x0 + rng() * WIGGLE).toFixed(1)} ${(y1 - r).toFixed(1)}`);
  edge(y1 - r, y0 + r, "y", x0, rng, d);
  d.push(`Q${x0} ${y0} ${(x0 + r).toFixed(1)} ${(y0 + rng() * WIGGLE).toFixed(1)}`);
  d.push("Z");
  return d.join("");
}

// A hand redrawing a line does not keep time, and neither should the page:
// every outline gets its own pace and starting point, taken from where it sits
// rather than drawn at random.
export const PACES = [0.26, 0.34, 0.3, 0.42, 0.38];
export const SHIFTS = [0, -0.11, -0.05, -0.17, -0.08, -0.14];
