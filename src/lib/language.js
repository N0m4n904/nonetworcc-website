// Which language the page is read in.
//
// German for a browser asking for German, English for every other — decided
// once, from the browser's own setting, with no switch to find and nothing
// stored. A visitor who wants the other one changes the setting they already
// have.
//
// navigator.languages is the ordered list the visitor actually configured;
// navigator.language is only the first of it. Either way it is the first
// entry that decides, so somebody whose browser asks for German first gets
// German, and somebody who merely has it further down the list does not.

import strings from "../strings.yaml";

export const DEFAULT = "en";

function chosen() {
  if (typeof navigator === "undefined") return DEFAULT;
  const first = (navigator.languages && navigator.languages[0]) || navigator.language || "";
  // "de", "de-DE", "de-AT", "de-CH" — the region does not change the copy.
  return /^de\b/i.test(first) ? "de" : DEFAULT;
}

export const lang = chosen();

// The strings for this language. Falls back to English rather than to nothing
// if a key is ever added to one and not the other.
export const t = strings[lang] || strings[DEFAULT];

// A field in content.yaml is either a plain string — the same in both
// languages, which is true of most titles — or a map of language to string.
// Anything missing falls back to English rather than disappearing.
export function say(value) {
  if (value == null) return value;
  if (typeof value === "string") return value;
  return value[lang] ?? value[DEFAULT] ?? "";
}
