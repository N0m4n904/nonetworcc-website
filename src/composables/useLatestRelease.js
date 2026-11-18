// The latest release of a project, once its source has returned one.
//
// The answer is looked up when the component is mounted, from local storage
// where an answer younger than an hour is kept there, and from the source
// otherwise. The ref is empty until the answer is a release, and stays empty
// for every other outcome.

import { onMounted, shallowRef } from "vue";

import { ReleaseLookup } from "../lib/release.js";
import { lookUpRememberedRelease } from "../lib/release-memory.js";

export function useLatestRelease(releases) {
  const release = shallowRef();
  onMounted(async () => {
    const lookup = await lookUpRememberedRelease(releases);
    if (lookup.outcome === ReleaseLookup.Found) release.value = lookup.release;
  });
  return release;
}
