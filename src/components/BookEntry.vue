<script>
import { Treatment } from "../lib/content.js";

// Declared in a block of their own, so that they exist once for the page and
// not once for every entry on it.

// The classes each treatment gives the sticker, and the entry where the
// treatment changes how the entry is laid out.
const TREATMENT_CLASSES = Object.freeze({
  [Treatment.Plate]: { sticker: "sticker--plate" },
  [Treatment.Past]: { sticker: "sticker--past" },
  [Treatment.Rounded]: { sticker: "sticker--rounded" },
  [Treatment.Wordmark]: { sticker: "sticker--wordmark", entry: "entry--wordmark" },
});

// How far a logo is turned, in degrees. An entry gets the one at its place in
// the list, and the list starts over after the last.
const TILTS = [-4, 3, -2, 4, -3, 2, -5];
</script>

<script setup>
import { computed } from "vue";

import IconLink from "./IconLink.vue";
import SiteMark from "./SiteMark.vue";
import { say } from "../lib/language.js";

// One entry of work or of the projects, set on the paper with no box around
// it: a logo stands there, a date is written under it, and the words stand
// beside.

const props = defineProps({
  // An entry under `work` or `projects` in src/content.yaml, as readContent of
  // src/lib/content.js returns it.
  entry: { type: Object, required: true },
  // Its place in that list, counted from zero.
  place: { type: Number, required: true },
  // The larger kind of entry: the employer and what is built there.
  lead: { type: Boolean, default: false },
});

const treatmentClasses = computed(() => TREATMENT_CLASSES[props.entry.media?.treatment]);
const tilt = computed(() => `${TILTS[props.place % TILTS.length]}deg`);
</script>

<template>
  <article class="entry" :class="[{ 'entry--lead': lead }, treatmentClasses?.entry]" :style="{ '--tilt': tilt }">
    <div v-if="entry.media || entry.date" class="entry__aside">
      <!-- One entry is this site. Its mark is drawn inline and has the colour
           of the ink in both themes. -->
      <SiteMark v-if="entry.media?.mark" />
      <span v-else-if="entry.media" class="sticker" :class="treatmentClasses?.sticker">
        <img :src="entry.media.src" :alt="entry.media.alt ?? ''" decoding="async" />
      </span>
      <span v-if="entry.date" class="entry__date">{{ entry.date }}</span>
    </div>
    <div class="entry__words">
      <h3 class="entry__title">
        <span class="entry__name">{{ say(entry.title) }}</span>
        <span v-if="entry.badge" class="stamp">{{ say(entry.badge) }}</span>
      </h3>
      <p class="entry__body">{{ say(entry.body) }}</p>
      <p v-if="entry.note" class="note entry__note">{{ say(entry.note) }}</p>
      <ul v-if="entry.links?.length" class="entry__links">
        <li v-for="link in entry.links" :key="link.href">
          <IconLink :href="link.href" :icon="link.icon">{{ say(link.text) }}</IconLink>
        </li>
      </ul>
    </div>
  </article>
</template>

<style>
/* ---------------------------------------------------------------------------
   An entry of work or of the projects.
   --------------------------------------------------------------------------- */

.entry {
  --sticker: 4.5rem;
  display: grid;
  grid-template-columns: 5.75rem minmax(0, 1fr);
  column-gap: clamp(0.9rem, 2vw, 1.25rem);
  align-items: start;
}

.entry + .entry {
  margin-block-start: clamp(2.5rem, 5vw, 3.5rem);
}

.entry__aside {
  display: grid;
  justify-items: center;
  gap: 0.55rem;
  padding-block-start: 0.2rem;
}

/* The last column, so that the words of an entry with neither a logo nor a
   date stand in line with those of the others. */
.entry__words {
  grid-column: -2 / -1;
}

/* A logo stands on the paper as its file is, a little askew. */
.sticker {
  display: grid;
  place-items: center;
  width: var(--sticker);
  aspect-ratio: 1;
  rotate: var(--tilt);
}

.sticker img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Printed on white: every logo of the work, a logo whose file has an opaque
   background of its own, and an app icon, whose white shows wherever its file
   is clear. */
:where(.entry--lead) .sticker,
.sticker--plate,
.sticker--rounded {
  padding: 0.5rem;
  border-radius: 14px;
  background-color: var(--paper-white);
  box-shadow: var(--shadow-low);
}

/* An app icon is its own sticker: it fills the square and has round corners. */
.sticker--rounded {
  padding: 0;
  overflow: hidden;
  border-radius: 22%;
}

.sticker--rounded img {
  object-fit: cover;
}

/* Work that is over reads as over: the colour drains out of its logo and
   returns while the entry is under the pointer or has the focus. */
.sticker--past img {
  filter: var(--drained);
  opacity: 0.6;
  transition: filter 0.4s var(--ease), opacity 0.4s var(--ease);
}

.entry:hover .sticker--past img,
.entry:focus-within .sticker--past img {
  filter: none;
  opacity: 1;
}

.entry .mark {
  width: var(--sticker);
  height: var(--sticker);
  color: var(--ink);
  rotate: var(--tilt);
}

.entry__date {
  color: var(--ink-note);
  font-size: var(--step-small);
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
  white-space: nowrap;
}

.entry__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1rem;
  font-size: var(--step-heading);
  font-weight: 700;
  line-height: 1.2;
}

/* A rubber stamp, pressed on a little askew. */
.stamp {
  padding: 0.15rem 0.6rem;
  border: 2px solid currentColor;
  border-radius: 6px 9px 5px 8px;
  color: var(--ink-note);
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.03em;
  white-space: nowrap;
  rotate: -3deg;
}

.entry__body {
  max-width: var(--measure);
  margin-block-start: 0.5rem;
  color: var(--ink-soft);
}

.entry__note {
  margin-block-start: 0.45rem;
}

.entry__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 1.4rem;
  margin-block-start: 0.85rem;
}

/* The employer and what is built there stand larger than a side project. */
.entry--lead {
  --sticker: 6rem;
  grid-template-columns: 6.75rem minmax(0, 1fr);
}

.entry--lead .entry__title {
  font-size: clamp(1.5rem, 1.25rem + 1vw, 2.1rem);
}

.entry--lead .entry__body {
  font-size: var(--step-lead);
  line-height: 1.6;
}

/* A wordmark is a line of type. It has its own ratio and is set above the
   words. On paper no logo is printed, and the title is set as for any entry. */
@media screen {
  .entry--wordmark {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 1.1rem;
  }

  .entry--wordmark .entry__aside {
    justify-items: start;
  }

  /* The wordmark is the title already. The heading is still there for a
     screen reader. */
  .entry--wordmark .entry__title {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .entry--wordmark .entry__body {
    margin-block-start: 0;
  }

  .sticker--wordmark {
    width: min(13.5rem, 80%);
    aspect-ratio: auto;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    rotate: -2deg;
  }
}

@media (max-width: 30rem) {
  .entry {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 0.9rem;
  }

  .entry__aside {
    grid-auto-flow: column;
    justify-content: start;
    align-items: end;
    gap: 1rem;
  }
}
</style>
