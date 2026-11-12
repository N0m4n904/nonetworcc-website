// Path data, the text of the `d` attribute of an SVG path. Every path of the
// page writes its places here, each as two numbers to a tenth of a unit.

export const writePlace = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

// A line from the first of `places` through each of the others in turn.
export const writePolyline = (places) => `M${places.map(writePlace).join("L")}`;

// A polyline closed back to its first place.
export const writePolygon = (places) => `${writePolyline(places)}Z`;
