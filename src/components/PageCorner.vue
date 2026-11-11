<script setup>
import { computed, ref, useTemplateRef, watchEffect } from "vue";

import SiteMark from "./SiteMark.vue";
import { usePageScrolled } from "../composables/usePageScrolled.js";
import { useSectionSpy } from "../composables/useSectionSpy.js";
import { MAIL_LINK } from "../lib/contact.js";
import { t } from "../lib/language.js";
import { SectionId } from "../lib/sections.js";

// What stands in the corners of the window: the label that leads home, the
// thumb index and the way to write.

const props = defineProps({
  // True once the name written across the first spread has left the window,
  // which is when the label shows it.
  named: { type: Boolean, required: true },
  // The ids of the sections that the index lists, in their order in the book.
  sections: { type: Array, required: true },
});

// On a folded book the row lies on a strip of the paper once a page has moved
// beneath it.
const { scrolled } = usePageScrolled();

// nav names each section in the index, under the id of the section.
const links = props.sections.map((id) => ({ id, name: t.nav[id] }));

// Nothing is marked on the first spread or on the cover. Both are watched all
// the same, so that the mark goes when the reader does.
const { current } = useSectionSpy([SectionId.Top, ...props.sections, SectionId.End]);

// The words on the tab of the folded index: the name of the section being
// read, or index.contents, "Contents", while none is.
const here = computed(() => links.find((link) => link.id === current.value)?.name ?? t.index.contents);

const open = ref(false);
const index = useTemplateRef("index");
const toggle = useTemplateRef("toggle");

// While the list is open, a press anywhere else closes it, and so does Escape.
watchEffect((onCleanup) => {
  if (!open.value) return;
  const closing = new AbortController();
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!index.value.contains(event.target)) open.value = false;
    },
    { signal: closing.signal }
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape") return;
      open.value = false;
      toggle.value.focus();
    },
    { signal: closing.signal }
  );
  onCleanup(() => closing.abort());
});
</script>

<template>
  <header class="corner" :data-named="named" :data-scrolled="scrolled">
    <a class="tab corner__home" :href="`#${SectionId.Top}`">
      <SiteMark />
      <span class="corner__name">Noah Anleitner</span>
    </a>

    <!-- index.sections is the name of the navigation for a screen reader. -->
    <nav ref="index" class="index" :data-open="open" :aria-label="t.index.sections">
      <button
        ref="toggle"
        class="tab index__toggle"
        type="button"
        :aria-expanded="open"
        aria-controls="index-list"
        @click="open = !open"
      >
        <svg class="index__ticks" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M8 10h9M3 15h14" /></svg>
        <span class="index__here">{{ here }}</span>
      </button>
      <ul class="index__list" id="index-list">
        <li v-for="link in links" :key="link.id">
          <a
            class="tab index__link"
            :href="`#${link.id}`"
            :aria-current="link.id === current ? 'true' : null"
            @click="open = false"
          ><span class="index__name">{{ link.name }}</span></a>
        </li>
      </ul>
    </nav>

    <!-- contact is the word on the button that opens a mail to Noah. -->
    <a class="tape corner__contact" :href="MAIL_LINK">{{ t.contact }}</a>
  </header>
</template>

<style>
/* ---------------------------------------------------------------------------
   The corners of the window: the name, the thumb index and the way to write.

   On a folded book the column of text is as wide as the window, so anything
   laid over it would cover a word. The three lie in one row on a strip of the
   paper there, and a page passing beneath is cut off at one straight edge.
   With both leaves open the outer margins are kept clear for them, and each
   takes a corner on a surface of its own.
   --------------------------------------------------------------------------- */

.corner {
  position: fixed;
  inset-block-start: 0;
  inset-inline: var(--binding) 0;
  z-index: var(--layer-corner);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: var(--strip);
  padding-inline: 0.5rem 1rem;
  /* Before the strip is laid down, the page shows between the three and can
     be pressed there. */
  pointer-events: none;
}

/* Positioned, so that each is painted over the strip, which comes first. */
.corner > * {
  position: relative;
  pointer-events: auto;
}

/* The strip is laid down once the page has moved: before that nothing is
   beneath the row. */
.corner::before {
  content: '';
  position: absolute;
  inset: 0;
  border-block-end: 1px solid var(--pencil-faint);
  background-color: var(--paper);
  opacity: 0;
  transition: opacity 0.3s var(--ease);
}

.corner[data-scrolled='true']::before {
  opacity: 1;
}

/* Laid down, the strip hides the page beneath it, and a press on the strip
   must not reach a link that cannot be seen. */
.corner[data-scrolled='true'] {
  pointer-events: auto;
}

.corner__home {
  flex: none;
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.35rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.15;
}

.corner__home .mark {
  width: 1.75rem;
  height: 1.75rem;
  flex: none;
  color: var(--accent-ink);
}

