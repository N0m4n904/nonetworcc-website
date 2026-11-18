// The places in a string of strings.yaml that the page fills, written
// `{name}`, such as `{tag}` in "Release {tag}".

// `text` with each place filled with values[name], as it is written. A place
// without a value is a mistake in the code that fills it, and throws.
export function fillPlaces(text, values) {
  return text.replace(/\{(\w+)\}/g, (place, name) => {
    if (!Object.hasOwn(values, name)) throw new Error(`No value for the place ${place} in "${text}".`);
    return values[name];
  });
}
