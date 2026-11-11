// Where a part of a drawing is placed: the six numbers [a, b, c, d, e, f] of an
// SVG matrix. A place (x, y) moves to (a·x + c·y + e, b·x + d·y + f).

export const IDENTITY = Object.freeze([1, 0, 0, 1, 0, 0]);

// The transform that does `inner` first and `outer` after it.
export const composeTransforms = (outer, inner) => [
  outer[0] * inner[0] + outer[2] * inner[1],
  outer[1] * inner[0] + outer[3] * inner[1],
  outer[0] * inner[2] + outer[2] * inner[3],
  outer[1] * inner[2] + outer[3] * inner[3],
  outer[0] * inner[4] + outer[2] * inner[5] + outer[4],
  outer[1] * inner[4] + outer[3] * inner[5] + outer[5],
];

export const applyTransform = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

export const toRadians = (degrees) => (degrees * Math.PI) / 180;

// A turn about a place, in degrees clockwise.
export function rotation(degrees, [cx, cy]) {
  const angle = toRadians(degrees);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [cos, sin, -sin, cos, cx - cx * cos + cy * sin, cy - cx * sin - cy * cos];
}