/* On the first screen the name is written across the page already. The label
   shows it once that one has left the window. One word to a line: a label
   that narrow fits the outer margin of an open book. */
.corner__name {
  width: min-content;
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-width 0.4s var(--ease), opacity 0.3s var(--ease), padding 0.4s var(--ease);
}

.corner__contact {
  flex: none;
  margin-inline-start: auto;
}

/* The thumb index. On a narrow window it is one tab in the row, with the name
   of the section being read on it. A press opens the list beneath it. */
.index {
  flex: 0 1 auto;
  min-width: 0;
  font-weight: 600;
  line-height: 1.2;
}

.index__list {
  position: absolute;
  inset-block-start: calc(100% + 0.5rem);
  inset-inline-start: 0;
  display: none;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.index[data-open='true'] .index__list {
  display: flex;
}

.index__toggle,
.index__link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 2.75rem;
  padding: 0.3rem 0.9rem 0.3rem 0.75rem;
  white-space: nowrap;
}

/* The row gives way here first: a window too narrow for all three shortens
   the name of the section. */
.index__toggle {
  max-width: 100%;
}

.index__here {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* In a window as narrow as a phone each of the three has less padding. The
   row then has room for the longest name of a section in a window 360px wide,
   with the way to write in English, the longer of the two. */
@media (max-width: 30rem) {
  .corner {
    gap: 0.375rem;
    padding-inline: 0.25rem 0.75rem;
  }

  .corner__contact {
    padding-inline: 0.8rem;
  }

  .index__toggle {
    gap: 0.5rem;
    padding-inline: 0.6rem 0.75rem;
  }
}

/* A window narrower than 352px has no room for the longer names. The tab is
   its ticks alone there, and a screen reader still reads the name. */
@media (max-width: 21.9375rem) {
  .index__toggle {
    justify-content: center;
    min-width: 2.75rem;
    padding-inline: 0.75rem;
  }

  .index__here {
    position: absolute;
    width: 1px;
    height: 1px;
    clip-path: inset(50%);
  }
}

.index__ticks {
  flex: none;
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}

/* The marker's swipe under the section being read. */
.index__name {
  padding-inline: 0.15em;
  background-image: linear-gradient(to top, var(--highlight) 0.55em, transparent 0);
  background-repeat: no-repeat;
  background-size: 0% 100%;
  transition: background-size 0.35s var(--ease);
}

.index__link[aria-current='true'] .index__name {
  background-size: 100% 100%;
}

/* From here up the index is at the outer edge, where the margin of a leaf is
   clear for it. The label has its end of the row to itself and shows the
   name. */
@media (min-width: 56rem) {
  .corner[data-named='true'] .corner__name {
    max-width: 6rem;
    padding-inline: 0.5rem 0.35rem;
    opacity: 1;
  }

  .index {
    position: fixed;
    inset-block-start: 5.25rem;
    inset-inline-end: 0;
  }

  .index__toggle {
    display: none;
  }

  .index__list {
    position: static;
    display: flex;
    align-items: flex-end;
    gap: 0;
  }

  /* Written on the page itself here: the margin is kept clear for it. The
     link is the word alone, so the pointer's ring loops the word and stays
     clear of the window's edge; the tick stands outside it, at the edge. */
  .index__link {
    position: relative;
    min-height: 2.5rem;
    margin-inline-end: 1.9rem;
    padding: 0.3rem 0.6rem;
    border-radius: 1.25rem;
    background-color: transparent;
    box-shadow: none;
    color: var(--ink-soft);
    transition: color 0.25s var(--ease);
  }

  .index__link:hover,
  .index__link[aria-current='true'] {
    color: var(--ink);
  }

  /* The tick at the edge of the leaf, longer beside the section in view. */
  .index__link::after {
    content: '';
    position: absolute;
    inset-inline-end: -1.9rem;
    width: 0.7rem;
    height: 2px;
    border-radius: 2px;
    background-color: var(--pencil-faint);
    transition: width 0.35s var(--ease), background-color 0.35s var(--ease);
  }

  .index__link[aria-current='true']::after {
    width: 1.2rem;
    background-color: var(--accent-ink);
  }
}

/* Both leaves open: no strip and no row. The label and the way to write take
   the upper corners, and the outer margin is wider than the label. */
@media (min-width: 78rem) {
  .corner {
    position: static;
    display: block;
    height: auto;
    padding: 0;
  }

  .corner::before {
    display: none;
  }

  .corner__home,
  .corner__contact,
  .index {
    position: fixed;
    z-index: var(--layer-corner);
  }

  .corner__home {
    inset-block-start: 0.75rem;
    inset-inline-start: 0.75rem;
    max-width: calc(var(--margin-outer) - 1.25rem);
    overflow: hidden;
  }

  .corner__contact {
    inset-block-start: 0.75rem;
    inset-inline-end: 1rem;
  }
}
</style>
