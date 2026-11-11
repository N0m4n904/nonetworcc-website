// How a word of a drawing is defined (see drawing.js): by what it is given.
//
// A drawing is written once and drawn much later, in the browser of a visitor.
// What cannot be drawn therefore has to fail where it is written. So no word
// reads its arguments itself: it is defined with a description of each of them,
// and it is called only with arguments that fit.
//
// A description is { name, test }. `test` returns whether a thing fits. `name`
// goes into the message of the error thrown for a thing that does not, so it is
// worded as what to write in its place.

export const aNumber = { name: "a number", test: Number.isFinite };

// The hand divides by such a number or adds it up until it has passed an edge,
// and would not finish with 0.
export const aPositiveNumber = { name: "a number above 0", test: (given) => Number.isFinite(given) && given > 0 };

export const aCount = { name: "a whole number above 0", test: (given) => Number.isInteger(given) && given > 0 };

const nothing = { name: "left out", test: (given) => given === undefined };

// A list of one thing for each description, in their order.
export const tuple = (name, ...items) => ({
  name,
  test: (given) =>
    Array.isArray(given) && given.length === items.length && items.every((item, i) => item.test(given[i])),
});

export const aPlace = tuple("a place [x, y]", aNumber, aNumber);

export const listOf = (name, item) => ({ name, test: (given) => Array.isArray(given) && given.every(item.test) });

// An object written with any names, whose values all fit one description.
export const mapOf = (name, item) => ({
  name,
  test: (given) => given?.constructor === Object && Object.values(given).every(item.test),
});

// One of the values of a closed set.
export const oneOf = (name, values) => ({ name, test: (given) => values.includes(given) });

// What a word made as one of these kinds.
export const ofKind = (name, kinds) => ({ name, test: (given) => kinds.includes(given?.kind) });

export const optional = ({ name, test }) => ({
  name: `${name}, or ${nothing.name}`,
  test: (given) => nothing.test(given) || test(given),
});

// An object written with these fields and no others.
export const record = (fields) => ({
  name: `an object { ${Object.entries(fields).map(([key, field]) => `${key}: ${field.name}`).join("; ")} }`,
  test: (given) =>
    given?.constructor === Object &&
    Object.keys(given).every((key) => Object.hasOwn(fields, key)) &&
    Object.entries(fields).every(([key, field]) => field.test(given[key])),
});

// As JSON, which has no way to write NaN, Infinity, undefined or a function.
const show = (given) =>
  JSON.stringify(given, (_, value) => (typeof value === "number" && !Number.isFinite(value) ? String(value) : value)) ??
  String(given);

// The word `name`, which makes what `make` returns. `first` describes its
// arguments one by one, and `rest` each argument after those.
export const defineWord = (name, { first = [], rest = nothing }, make) =>
  (...given) => {
    for (let i = 0; i < Math.max(given.length, first.length); i++) {
      const expected = first[i] ?? rest;
      if (!expected.test(given[i])) {
        throw new TypeError(`${name}: argument ${i + 1} has to be ${expected.name}, and is ${show(given[i])}.`);
      }
    }
    return make(...given);
  };
