<script>
import { lang } from "../lib/language.js";

// Once for the page, not once for every entry.
const writeDay = new Intl.DateTimeFormat(lang, { dateStyle: "long" });
</script>

<script setup>
import { computed } from "vue";

import { useLatestRelease } from "../composables/useLatestRelease.js";
import { t } from "../lib/language.js";
import { fillPlaces } from "../lib/text-places.js";

// The latest release of a project, stamped under its title. Nothing is shown
// for a project without a release, or while and when the request fails.

const props = defineProps({
  // Where the project publishes its releases, as findReleases of
  // src/lib/release-sources.js returns it.
  releases: { type: Object, required: true },
});

const release = useLatestRelease(props.releases);

const stampText = computed(() => fillPlaces(t.projects.release, { tag: release.value.tag }));
const tooltip = computed(() => fillPlaces(t.projects.published, { day: writeDay.format(release.value.published) }));
</script>

<template>
  <a v-if="release" class="stamp stamp--release" :href="release.address" :title="tooltip">{{ stampText }}</a>
</template>

<style>
/* In the green of the accent, on a separate line under the title, askew the
   other way from the stamp beside the title. A long tag breaks where it has
   to. */
.stamp--release {
  display: block;
  width: fit-content;
  max-width: 100%;
  margin-block-start: 0.4rem;
  color: var(--accent-deep);
  text-decoration: none;
  white-space: normal;
  overflow-wrap: anywhere;
  rotate: 2deg;
}

@media (prefers-reduced-motion: no-preference) {
  .stamp--release {
    animation: release-arrives 0.5s var(--ease) both;
  }
}

@keyframes release-arrives {
  from {
    opacity: 0;
    translate: 0 3px;
  }
}
</style>
